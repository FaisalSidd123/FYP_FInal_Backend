const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const RAG_BASE_URL = process.env.RAG_BASE_URL || process.env.RAG_API_URL || 'https://clickless-aaliyah-maternally.ngrok-free.dev';

// Helper to check case access
async function checkCaseAccess(caseId, reqUser) {
    const caseCheck = await pool.query(
        'SELECT dc.id, u.uid as user_firebase_uid FROM diagnosis_cases dc JOIN users u ON dc.user_internal_uuid = u.internal_uuid WHERE dc.id = $1',
        [caseId]
    );

    if (caseCheck.rows.length === 0) return { error: 'Case not found', status: 404 };
    if (caseCheck.rows[0].user_firebase_uid !== reqUser.uid) return { error: 'Forbidden: Access denied', status: 403 };
    return { success: true };
}

// ============================================
// GET /api/rag/case/:caseId/history
// Gets the chat history for a specific case, and creates a session if one doesn't exist
// ============================================
router.get('/case/:caseId/history', verifyToken, async (req, res) => {
    try {
        const { caseId } = req.params;
        const access = await checkCaseAccess(caseId, req.user);
        if (access.error) return res.status(access.status).json({ success: false, error: access.error });

        // 1. Get or create session
        let sessionRes = await pool.query('SELECT id FROM chat_sessions WHERE case_id = $1 ORDER BY created_at DESC LIMIT 1', [caseId]);
        let sessionId;

        if (sessionRes.rows.length === 0) {
            console.log(`Creating a new RAG v6 session for case ${caseId} at ${RAG_BASE_URL}/sessions...`);
            let sessionData = null;
            try {
                const sessionResponse = await fetch(`${RAG_BASE_URL}/sessions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        case_id: parseInt(caseId),
                        session_type: "clinical_chat",
                        session_name: `Case ${caseId} Discussion`
                    })
                });

                if (!sessionResponse.ok) {
                    throw new Error(`RAG API sessions returned status ${sessionResponse.status}`);
                }
                sessionData = await sessionResponse.json();
            } catch (sessionApiError) {
                console.error('⚠️ Failed to register session with RAG v6 FastAPI service:', sessionApiError);
                // Fallback: Generate local UUID if RAG service is unreachable during history load
                const { v4: uuidv4 } = require('uuid');
                sessionData = { session_id: uuidv4() };
            }

            // Create the session in our local database mapping to the session_id UUID returned
            const insertSession = await pool.query(
                `INSERT INTO chat_sessions (id, case_id, session_name, session_type) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [sessionData.session_id, caseId, `Case ${caseId} Discussion`, 'clinical_chat']
            );
            sessionId = insertSession.rows[0].id;
            console.log(`✅ Session registered locally with ID: ${sessionId}`);
        } else {
            sessionId = sessionRes.rows[0].id;
        }

        // 2. Fetch history
        const historyRes = await pool.query(
            `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
            [sessionId]
        );

        const filteredMessages = historyRes.rows.map(msg => {
            if (msg.content && msg.content.toLowerCase().includes("context loaded into ai")) {
                return {
                    ...msg,
                    content: msg.content.replace(/context loaded into ai/gi, "").trim()
                };
            }
            return msg;
        }).filter(msg => msg.content && msg.content.trim() !== "");

        res.status(200).json({
            success: true,
            session_id: sessionId,
            messages: filteredMessages
        });
    } catch (error) {
        console.error('❌ Error fetching RAG chat history:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// POST /api/rag/query
// Proxies query to FastAPI Clinical RAG v6 model and saves to local DB
// ============================================
router.post('/query', verifyToken, async (req, res) => {
    try {
        const { case_id, user_query, session_id } = req.body;

        if (!case_id || !user_query) {
            return res.status(400).json({ success: false, error: 'case_id and user_query are required' });
        }

        const access = await checkCaseAccess(case_id, req.user);
        if (access.error) return res.status(access.status).json({ success: false, error: access.error });

        // Ensure we have an active local session
        let activeSessionId = session_id;
        if (!activeSessionId) {
            const sessionRes = await pool.query('SELECT id FROM chat_sessions WHERE case_id = $1 ORDER BY created_at DESC LIMIT 1', [case_id]);
            if (sessionRes.rows.length > 0) {
                activeSessionId = sessionRes.rows[0].id;
            } else {
                console.log(`Initializing new session for query because none was found...`);
                let sessionData = null;
                try {
                    const sessionResponse = await fetch(`${RAG_BASE_URL}/sessions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            case_id: parseInt(case_id),
                            session_type: "clinical_chat",
                            session_name: `Case ${case_id} Discussion`
                        })
                    });
                    if (sessionResponse.ok) {
                        sessionData = await sessionResponse.json();
                    } else {
                        throw new Error(`RAG API returned status ${sessionResponse.status}`);
                    }
                } catch (sessionApiError) {
                    console.error('⚠️ Session API Error:', sessionApiError);
                    const { v4: uuidv4 } = require('uuid');
                    sessionData = { session_id: uuidv4() };
                }

                const insertSession = await pool.query(
                    `INSERT INTO chat_sessions (id, case_id, session_name, session_type) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [sessionData.session_id, case_id, `Case ${case_id} Discussion`, 'clinical_chat']
                );
                activeSessionId = insertSession.rows[0].id;
            }
        }

        // Save USER message to local DB
        const insertUserMsg = await pool.query(
            `INSERT INTO chat_messages (case_id, session_id, role, message_type, content) 
             VALUES ($1, $2, 'user', 'text', $3) RETURNING *`,
            [case_id, activeSessionId, user_query]
        );
        const userMessage = insertUserMsg.rows[0];

        // 🚀 Forward to Clinical RAG v6 API
        console.log(`Forwarding query to RAG v6 at ${RAG_BASE_URL}/chat`);
        let ragResponseData = null;
        let responseStatus = 200;
        let response = null;

        try {
            response = await fetch(`${RAG_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: user_query,
                    case_id: parseInt(case_id),
                    session_id: activeSessionId,
                    attached_xray_url: null,
                    attached_pdf_url: null
                })
            });
            responseStatus = response.status;
            if (response.ok) {
                ragResponseData = await response.json();
            }
        } catch (apiError) {
            console.error('⚠️ Initial RAG Chat Fetch Error:', apiError);
            responseStatus = 500;
        }

        // If the RAG server returned a 404 (session not found on the remote server, likely due to a restart)
        if (responseStatus === 404) {
            console.warn(`⚠️ RAG Server returned 404 for session ${activeSessionId}. Re-initializing session on RAG server...`);
            
            let newSessionData = null;
            try {
                const sessionResponse = await fetch(`${RAG_BASE_URL}/sessions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: activeSessionId, // Send existing session_id to see if RAG accepts it
                        case_id: parseInt(case_id),
                        session_type: "clinical_chat",
                        session_name: `Case ${case_id} Discussion`
                    })
                });
                
                if (sessionResponse.ok) {
                    newSessionData = await sessionResponse.json();
                } else {
                    throw new Error(`Failed to re-initialize session. Status: ${sessionResponse.status}`);
                }
            } catch (sessionErr) {
                console.error('❌ Failed to re-register session on RAG server:', sessionErr);
            }

            if (newSessionData && newSessionData.session_id) {
                const newSessionId = newSessionData.session_id;
                
                // If RAG returned a new/different session_id, sync our local database mapping
                if (newSessionId !== activeSessionId) {
                    console.log(`🔄 Syncing local DB to new RAG session ID: ${newSessionId} (was: ${activeSessionId})`);
                    try {
                        // 1. Insert the new session row first
                        await pool.query(
                            `INSERT INTO chat_sessions (id, case_id, session_name, session_type) 
                             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
                            [newSessionId, case_id, `Case ${case_id} Discussion`, 'clinical_chat']
                        );
                        
                        // 2. Update user message we just saved to the new session ID
                        await pool.query(
                            `UPDATE chat_messages SET session_id = $1 WHERE id = $2`,
                            [newSessionId, userMessage.id]
                        );
                        
                        // 3. Update all previous messages in that old session as well
                        await pool.query(
                            `UPDATE chat_messages SET session_id = $1 WHERE session_id = $2`,
                            [newSessionId, activeSessionId]
                        );
                        
                        // 4. Delete the old session row
                        await pool.query(
                            `DELETE FROM chat_sessions WHERE id = $1`,
                            [activeSessionId]
                        );
                        
                        activeSessionId = newSessionId;
                    } catch (dbSyncErr) {
                        console.error('❌ Database sync failed during RAG session recreation:', dbSyncErr);
                    }
                }

                // Retry the chat request with the newly active session ID!
                console.log(`🔄 Retrying chat query with verified active session: ${activeSessionId}`);
                try {
                    const retryResponse = await fetch(`${RAG_BASE_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            query: user_query,
                            case_id: parseInt(case_id),
                            session_id: activeSessionId,
                            attached_xray_url: null,
                            attached_pdf_url: null
                        })
                    });
                    
                    if (retryResponse.ok) {
                        ragResponseData = await retryResponse.json();
                        responseStatus = 200;
                    } else {
                        throw new Error(`RAG API returned status ${retryResponse.status} on retry`);
                    }
                } catch (retryErr) {
                    console.error('❌ Retry chat query failed:', retryErr);
                    responseStatus = 502;
                }
            }
        }

        // If it's still not ok, fail gracefully
        if (responseStatus !== 200 || !ragResponseData) {
            return res.status(responseStatus === 404 ? 502 : responseStatus).json({
                success: false,
                error: 'Failed to communicate with RAG API after auto-recovery attempts.',
                user_message: userMessage
            });
        }

        // Save AI message to local DB
        let aiContent = ragResponseData.answer || "Sorry, I could not generate a response.";
        if (aiContent.toLowerCase().includes("context loaded into ai")) {
            aiContent = aiContent.replace(/context loaded into ai/gi, "").trim();
        }
        const citations = ragResponseData.citations || [];
        const intent = ragResponseData.intent || 'clinical_query';
        const metadata = {
            retrieval_count: ragResponseData.retrieval_count,
            top_score: ragResponseData.top_score,
            used_modes: ragResponseData.used_modes,
            ai_baseline_used: ragResponseData.ai_baseline_used,
            model: ragResponseData.model,
            latency_s: ragResponseData.latency_s,
            rewritten_query: ragResponseData.rewritten_query,
            xray_ingest: ragResponseData.xray_ingest,
            pdf_ingest: ragResponseData.pdf_ingest
        };

        const insertAiMsg = await pool.query(
            `INSERT INTO chat_messages (case_id, session_id, role, message_type, content, cited_documents, token_count, intent, metadata) 
             VALUES ($1, $2, 'assistant', 'text', $3, $4, $5, $6, $7) RETURNING *`,
            [
                case_id, 
                activeSessionId, 
                aiContent, 
                JSON.stringify(citations), 
                null, // token_count (null/not currently returned by RAG chat JSON but supported by schema)
                intent,
                JSON.stringify(metadata)
            ]
        );
        const aiMessage = insertAiMsg.rows[0];

        // Keep local chat_sessions total_turns updated
        await pool.query(
            `UPDATE chat_sessions 
             SET total_turns = COALESCE(total_turns, 0) + 2, 
                 last_intent = $1, 
                 updated_at = NOW() 
             WHERE id = $2`,
            [intent, activeSessionId]
        );

        res.status(200).json({
            success: true,
            session_id: activeSessionId,
            user_message: userMessage,
            ai_message: aiMessage,
            rag_details: ragResponseData
        });

    } catch (error) {
        console.error('❌ Error in POST /api/rag/query:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
