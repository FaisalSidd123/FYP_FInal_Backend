// backend/routes/randomCases.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// GET /api/random-cases - Get random cases
// ============================================
router.get('/', async (req, res) => {
    try {
        const { limit = 3 } = req.query;

        console.log('📋 Fetching random cases...');

        const query = `
      SELECT 
        rc.*,
        COUNT(ca.id) as times_used,
        COALESCE(AVG(ca.score), 0)::integer as avg_score
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
            cases: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching random cases:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// GET /api/random-cases/:id - Get single case
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
      SELECT * FROM random_cases WHERE id = $1
    `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Case not found'
            });
        }

        res.status(200).json({
            success: true,
            case: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching case:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// POST /api/random-cases/attempt - Save case attempt
// ============================================
router.post('/attempt', async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            case_id,
            user_firebase_uid,
            answers,
            score,
            total_questions,
            time_spent
        } = req.body;

        console.log('📝 Saving case attempt:', { case_id, user_firebase_uid, score });

        await client.query('BEGIN');

        // Get user internal UUID
        const userQuery = 'SELECT internal_uuid FROM users WHERE uid = $1';
        const userResult = await client.query(userQuery, [user_firebase_uid]);

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userInternalUuid = userResult.rows[0].internal_uuid;

        // Insert attempt
        const insertQuery = `
      INSERT INTO case_attempts (
        case_id,
        user_internal_uuid,
        answers,
        score,
        total_questions,
        time_spent
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const insertResult = await client.query(insertQuery, [
            case_id,
            userInternalUuid,
            JSON.stringify(answers),
            score,
            total_questions,
            time_spent
        ]);

        // Update case stats
        const updateQuery = `
      UPDATE random_cases 
      SET 
        times_used = times_used + 1,
        avg_score = (
          SELECT COALESCE(AVG(score), 0)::integer
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
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    } finally {
        client.release();
    }
});

// ============================================
// GET /api/random-cases/user/:userUuid/attempts - Get user attempts
// ============================================
router.get('/user/:userUuid/attempts', async (req, res) => {
    try {
        const { userUuid } = req.params; // Expecting Firebase UID

        // Get user internal UUID
        const userQuery = 'SELECT internal_uuid FROM users WHERE uid = $1';
        const userResult = await pool.query(userQuery, [userUuid]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userInternalUuid = userResult.rows[0].internal_uuid;

        const query = `
      SELECT 
        ca.*,
        rc.title,
        rc.severity,
        rc.patient_info
      FROM case_attempts ca
      JOIN random_cases rc ON ca.case_id = rc.id
      WHERE ca.user_internal_uuid = $1
      ORDER BY ca.completed_at DESC
    `;

        const result = await pool.query(query, [userInternalUuid]);

        res.status(200).json({
            success: true,
            attempts: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching attempts:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;