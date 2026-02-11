const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/users/sync - Sync user with database
router.post('/sync', async (req, res) => {
  try {
    console.log('📨 Received user sync request:', req.body);
    
    // Extract data from request body
    const { uid, email, display_name, photo_url, phone_number } = req.body;
    
    console.log('📋 Parsed data:', { uid, email, display_name, photo_url, phone_number });
    
    // Validation
    if (!uid) {
      console.error('❌ Validation failed: uid is required');
      return res.status(400).json({
        success: false,
        error: 'User UID is required'
      });
    }

    if (!email) {
      console.error('❌ Validation failed: email is required');
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    console.log('🔍 Checking if user exists:', uid);
    
    // Check if user exists (by Firebase UID)
    const checkQuery = 'SELECT * FROM users WHERE uid = $1';
    const checkResult = await pool.query(checkQuery, [uid]);

    if (checkResult.rows.length > 0) {
      // Update existing user
      console.log('✅ User found, updating...');
      
      const updateQuery = `
        UPDATE users 
        SET 
          email = $1, 
          display_name = COALESCE($2, display_name), 
          photo_url = COALESCE($3, photo_url), 
          phone_number = COALESCE($4, phone_number), 
          updated_at = CURRENT_TIMESTAMP,
          last_login = CURRENT_TIMESTAMP
        WHERE uid = $5
        RETURNING *
      `;
      
      console.log('🔄 Executing update query...');
      const updateResult = await pool.query(updateQuery, [
        email,
        display_name,
        photo_url,
        phone_number,
        uid
      ]);

      console.log('✅ User updated successfully');
      return res.status(200).json({
        success: true,
        message: 'User updated',
        user: updateResult.rows[0],
        is_new: false
      });
    } else {
      // Create new user
      console.log('🆕 User not found, creating new user...');
      
      const insertQuery = `
        INSERT INTO users (uid, email, display_name, photo_url, phone_number)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      console.log('✨ Executing insert query...');
      const insertResult = await pool.query(insertQuery, [
        uid,
        email,
        display_name || email.split('@')[0] || 'User',
        photo_url || null,
        phone_number || null
      ]);

      console.log('✅ User created successfully');
      console.log('🆔 Internal UUID:', insertResult.rows[0].internal_uuid);

      return res.status(201).json({
        success: true,
        message: 'User created',
        user: insertResult.rows[0],
        is_new: true
      });
    }
  } catch (error) {
    console.error('❌ =========== ERROR SYNCING USER ===========');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Detail:', error.detail);
    console.error('Error Hint:', error.hint);
    console.error('Request Body:', req.body);
    
    // Check for specific errors
    if (error.code === '23505') {
      console.error('🔴 UNIQUE CONSTRAINT VIOLATION');
      console.error('   A user with this UID or email already exists');
    } else if (error.code === '23502') {
      console.error('🔴 NOT NULL VIOLATION');
      console.error('   A required field is missing');
    } else if (error.code === '42703') {
      console.error('🔴 COLUMN DOES NOT EXIST');
      console.error('   Trying to access a column that does not exist in the table');
      console.error('   Common issue: Trying to use "age" column which might not exist');
    }
    
    console.error('=========== ERROR END ===========');
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      code: error.code
    });
  }
});

// GET /api/users/:uid - Get user by Firebase UID
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('🔍 Fetching user:', uid);
    
    const query = 'SELECT * FROM users WHERE uid = $1';
    const result = await pool.query(query, [uid]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found:', uid);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('✅ User found:', result.rows[0].email);
    
    res.status(200).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/users/:uid - Update user profile
router.put('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { display_name, photo_url, phone_number } = req.body;
    
    console.log('🔄 Updating user:', uid);
    console.log('📋 Update data:', { display_name, photo_url, phone_number });
    
    const query = `
      UPDATE users 
      SET 
        display_name = $1, 
        photo_url = $2, 
        phone_number = $3, 
        updated_at = CURRENT_TIMESTAMP
      WHERE uid = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      display_name,
      photo_url,
      phone_number,
      uid
    ]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found for update:', uid);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('✅ User updated successfully');
    
    res.status(200).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/users - Get all users (for debugging)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all users...');
    
    const query = 'SELECT id, uid, internal_uuid, email, display_name, created_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    
    console.log('✅ Found', result.rows.length, 'users');
    
    res.status(200).json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Export the router
module.exports = router;