const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
dotenv.config();

// We parse the private key carefully because environment variables can mess up newlines
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    console.log('✅ Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
  }
} else if (!process.env.FIREBASE_PROJECT_ID) {
  console.warn('⚠️ WARNING: Firebase Admin SDK credentials not found in environment variables. Token verification will fail until configured.');
}

module.exports = admin;
