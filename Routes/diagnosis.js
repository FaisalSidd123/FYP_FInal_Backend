const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../cloudinary');

// Configure multer for MEMORY storage (buffer) instead of disk
// The buffer will be uploaded to Cloudinary
const storage = multer.memoryStorage();

// File filter for images only
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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ============================================
// POST /api/diagnosis - Create new diagnosis case
// ============================================
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 =========== DIAGNOSIS REQUEST START ===========');
    console.log('📦 Request body:', req.body);
    console.log('📁 File:', req.file ? req.file.originalname : 'No file');
    
    // Extract form data
    const {
      user_firebase_uid,
      patient_name,
      patient_age,
      symptoms,
      duration = 'acute',
      medical_history,
      suspected_disease,
      case_title = 'New Diagnosis'
    } = req.body;

    // ==================== VALIDATION ====================
    if (!user_firebase_uid) {
      console.error('❌ Validation failed: user_firebase_uid is required');
      return res.status(400).json({
        success: false,
        error: 'User Firebase UID is required'
      });
    }

    if (user_firebase_uid !== req.user.uid) {
      console.error('❌ Security alert: UID mismatch in POST /diagnosis');
      return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
    }

    if (!symptoms || symptoms.trim() === '') {
      console.error('❌ Validation failed: symptoms are required');
      return res.status(400).json({
        success: false,
        error: 'Symptoms are required'
      });
    }

    console.log('👤 Looking up user:', user_firebase_uid);
    
    // ==================== FIND USER ====================
    const userQuery = 'SELECT internal_uuid, uid, email FROM users WHERE uid = $1';
    const userResult = await client.query(userQuery, [user_firebase_uid]);
    
    if (userResult.rows.length === 0) {
      console.error('❌ User not found:', user_firebase_uid);
      return res.status(404).json({
        success: false,
        error: 'User not found. Please sync your account first.'
      });
    }

    const user = userResult.rows[0];
    console.log('✅ User found:', {
      firebase_uid: user.uid,
      internal_uuid: user.internal_uuid,
      email: user.email
    });

    // Ensure internal_uuid exists
    if (!user.internal_uuid) {
      console.error('❌ User has no internal_uuid - generating one');
      const updateQuery = 'UPDATE users SET internal_uuid = gen_random_uuid() WHERE uid = $1 RETURNING internal_uuid';
      const updateResult = await client.query(updateQuery, [user_firebase_uid]);
      user.internal_uuid = updateResult.rows[0].internal_uuid;
      console.log('🔄 Generated new internal_uuid:', user.internal_uuid);
    }

    // ==================== UPLOAD TO CLOUDINARY ====================
    let file_url = null;
    if (req.file) {
      try {
        console.log('☁️  Uploading image to Cloudinary...');
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'diagnosis_cases',
          public_id: `case_${user_firebase_uid}_${Date.now()}`,
        });
        file_url = cloudinaryResult.secure_url;
        console.log('☁️  Cloudinary upload success:', file_url);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError.message);
        // Continue without the image rather than failing the entire case
        console.log('⚠️  Proceeding without image...');
      }
    }

    // Determine severity
    let severity = 'pending';
    if (duration === 'acute') severity = 'high';
    else if (duration === 'chronic') severity = 'moderate';
    else if (duration === 'subacute') severity = 'medium';
    
    // Calculate confidence
    let confidence = 50;
    if (patient_name) confidence += 10;
    if (patient_age) confidence += 10;
    if (medical_history && medical_history.trim() !== '') confidence += 10;
    if (suspected_disease) confidence += 10;
    if (file_url) confidence += 10;
    confidence = Math.min(confidence, 100);

    // Generate findings
    const findings = `Patient: ${patient_name || 'Not specified'}, Age: ${patient_age || 'N/A'}. Symptoms: ${symptoms}. Duration: ${duration}. History: ${medical_history || 'Not provided'}.`;

    console.log('💾 Data prepared:');
    console.log('├── user_internal_uuid:', user.internal_uuid);
    console.log('├── symptoms length:', symptoms.length);
    console.log('├── confidence:', confidence);
    console.log('└── file_url:', file_url);

    // ==================== INSERT INTO DATABASE ====================
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO diagnosis_cases (
        user_internal_uuid,
        case_title,
        patient_name,
        patient_age,
        symptoms,
        duration,
        medical_history,
        suspected_disease,
        file_url,
        severity,
        confidence,
        findings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const insertValues = [
      user.internal_uuid,                         // $1
      case_title,                                 // $2
      patient_name || null,                       // $3
      patient_age ? parseInt(patient_age) : null, // $4
      symptoms,                                   // $5
      duration,                                   // $6
      medical_history || null,                    // $7
      suspected_disease || null,                  // $8
      file_url,                                   // $9 (now a Cloudinary URL)
      severity,                                   // $10
      confidence,                                 // $11
      findings                                    // $12
    ];

    console.log('🚀 Executing INSERT...');
    const insertResult = await client.query(insertQuery, insertValues);

    await client.query('COMMIT');

    console.log('✅ DIAGNOSIS CASE CREATED!');
    console.log('🆔 Case ID:', insertResult.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Diagnosis case created successfully',
      case: insertResult.rows[0],
      file_url: file_url
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    console.error('❌ =========== ERROR ===========');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    
    // User-friendly error messages
    let userError = 'Internal server error';
    
    if (error.code === '42P01') {
      userError = 'Database table not configured. Please contact support.';
      console.error('💡 Table missing! Run:');
      console.error(`
        CREATE TABLE diagnosis_cases (
          id SERIAL PRIMARY KEY,
          user_internal_uuid UUID NOT NULL,
          case_title VARCHAR(255) DEFAULT 'New Diagnosis',
          patient_name VARCHAR(255),
          patient_age INTEGER,
          symptoms TEXT NOT NULL,
          duration VARCHAR(50) DEFAULT 'acute',
          medical_history TEXT,
          suspected_disease VARCHAR(255),
          file_url VARCHAR(500),
          severity VARCHAR(50) DEFAULT 'pending',
          confidence INTEGER DEFAULT 50,
          findings TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else if (error.code === '23503') {
      userError = 'User account issue. Please sync your account first.';
    } else if (error.code === '23502') {
      userError = 'Required information missing. Please check all fields.';
    } else if (error.code === '42703') {
      userError = 'Database configuration error. Please contact support.';
    }
    
    res.status(500).json({
      success: false,
      error: userError,
      details: error.message
    });
  } finally {
    client.release();
  }
});


//diagnosis Routes
// ============================================
// GET /api/diagnosis/user/:uid - Get all cases for a user
// ============================================
router.get('/user/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (uid !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: UID mismatch' });
    }
    
    const { 
      limit = 20, 
      offset = 0,
      sort = 'newest',
      filter 
    } = req.query;

    console.log('📋 Fetching cases for user:', uid);
    console.log('📊 Query params:', { limit, offset, sort, filter });

    // First, verify user exists and get internal_uuid
    const userQuery = 'SELECT internal_uuid FROM users WHERE uid = $1';
    const userResult = await pool.query(userQuery, [uid]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found:', uid);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user_internal_uuid = userResult.rows[0].internal_uuid;
    console.log('✅ User internal_uuid:', user_internal_uuid);

    // Build base query
    let baseQuery = `
      SELECT 
        dc.*,
        u.email as user_email,
        u.display_name as user_display_name,
        u.photo_url as user_photo_url
      FROM diagnosis_cases dc
      LEFT JOIN users u ON dc.user_internal_uuid = u.internal_uuid
      WHERE dc.user_internal_uuid = $1
    `;

    const queryParams = [user_internal_uuid];
    let paramCounter = 2;

    // Apply filters
    if (filter) {
      if (filter === 'with_images') {
        baseQuery += ` AND dc.file_url IS NOT NULL`;
      } else if (filter === 'high_severity') {
        baseQuery += ` AND dc.severity IN ('high', 'critical')`;
      } else if (filter === 'recent') {
        baseQuery += ` AND dc.created_at >= NOW() - INTERVAL '7 days'`;
      }
    }

    // Get total count
    const countQuery = baseQuery.replace(
      'SELECT dc.*, u.email as user_email, u.display_name as user_display_name, u.photo_url as user_photo_url',
      'SELECT COUNT(*) as total'
    );
    const countResult = await pool.query(countQuery, queryParams);
    const totalCases = parseInt(countResult.rows[0].total);
    console.log('📊 Total cases found:', totalCases);

    // Apply sorting
    let orderBy = 'ORDER BY dc.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'ORDER BY dc.created_at ASC';
    } else if (sort === 'severity_high') {
      orderBy = `ORDER BY 
        CASE dc.severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          WHEN 'pending' THEN 5
          ELSE 6
        END ASC, dc.created_at DESC`;
    } else if (sort === 'confidence_high') {
      orderBy = 'ORDER BY dc.confidence DESC, dc.created_at DESC';
    }

    // Get paginated results
    const finalQuery = `
      ${baseQuery}
      ${orderBy}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const finalParams = [...queryParams, parseInt(limit), parseInt(offset)];
    console.log('📋 Final query params:', finalParams);

    const result = await pool.query(finalQuery, finalParams);
    console.log('✅ Returning', result.rows.length, 'cases');

    // Calculate statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN file_url IS NOT NULL THEN 1 END) as cases_with_images,
        AVG(confidence) as avg_confidence,
        MIN(created_at) as first_case_date,
        MAX(created_at) as last_case_date,
        COUNT(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 END) as high_severity_cases
      FROM diagnosis_cases 
      WHERE user_internal_uuid = $1
    `;

    const statsResult = await pool.query(statsQuery, [user_internal_uuid]);
    const stats = statsResult.rows[0];

    res.status(200).json({
      success: true,
      cases: result.rows,
      pagination: {
        total: totalCases,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + result.rows.length) < totalCases
      },
      filters: {
        current_sort: sort,
        current_filter: filter || 'all'
      },
      statistics: {
        total_cases: parseInt(stats.total_cases),
        cases_with_images: parseInt(stats.cases_with_images),
        avg_confidence: Math.round(parseFloat(stats.avg_confidence) || 0),
        first_case_date: stats.first_case_date,
        last_case_date: stats.last_case_date,
        high_severity_cases: parseInt(stats.high_severity_cases)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching diagnosis cases:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ============================================
// GET /api/diagnosis/case/:id - Get single case by ID
// ============================================
router.get('/case/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching case:', id);

    const query = `
      SELECT 
        dc.*,
        u.email as user_email,
        u.display_name as user_display_name,
        u.photo_url as user_photo_url,
        u.uid as user_firebase_uid
      FROM diagnosis_cases dc
      LEFT JOIN users u ON dc.user_internal_uuid = u.internal_uuid
      WHERE dc.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    if (result.rows[0].user_firebase_uid !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
    }

    console.log('✅ Case found:', result.rows[0].case_title);

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
// PATCH /api/diagnosis/case/:id/analysis - Save AI analysis to case
// ============================================
router.patch('/case/:id/analysis', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ai_analysis } = req.body;

    console.log('💾 Saving AI analysis for case:', id);

    if (!ai_analysis) {
      return res.status(400).json({ success: false, error: 'ai_analysis is required' });
    }

    // Verify ownership
    const checkQuery = `
      SELECT dc.id, u.uid as user_firebase_uid
      FROM diagnosis_cases dc
      JOIN users u ON dc.user_internal_uuid = u.internal_uuid
      WHERE dc.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }
    if (checkResult.rows[0].user_firebase_uid !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Update with AI analysis + overwrite severity/confidence/findings from real AI data
    const updateQuery = `
      UPDATE diagnosis_cases
      SET ai_analysis = $1,
          severity = COALESCE($2, severity),
          confidence = COALESCE($3, confidence),
          findings = COALESCE($4, findings),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const severity = ai_analysis.severity || null;
    const confidence = ai_analysis.confidence != null
      ? Math.round(ai_analysis.confidence > 1 ? ai_analysis.confidence : ai_analysis.confidence * 100)
      : null;
    const findings = ai_analysis.full_findings || null;

    const result = await pool.query(updateQuery, [
      JSON.stringify(ai_analysis),
      severity,
      confidence,
      findings,
      id
    ]);

    console.log('✅ AI analysis saved for case:', id);

    res.status(200).json({
      success: true,
      message: 'AI analysis saved',
      case: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error saving AI analysis:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================
// DELETE /api/diagnosis/case/:id - Delete a case
// ============================================
router.delete('/case/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting case:', id);

    await client.query('BEGIN');

    // First, get the case to verify ownership and get the file_url for Cloudinary cleanup
    const checkQuery = `
      SELECT dc.*, u.uid as user_firebase_uid 
      FROM diagnosis_cases dc 
      JOIN users u ON dc.user_internal_uuid = u.internal_uuid 
      WHERE dc.id = $1
    `;
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    if (checkResult.rows[0].user_firebase_uid !== req.user.uid) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
    }

    // Delete image from Cloudinary if it exists
    const fileUrl = checkResult.rows[0].file_url;
    if (fileUrl && fileUrl.includes('cloudinary.com')) {
      try {
        const publicId = extractPublicId(fileUrl);
        if (publicId) {
          console.log('☁️  Deleting image from Cloudinary:', publicId);
          await deleteFromCloudinary(publicId);
          console.log('☁️  Cloudinary image deleted successfully');
        }
      } catch (cloudinaryError) {
        // Log but don't fail the deletion if Cloudinary cleanup fails
        console.error('⚠️  Cloudinary delete failed (continuing):', cloudinaryError.message);
      }
    }

    // Delete the case from database
    const deleteQuery = 'DELETE FROM diagnosis_cases WHERE id = $1 RETURNING *';
    const deleteResult = await client.query(deleteQuery, [id]);

    await client.query('COMMIT');

    console.log('✅ Case deleted:', id);

    res.status(200).json({
      success: true,
      message: 'Case deleted successfully',
      deleted_case: deleteResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting case:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  console.error("🔥 Multer error:", err.message);
  res.status(400).json({ 
    success: false,
    error: err.message 
  });
});

module.exports = router;