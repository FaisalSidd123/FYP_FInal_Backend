// backend/routes/caseQueries.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// GET /api/case-queries/case/:caseId - Get all queries for a specific case
// ============================================
router.get('/case/:caseId', async (req, res) => {
    try {
        const { caseId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        console.log(`📋 Fetching queries for case ID: ${caseId}`);

        // First verify the case exists
        const caseCheck = await pool.query(
            'SELECT id, case_title FROM diagnosis_cases WHERE id = $1',
            [caseId]
        );

        if (caseCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Case not found'
            });
        }

        // Get total count
        const countQuery = 'SELECT COUNT(*) as total FROM case_queries WHERE case_id = $1';
        const countResult = await pool.query(countQuery, [caseId]);
        const totalQueries = parseInt(countResult.rows[0].total);

        // Get queries with pagination
        const queriesQuery = `
      SELECT 
        q.*,
        u.display_name as user_name,
        u.email as user_email,
        u.photo_url as user_photo_url
      FROM case_queries q
      LEFT JOIN users u ON q.user_internal_uuid = u.internal_uuid
      WHERE q.case_id = $1
      ORDER BY q.created_at DESC
      LIMIT $2 OFFSET $3
    `;

        const queriesResult = await pool.query(queriesQuery, [caseId, limit, offset]);

        // Get query statistics
        const statsQuery = `
      SELECT 
        COUNT(*) as total_queries,
        AVG(response_time_ms)::integer as avg_response_time,
        SUM(tokens_used) as total_tokens,
        MIN(created_at) as first_query,
        MAX(created_at) as last_query
      FROM case_queries 
      WHERE case_id = $1
    `;

        const statsResult = await pool.query(statsQuery, [caseId]);

        res.status(200).json({
            success: true,
            case: caseCheck.rows[0],
            queries: queriesResult.rows,
            pagination: {
                total: totalQueries,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + queriesResult.rows.length) < totalQueries
            },
            statistics: statsResult.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching case queries:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// ============================================
// POST /api/case-queries - Create a new query for a case
// ============================================
router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            case_id,
            user_firebase_uid,
            query_text,
            ai_response,
            response_time_ms,
            tokens_used
        } = req.body;

        console.log('📝 Creating new case query:', { case_id, user_firebase_uid });

        // Validation
        if (!case_id) {
            return res.status(400).json({
                success: false,
                error: 'Case ID is required'
            });
        }

        if (!user_firebase_uid) {
            return res.status(400).json({
                success: false,
                error: 'User Firebase UID is required'
            });
        }

        if (!query_text || query_text.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Query text is required'
            });
        }

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

        // Verify case exists and belongs to user
        const caseQuery = `
      SELECT id FROM diagnosis_cases 
      WHERE id = $1 AND user_internal_uuid = $2
    `;
        const caseResult = await client.query(caseQuery, [case_id, userInternalUuid]);

        if (caseResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                error: 'Case not found or access denied'
            });
        }

        // Insert the query
        const insertQuery = `
      INSERT INTO case_queries (
        case_id,
        user_internal_uuid,
        query_text,
        ai_response,
        response_time_ms,
        tokens_used
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const insertResult = await client.query(insertQuery, [
            case_id,
            userInternalUuid,
            query_text,
            ai_response || null,
            response_time_ms || null,
            tokens_used || null
        ]);

        await client.query('COMMIT');

        console.log('✅ Query created with ID:', insertResult.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Query created successfully',
            query: insertResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating query:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// GET /api/case-queries/:queryId - Get a specific query
// ============================================
router.get('/:queryId', async (req, res) => {
    try {
        const { queryId } = req.params;

        const query = `
      SELECT 
        q.*,
        u.display_name as user_name,
        u.email as user_email,
        u.photo_url as user_photo_url,
        dc.case_title,
        dc.symptoms,
        dc.patient_name
      FROM case_queries q
      LEFT JOIN users u ON q.user_internal_uuid = u.internal_uuid
      LEFT JOIN diagnosis_cases dc ON q.case_id = dc.id
      WHERE q.id = $1
    `;

        const result = await pool.query(query, [queryId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Query not found'
            });
        }

        res.status(200).json({
            success: true,
            query: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching query:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// GET /api/case-queries/user/:uid - Get all queries for a user
// ============================================
router.get('/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        console.log('📋 Fetching all queries for user:', uid);

        // Get user internal UUID
        const userQuery = 'SELECT internal_uuid FROM users WHERE uid = $1';
        const userResult = await pool.query(userQuery, [uid]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userInternalUuid = userResult.rows[0].internal_uuid;

        // Get total count
        const countQuery = 'SELECT COUNT(*) as total FROM case_queries WHERE user_internal_uuid = $1';
        const countResult = await pool.query(countQuery, [userInternalUuid]);
        const totalQueries = parseInt(countResult.rows[0].total);

        // Get queries with case details
        const queriesQuery = `
      SELECT 
        q.*,
        dc.id as case_id,
        dc.case_title,
        dc.symptoms,
        dc.patient_name,
        dc.created_at as case_created_at
      FROM case_queries q
      LEFT JOIN diagnosis_cases dc ON q.case_id = dc.id
      WHERE q.user_internal_uuid = $1
      ORDER BY q.created_at DESC
      LIMIT $2 OFFSET $3
    `;

        const queriesResult = await pool.query(queriesQuery, [userInternalUuid, limit, offset]);

        res.status(200).json({
            success: true,
            queries: queriesResult.rows,
            pagination: {
                total: totalQueries,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + queriesResult.rows.length) < totalQueries
            }
        });

    } catch (error) {
        console.error('❌ Error fetching user queries:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// DELETE /api/case-queries/:queryId - Delete a query
// ============================================
router.delete('/:queryId', async (req, res) => {
    const client = await pool.connect();

    try {
        const { queryId } = req.params;

        await client.query('BEGIN');

        const deleteQuery = 'DELETE FROM case_queries WHERE id = $1 RETURNING *';
        const result = await client.query(deleteQuery, [queryId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Query not found'
            });
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Query deleted successfully',
            deleted_query: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error deleting query:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    } finally {
        client.release();
    }
});

module.exports = router;