const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken } = require('../middleware/authMiddleware');

// ============================================
// POST /api/process-xray - Process X-ray image via Colab AI model
// ============================================
router.post('/', verifyToken, async (req, res) => {
    try {
        // 1. Extract the patient data and image URL from the frontend request
        const {
            patient_name,
            patient_age,
            symptoms,
            file_url,
            suspected_disease,
            duration,
            medical_history
        } = req.body;

        if (!file_url) {
            return res.status(400).json({
                success: false,
                error: 'file_url is required.'
            });
        }

        console.log('🔬 =========== X-RAY PROCESSING START ===========');
        console.log(`📋 Patient: ${patient_name || 'Unknown'}, Age: ${patient_age || 'N/A'}`);
        console.log(`🖼️  Image URL: ${file_url}`);

        // 2. Fetch the image directly from the Cloudinary URL and convert to Base64
        console.log('⬇️  Downloading image from Cloudinary...');
        const imageResponse = await axios.get(file_url, { responseType: 'arraybuffer' });
        const base64String = Buffer.from(imageResponse.data, 'binary').toString('base64');
        console.log(`✅ Image converted to Base64 (${Math.round(base64String.length / 1024)}KB)`);

        // 3. Construct the payload matching the Colab Pydantic schema
        // IMPORTANT: Never send null values — Pydantic will reject them with a 500
        const colabPayload = {
            base64_image: base64String,
            patient_name: patient_name || 'Unknown',
            patient_age: patient_age ? parseInt(patient_age) : 0,
            symptoms: symptoms || 'Not specified',
            suspected_disease: suspected_disease || 'Unknown',
            duration: duration || 'acute',
            medical_history: medical_history || 'None'
        };

        // 4. Send the payload to the Colab API
        // ⚠️ IMPORTANT: Update this URL with your active ngrok link from Colab!
        const colabUrl = process.env.COLAB_API_URL || 'https://splendor-bonelike-subatomic.ngrok-free.dev/api/analyze';

        console.log(`🚀 Sending to Colab API: ${colabUrl}`);
        console.log('📤 Payload keys:', Object.keys(colabPayload));
        console.log('📤 Payload (without image):', {
            ...colabPayload,
            base64_image: `[BASE64 STRING - ${Math.round(base64String.length / 1024)}KB]`
        });

        const colabResponse = await axios.post(colabUrl, colabPayload, {
            timeout: 120000, // 120 second timeout for AI processing
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Colab API response received!');
        console.log('📊 =========== COLAB RESPONSE DATA ===========');
        console.log(JSON.stringify(colabResponse.data, null, 2));
        console.log('🔬 =========== X-RAY PROCESSING COMPLETE ===========');

        // 5. Send the structured JSON response back to the React frontend
        res.json({
            success: true,
            analysis: colabResponse.data
        });

    } catch (error) {
        console.error('❌ Error processing X-ray:', error.message);

        // Log the FULL error response from Colab so we can debug
        if (error.response) {
            console.error('❌ Colab API Error Status:', error.response.status);
            console.error('❌ Colab API Error Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('❌ Colab API Error Body:', JSON.stringify(error.response.data, null, 2));
            
            res.status(error.response.status).json({
                success: false,
                error: 'Error from AI Model',
                details: error.response.data
            });
        } else if (error.code === 'ECONNABORTED') {
            res.status(504).json({
                success: false,
                error: 'AI Model request timed out. Please try again.',
                details: 'The analysis took too long to respond.'
            });
        } else {
            console.error('❌ Full error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process X-ray',
                details: error.message
            });
        }
    }
});

module.exports = router;