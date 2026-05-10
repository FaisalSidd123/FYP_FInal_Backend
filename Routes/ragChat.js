const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const RAG_API_URL = process.env.RAG_API_URL || 'https://repaying-attendee-frenzied.ngrok-free.dev';

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
            // Create a session in our DB (Alternatively, could hit Model 2 /sessions, but Model 2 auto-creates if missing during /query, so creating local is fine)
            const insertSession = await pool.query(
                `INSERT INTO chat_sessions (case_id, session_name, session_type) VALUES ($1, $2, $3) RETURNING id`,
                [caseId, `Case ${caseId} Discussion`, 'clinical_chat']
            );
            sessionId = insertSession.rows[0].id;
        } else {
            sessionId = sessionRes.rows[0].id;
        }

        // 2. Fetch history
        const historyRes = await pool.query(
            `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
            [sessionId]
        );

        res.status(200).json({
            success: true,
            session_id: sessionId,
            messages: historyRes.rows
        });
    } catch (error) {
        console.error('❌ Error fetching RAG chat history:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// POST /api/rag/query
// Proxies query to FastAPI Model 2 and saves to local DB
// ============================================
router.post('/query', verifyToken, async (req, res) => {
    try {
        const { case_id, user_query, session_id } = req.body;

        if (!case_id || !user_query) {
            return res.status(400).json({ success: false, error: 'case_id and user_query are required' });
        }

        const access = await checkCaseAccess(case_id, req.user);
        if (access.error) return res.status(access.status).json({ success: false, error: access.error });

        // Ensure we have a local session
        let activeSessionId = session_id;
        if (!activeSessionId) {
            const sessionRes = await pool.query('SELECT id FROM chat_sessions WHERE case_id = $1 ORDER BY created_at DESC LIMIT 1', [case_id]);
            if (sessionRes.rows.length > 0) {
                activeSessionId = sessionRes.rows[0].id;
            } else {
                const insertSession = await pool.query(
                    `INSERT INTO chat_sessions (case_id, session_name, session_type) VALUES ($1, $2, $3) RETURNING id`,
                    [case_id, `Case ${case_id} Discussion`, 'clinical_chat']
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

        // 🚀 Forward to RAG API (Model 2)
        console.log(`Forwarding query to ${RAG_API_URL}/query`);
        let ragResponseData = null;
        try {
            const response = await fetch(`${RAG_API_URL}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_query: user_query,
                    case_id: parseInt(case_id),
                    // Let FastAPI generate its own session or link by case_id
                    session_type: "clinical_chat" 
                })
            });
            
            if (!response.ok) {
                throw new Error(`RAG API returned ${response.status}`);
            }
            ragResponseData = await response.json();
            
        } catch (apiError) {
            console.error('❌ RAG API Error:', apiError);
            return res.status(502).json({ 
                success: false, 
                error: 'Failed to communicate with RAG API',
                user_message: userMessage
            });
        }

        // Save AI message to local DB
        const aiContent = ragResponseData.clinical_response || "Sorry, I could not generate a response.";
        const citations = ragResponseData.citations || [];
        const metadata = {
            mode: ragResponseData.mode,
            retrieval_eval: ragResponseData.retrieval_eval,
            case_chunks_used: ragResponseData.case_chunks_used,
            latency_seconds: ragResponseData.latency_seconds,
            active_llm: ragResponseData.active_llm
        };

        const insertAiMsg = await pool.query(
            `INSERT INTO chat_messages (case_id, session_id, role, message_type, content, cited_documents, metadata) 
             VALUES ($1, $2, 'assistant', 'text', $3, $4, $5) RETURNING *`,
            [case_id, activeSessionId, aiContent, JSON.stringify(citations), JSON.stringify(metadata)]
        );
        const aiMessage = insertAiMsg.rows[0];

        res.status(200).json({
            success: true,
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
