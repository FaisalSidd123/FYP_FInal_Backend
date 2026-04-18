const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration on startup
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
if (!cloudName) {
  console.warn('⚠️  CLOUDINARY_CLOUD_NAME is not set. Image uploads will fail.');
} else {
  console.log(`☁️  Cloudinary configured for cloud: ${cloudName}`);
}

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage
 * @param {Object} options - Upload options (folder, public_id, etc.)
 * @returns {Promise<Object>} Cloudinary upload result with secure_url, public_id, etc.
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'diagnosis_cases',    // Organize images in a folder
      resource_type: 'image',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error.message);
          reject(error);
        } else {
          console.log('☁️  Cloudinary upload success:', result.secure_url);
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary by public_id
 * @param {string} publicId - The Cloudinary public_id of the image
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️  Cloudinary delete result:', result);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw error;
  }
};

/**
 * Extract public_id from a Cloudinary secure_url
 * e.g. "https://res.cloudinary.com/xxx/image/upload/v123/diagnosis_cases/abc.jpg"
 *   => "diagnosis_cases/abc"
 */
const extractPublicId = (secureUrl) => {
  if (!secureUrl || !secureUrl.includes('cloudinary.com')) return null;
  
  try {
    // URL pattern: .../upload/v{version}/{public_id}.{ext}
    const parts = secureUrl.split('/upload/');
    if (parts.length < 2) return null;
    
    const afterUpload = parts[1]; // e.g. "v123456/diagnosis_cases/abc.jpg"
    // Remove version prefix (v123456/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
};
