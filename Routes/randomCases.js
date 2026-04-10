// backend/routes/randomCases.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const OpenAI = require('openai');

// ── NVIDIA client (OpenAI-compatible SDK) ────────────────────────────────────
const nvidiaClient = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY,
});

const NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';


// ============================================
// GET /api/random-cases
// Get random cases (unchanged logic, now also
// returns theory_questions from the new column)
// ============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const { limit = 3 } = req.query;

        console.log('📋 Fetching random cases...');

        const query = `
            SELECT
                rc.*,
                COUNT(ca.id)                      AS times_used,
                COALESCE(AVG(ca.score), 0)::integer AS avg_score
            FROM random_cases rc
            LEFT JOIN case_attempts ca ON rc.id = ca.case_id
            GROUP BY rc.id
            ORDER BY RANDOM()
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);

        console.log(`✅ Found ${result.rows.length} random cases`);

        res.status(200).json({
            success: true,
            cases: result.rows,   // theory_questions JSONB comes along automatically
        });

    } catch (error) {
        console.error('❌ Error fetching random cases:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// ============================================
// GET /api/random-cases/:id
// Get single case by UUID
// ============================================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM random_cases WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        res.status(200).json({ success: true, case: result.rows[0] });

    } catch (error) {
        console.error('❌ Error fetching case:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// ============================================
// POST /api/random-cases/evaluate-theory
// Calls NVIDIA API to score a single paragraph
// answer against the model answer.
// Body: { question, model_answer, user_answer, keywords[] }
// Returns: { score, grade, feedback, key_points_covered, key_points_total }
// ============================================
router.post('/evaluate-theory', verifyToken, async (req, res) => {
    const { question, model_answer, user_answer, keywords = [] } = req.body;

    if (!question || !model_answer || !user_answer?.trim()) {
        return res.status(400).json({
            success: false,
            error: 'question, model_answer, and user_answer are all required',
        });
    }

    const keywordHint = keywords.length
        ? `Key medical concepts expected: ${keywords.join(', ')}.`
        : '';

    const prompt = `You are a strict but fair medical education evaluator.

QUESTION: ${question}

MODEL ANSWER: ${model_answer}

${keywordHint}

STUDENT ANSWER: ${user_answer}

Respond ONLY with a valid JSON object — no markdown, no extra text:
{
  "score": <integer 0-10>,
  "grade": "<Excellent|Good|Partial|Insufficient>",
  "feedback": "<2-3 sentences: acknowledge what was correct, state what was missing or wrong, suggest what to review>",
  "key_points_covered": <integer>,
  "key_points_total": <integer>
}

Scoring rubric:
9-10 → Comprehensive, accurate, correct medical terminology
7-8  → Mostly correct with minor omissions
5-6  → Core concept understood but significant gaps
3-4  → Partial understanding, notable errors
0-2  → Incorrect or irrelevant`;

    try {
        const completion = await nvidiaClient.chat.completions.create({
            model: NVIDIA_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            top_p: 0.7,
            max_tokens: 400,
        });

        const raw = completion.choices[0]?.message?.content || '{}';
        const clean = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        // Clamp score to valid range
        const score = Math.min(10, Math.max(0, parseInt(parsed.score) || 0));

        console.log(`✅ Theory evaluation complete — score: ${score}/10`);

        return res.status(200).json({
            success: true,
            score,
            grade: parsed.grade || 'Insufficient',
            feedback: parsed.feedback || 'No feedback available.',
            key_points_covered: parsed.key_points_covered || 0,
            key_points_total: parsed.key_points_total || 0,
        });

    } catch (error) {
        console.error('❌ NVIDIA evaluation error:', error);
        return res.status(500).json({
            success: false,
            error: 'AI evaluation failed',
            // Safe fallback so the frontend never breaks
            score: 0,
            grade: 'Error',
            feedback: 'Evaluation service unavailable. Please try again.',
            key_points_covered: 0,
            key_points_total: 0,
        });
    }
});


// ============================================
// POST /api/random-cases/attempt
// Save a completed quiz attempt.
// Handles both quiz_type: "mcq" and "theory".
// ============================================
router.post('/attempt', verifyToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            case_id,
            quiz_type = 'mcq',          // NEW — "mcq" | "theory"

            // MCQ fields (existing)
            answers = [],
            score = 0,
            total_questions,
            time_spent = 0,

            // Theory fields (new)
            theory_answers = [],   // [{question_index, answer_text, score, grade, feedback, ...}]
            total_possible_score,       // theory: total_questions * 10
        } = req.body;

        // Always trust the verified JWT for the UID instead of request body
        const uid = req.user.uid;

        console.log('📝 Saving case attempt:', { case_id, uid, quiz_type, score });

        await client.query('BEGIN');

        // Resolve firebase uid → internal uuid (same as before)
        const userResult = await client.query(
            'SELECT internal_uuid FROM users WHERE uid = $1',
            [uid]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userInternalUuid = userResult.rows[0].internal_uuid;

        // Insert attempt — new columns have DB defaults so old MCQ saves still work
        const insertResult = await client.query(
            `INSERT INTO case_attempts (
                case_id,
                user_internal_uuid,
                quiz_type,
                answers,
                theory_answers,
                score,
                total_questions,
                total_possible_score,
                time_spent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                case_id,
                userInternalUuid,
                quiz_type,
                JSON.stringify(answers),
                JSON.stringify(theory_answers),
                score,
                total_questions || (quiz_type === 'theory' ? theory_answers.length : 0),
                total_possible_score || null,
                time_spent,
            ]
        );

        // Update case stats — unified percentage regardless of quiz type
        await client.query(
            `UPDATE random_cases
             SET
                times_used = times_used + 1,
                avg_score  = (
                    SELECT COALESCE(AVG(
                        CASE
                            WHEN quiz_type = 'mcq'    AND total_questions     > 0
                                THEN ROUND((score::NUMERIC / total_questions)     * 100)
                            WHEN quiz_type = 'theory' AND total_possible_score > 0
                                THEN ROUND((score::NUMERIC / total_possible_score) * 100)
                            ELSE 0
                        END
                    ), 0)::integer
                    FROM case_attempts
                    WHERE case_id = $1
                )
             WHERE id = $1`,
            [case_id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            attempt: insertResult.rows[0],
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error saving attempt:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
        client.release();
    }
});


// ============================================
// GET /api/random-cases/user/:userUuid/attempts
// Get all attempts for a user (both mcq + theory)
// ============================================
router.get('/user/:userUuid/attempts', verifyToken, async (req, res) => {
    try {
        const { userUuid } = req.params;

        if (userUuid !== req.user.uid) {
            return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
        }

        const userResult = await pool.query(
            'SELECT internal_uuid FROM users WHERE uid = $1',
            [userUuid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userInternalUuid = userResult.rows[0].internal_uuid;

        const result = await pool.query(
            `SELECT
                ca.*,
                rc.title,
                rc.severity,
                rc.patient_info,
                -- Unified percentage for frontend display
                CASE
                    WHEN ca.quiz_type = 'mcq'    AND ca.total_questions     > 0
                        THEN ROUND((ca.score::NUMERIC / ca.total_questions)     * 100)
                    WHEN ca.quiz_type = 'theory' AND ca.total_possible_score > 0
                        THEN ROUND((ca.score::NUMERIC / ca.total_possible_score) * 100)
                    ELSE 0
                END AS percentage
            FROM case_attempts ca
            JOIN random_cases rc ON ca.case_id = rc.id
            WHERE ca.user_internal_uuid = $1
            ORDER BY ca.completed_at DESC`,
            [userInternalUuid]
        );

        res.status(200).json({
            success: true,
            attempts: result.rows,
        });

    } catch (error) {
        console.error('❌ Error fetching attempts:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


module.exports = router;