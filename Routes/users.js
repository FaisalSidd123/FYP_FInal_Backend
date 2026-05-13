const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../cloudinary');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/users/sync - Sync user with database
router.post('/sync', verifyToken, async (req, res) => {
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

    // Security check
    if (uid !== req.user.uid) {
      console.error('❌ Security alert: UID mismatch in sync request');
      return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
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
          display_name = COALESCE(display_name, $2), 
          photo_url = COALESCE(photo_url, $3), 
          phone_number = COALESCE(phone_number, $4), 
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
router.get('/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;

    if (uid !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
    }

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

// Updated backend route - users.js (add this PUT endpoint)
// PUT /api/users/:uid - Update user profile with role details
router.put('/:uid', verifyToken, upload.single('profile_image'), async (req, res) => {
  try {
    const { uid } = req.params;

    if (uid !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
    }
    let {
      display_name,
      photo_url,
      phone_number,
      role,
      specialization,
      experience_years,
      medical_license,
      age,
      gender,
      medical_conditions,
      reason_for_interest,
      learning_goals,
      role_completed
    } = req.body;

    // Handle profile image upload to Cloudinary
    if (req.file) {
      try {
        console.log('☁️ Uploading profile image to Cloudinary...');
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'profile_images',
          public_id: `user_${uid}_${Date.now()}`,
        });
        photo_url = cloudinaryResult.secure_url;
        console.log('☁️ Profile image uploaded:', photo_url);
      } catch (uploadError) {
        console.error('❌ Profile image upload failed:', uploadError.message);
      }
    }

    // Fix for empty string being passed to integer fields
    if (experience_years === '') experience_years = null;
    if (age === '') age = null;

    console.log('🔄 Updating user:', uid);
    console.log('📋 Request Body:', req.body);
    console.log('📋 Files:', req.file ? 'File received' : 'No file');

    // First check if columns exist, if not, alter table
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND table_schema='public'
    `;
    console.log('🔍 Checking existing columns for public.users...');
    const columnsResult = await pool.query(checkColumnsQuery);
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);

    // Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'role', type: 'VARCHAR(50)' },
      { name: 'specialization', type: 'VARCHAR(100)' },
      { name: 'experience_years', type: 'INTEGER' },
      { name: 'medical_license', type: 'VARCHAR(100)' },
      { name: 'age', type: 'INTEGER' },
      { name: 'gender', type: 'VARCHAR(20)' },
      { name: 'medical_conditions', type: 'TEXT' },
      { name: 'reason_for_interest', type: 'VARCHAR(100)' },
      { name: 'learning_goals', type: 'TEXT' },
      { name: 'role_completed', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await pool.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      updateFields.push(`display_name = $${paramIndex++}`);
      values.push(display_name);
    }
    if (photo_url !== undefined) {
      updateFields.push(`photo_url = $${paramIndex++}`);
      values.push(photo_url);
    }
    if (phone_number !== undefined) {
      updateFields.push(`phone_number = $${paramIndex++}`);
      values.push(phone_number);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (specialization !== undefined) {
      updateFields.push(`specialization = $${paramIndex++}`);
      values.push(specialization);
    }
    if (experience_years !== undefined) {
      updateFields.push(`experience_years = $${paramIndex++}`);
      values.push(experience_years);
    }
    if (medical_license !== undefined) {
      updateFields.push(`medical_license = $${paramIndex++}`);
      values.push(medical_license);
    }
    if (age !== undefined) {
      updateFields.push(`age = $${paramIndex++}`);
      values.push(age);
    }
    if (gender !== undefined) {
      updateFields.push(`gender = $${paramIndex++}`);
      values.push(gender);
    }
    if (medical_conditions !== undefined) {
      updateFields.push(`medical_conditions = $${paramIndex++}`);
      values.push(medical_conditions);
    }
    if (reason_for_interest !== undefined) {
      updateFields.push(`reason_for_interest = $${paramIndex++}`);
      values.push(reason_for_interest);
    }
    if (learning_goals !== undefined) {
      updateFields.push(`learning_goals = $${paramIndex++}`);
      values.push(learning_goals);
    }
    if (role_completed !== undefined) {
      updateFields.push(`role_completed = $${paramIndex++}`);
      values.push(role_completed);
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add uid as the last parameter
    values.push(uid);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE uid = $${paramIndex}
      RETURNING *
    `;

    console.log('📝 Update query:', query);
    console.log('📦 Values:', values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.log('❌ User not found for update:', uid);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('✅ User updated successfully');
    console.log('📊 Updated user data:', result.rows[0]);

    res.status(200).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});


// GET /api/users - Get all users (for debugging)
router.get('/', verifyToken, async (req, res) => {
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