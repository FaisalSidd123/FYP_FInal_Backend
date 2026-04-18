// backend/routes/randomCases.js - UPDATED
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const OpenAI = require('openai');
const axios = require('axios');

const nvidiaClient = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY,
});

const NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';

// ============================================
// GET /api/random-cases
// Get random cases with full professional data
// ============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const { limit = 3, specialty, difficulty } = req.query;

        console.log('📋 Fetching professional medical cases...');

        let query = `
            SELECT
                rc.*,
                COUNT(DISTINCT ca.id) FILTER (WHERE ca.quiz_type = 'mcq') AS mcq_attempts,
                COUNT(DISTINCT ca.id) FILTER (WHERE ca.quiz_type = 'theory') AS theory_attempts,
                COALESCE(AVG(
                    CASE
                        WHEN ca.quiz_type = 'mcq' AND ca.total_questions > 0
                            THEN ROUND((ca.score::NUMERIC / ca.total_questions) * 100)
                        WHEN ca.quiz_type = 'theory' AND ca.total_possible_score > 0
                            THEN ROUND((ca.score::NUMERIC / ca.total_possible_score) * 100)
                        ELSE 0
                    END
                ), 0)::integer AS avg_score
            FROM random_cases rc
            LEFT JOIN case_attempts ca ON rc.id = ca.case_id
        `;

        const params = [];
        const conditions = [];

        if (specialty) {
            conditions.push(`rc.specialty = $${params.length + 1}`);
            params.push(specialty);
        }

        if (difficulty) {
            conditions.push(`rc.difficulty_level = $${params.length + 1}`);
            params.push(difficulty);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += `
            GROUP BY rc.id
            ORDER BY RANDOM()
            LIMIT $${params.length + 1}
        `;
        params.push(limit);

        const result = await pool.query(query, params);

        console.log(`✅ Retrieved ${result.rows.length} professional cases`);

        res.status(200).json({
            success: true,
            cases: result.rows,
        });

    } catch (error) {
        console.error('❌ Error fetching cases:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// GET /api/random-cases/:id
// Get single case with FULL professional data
// ============================================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📖 Fetching detailed case: ${id}`);

        const query = `
            SELECT
                rc.*,
                COUNT(DISTINCT ca.id) AS total_attempts,
                COUNT(DISTINCT ca.user_internal_uuid) AS unique_students,
                COALESCE(AVG(
                    CASE
                        WHEN ca.quiz_type = 'mcq' AND ca.total_questions > 0
                            THEN ROUND((ca.score::NUMERIC / ca.total_questions) * 100)
                        WHEN ca.quiz_type = 'theory' AND ca.total_possible_score > 0
                            THEN ROUND((ca.score::NUMERIC / ca.total_possible_score) * 100)
                        ELSE 0
                    END
                ), 0)::integer AS avg_score,
                COALESCE(AVG(ca.time_spent), 0)::integer AS avg_time_spent
            FROM random_cases rc
            LEFT JOIN case_attempts ca ON rc.id = ca.case_id
            WHERE rc.id = $1
            GROUP BY rc.id
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Case not found'
            });
        }

        console.log('✅ Case retrieved successfully');

        res.status(200).json({
            success: true,
            case: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching case:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// POST /api/random-cases/create
// Create new professional medical case (admin)
// ============================================
router.post('/create', verifyToken, async (req, res) => {
    try {
        const {
            // Basic Info
            case_number,
            title,
            specialty,
            patient_info,
            severity,
            confidence,
            difficulty_level,
            estimated_time_minutes,

            // Clinical Presentation
            chief_complaint,
            history_of_present_illness,
            symptoms,
            past_medical_history,
            medications,
            allergies,
            social_history,
            family_history,

            // Physical Exam
            vital_signs,
            general_examination,
            systemic_examination,

            // Investigations
            laboratory_results,
            imaging_findings,
            other_investigations,

            // Diagnosis
            differential_diagnosis,
            final_diagnosis,
            diagnosis_reasoning,

            // Management
            management_plan,
            recommendations,
            tests,
            prognosis,

            // Educational
            learning_objectives,
            key_teaching_points,
            clinical_pearls,
            common_pitfalls,
            references,

            // Quiz
            questions,
            theory_questions,

            // Display
            description,
            icon,
            color,
            tags
        } = req.body;

        // Get creator's internal UUID
        const userResult = await pool.query(
            'SELECT internal_uuid FROM users WHERE uid = $1',
            [req.user.uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const creatorUuid = userResult.rows[0].internal_uuid;

        const insertQuery = `
            INSERT INTO random_cases (
                case_number, title, specialty, patient_info, severity, confidence,
                difficulty_level, estimated_time_minutes,
                chief_complaint, history_of_present_illness, symptoms,
                past_medical_history, medications, allergies, social_history, family_history,
                vital_signs, general_examination, systemic_examination,
                laboratory_results, imaging_findings, other_investigations,
                differential_diagnosis, final_diagnosis, diagnosis_reasoning,
                management_plan, recommendations, tests, prognosis,
                learning_objectives, key_teaching_points, clinical_pearls, common_pitfalls, references,
                questions, theory_questions,
                description, icon, color, tags, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
            )
            RETURNING *
        `;

        const result = await pool.query(insertQuery, [
            case_number || `CASE-${Date.now()}`,
            title,
            specialty || 'Pulmonology',
            patient_info,
            severity,
            confidence,
            difficulty_level || 'Intermediate',
            estimated_time_minutes || 15,
            chief_complaint,
            history_of_present_illness,
            JSON.stringify(symptoms || []),
            JSON.stringify(past_medical_history || []),
            JSON.stringify(medications || []),
            JSON.stringify(allergies || []),
            JSON.stringify(social_history || {}),
            family_history,
            JSON.stringify(vital_signs || {}),
            general_examination,
            JSON.stringify(systemic_examination || {}),
            JSON.stringify(laboratory_results || []),
            JSON.stringify(imaging_findings || []),
            JSON.stringify(other_investigations || []),
            JSON.stringify(differential_diagnosis || []),
            final_diagnosis,
            diagnosis_reasoning,
            JSON.stringify(management_plan || {}),
            JSON.stringify(recommendations || []),
            JSON.stringify(tests || []),
            prognosis,
            JSON.stringify(learning_objectives || []),
            JSON.stringify(key_teaching_points || []),
            JSON.stringify(clinical_pearls || []),
            JSON.stringify(common_pitfalls || []),
            JSON.stringify(references || []),
            JSON.stringify(questions || []),
            JSON.stringify(theory_questions || []),
            description,
            icon || 'FileText',
            color || 'bg-blue-500',
            JSON.stringify(tags || []),
            creatorUuid
        ]);

        console.log('✅ Professional case created:', result.rows[0].case_number);

        res.status(201).json({
            success: true,
            message: 'Medical case created successfully',
            case: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error creating case:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create case',
            details: error.message
        });
    }
});

// ============================================
// GET /api/random-cases/filter/specialties
// Get list of available specialties
// ============================================
router.get('/filter/specialties', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT specialty, COUNT(*) as count
            FROM random_cases
            WHERE specialty IS NOT NULL
            GROUP BY specialty
            ORDER BY specialty
        `);

        res.status(200).json({
            success: true,
            specialties: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching specialties:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// GET /api/random-cases/filter/difficulties
// Get list of difficulty levels
// ============================================
router.get('/filter/difficulties', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT difficulty_level, COUNT(*) as count
            FROM random_cases
            WHERE difficulty_level IS NOT NULL
            GROUP BY difficulty_level
            ORDER BY 
                CASE difficulty_level
                    WHEN 'Beginner' THEN 1
                    WHEN 'Intermediate' THEN 2
                    WHEN 'Advanced' THEN 3
                    WHEN 'Expert' THEN 4
                    ELSE 5
                END
        `);

        res.status(200).json({
            success: true,
            difficulties: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching difficulties:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// POST /api/random-cases/evaluate-theory
// ============================================
router.post('/evaluate-theory', verifyToken, async (req, res) => {
    try {
        const { question, model_answer, user_answer, keywords } = req.body;
        
        if (!user_answer || !user_answer.trim()) {
            return res.status(400).json({ success: false, error: "Answer cannot be empty" });
        }

        const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
        if (!NVIDIA_API_KEY) {
            // Mock response if no API key is configured yet
            console.warn("NVIDIA_API_KEY not found. Using mock evaluation.");
            return res.status(200).json({
                success: true,
                score: 7,
                grade: "Good",
                feedback: "Mock feedback: Please configure the NVIDIA API Key in the backend .env to enable real AI evaluation.",
                key_points_covered: 1,
                key_points_total: 2
            });
        }

        // Prepare context for the AI
        const prompt = `You are a medical professor grading a student's answer. 
        Question: ${question}
        Model Answer: ${model_answer}
        Keywords expected: ${keywords ? keywords.join(", ") : "None specified"}
        Student Answer: ${user_answer}
        
        Evaluate the student's answer. Give a score from 0 to 10. Grade as one of: [Excellent, Good, Partial, Insufficient].
        Count how many key points were covered based on the model answer.
        Provide a concise, helpful feedback paragraph.
        
        Return ONLY valid JSON in this exact format:
        {
          "score": 8,
          "grade": "Good",
          "feedback": "...",
          "key_points_covered": 3,
          "key_points_total": 4
        }`;

        const response = await axios.post("https://integrate.api.nvidia.com/v1/chat/completions", {
            model: "meta/llama-3.1-70b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            max_tokens: 1024
        }, {
            headers: {
                "Authorization": `Bearer ${NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        let aiText = response.data.choices[0].message.content;
        // Clean up markdown markers if any
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const evalJson = JSON.parse(aiText);

        res.status(200).json({
            success: true,
            score: evalJson.score,
            grade: evalJson.grade,
            feedback: evalJson.feedback,
            key_points_covered: evalJson.key_points_covered,
            key_points_total: evalJson.key_points_total
        });

    } catch (error) {
        console.error("❌ Error evaluating theory:", error);
        res.status(500).json({ success: false, error: "Failed to evaluate answer" });
    }
});

// ============================================
// POST /api/random-cases/attempt - Save case attempt
// ============================================
router.post('/attempt', verifyToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            case_id,
            user_firebase_uid,
            quiz_type,
            answers,
            theory_answers,
            score,
            total_questions,
            total_possible_score,
            time_spent
        } = req.body;

        const uidToCheck = user_firebase_uid || req.user.uid;
        if (uidToCheck !== req.user.uid) {
            return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
        }

        await client.query('BEGIN');

        // Get user internal UUID
        const userQuery = 'SELECT internal_uuid FROM users WHERE uid = $1';
        const userResult = await client.query(userQuery, [req.user.uid]);

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userInternalUuid = userResult.rows[0].internal_uuid;

        // Insert attempt
        const insertQuery = `
      INSERT INTO case_attempts (
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
      RETURNING *
    `;

        const insertResult = await client.query(insertQuery, [
            case_id,
            userInternalUuid,
            quiz_type || 'mcq',
            JSON.stringify(answers || []),
            JSON.stringify(theory_answers || []),
            score,
            total_questions,
            total_possible_score || (total_questions * 10), // default assumption for MCQ or simple rating
            time_spent
        ]);

        // Update case stats
        const updateQuery = `
      UPDATE random_cases 
      SET 
        times_used = times_used + 1,
        avg_score = (
          SELECT COALESCE(AVG(
            CASE 
                WHEN total_possible_score > 0 THEN (score::float / total_possible_score) * 100
                WHEN quiz_type = 'mcq' AND total_questions > 0 THEN (score::float / total_questions) * 100
                ELSE 0
            END
          ), 0)::integer
          FROM case_attempts
          WHERE case_id = $1
        )
      WHERE id = $1
      RETURNING *
    `;

        await client.query(updateQuery, [case_id]);
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            attempt: insertResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error saving attempt:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;