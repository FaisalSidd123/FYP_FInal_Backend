const admin = require('../firebaseAdmin');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ Unauthorized request: No Bearer token provided.');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Empty token'
      });
    }

    try {
      // Decode and verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Attach the user identity to the request object
      req.user = decodedToken;
      
      console.log(`✅ Token verified for user: ${decodedToken.uid}`);
      next(); // Proceed to the actual route handler
    } catch (firebaseError) {
      console.error('❌ Token verification failed:', firebaseError.message);
      
      if (firebaseError.code === 'auth/id-token-expired') {
        return res.status(401).json({ success: false, error: 'Unauthorized: Token expired' });
      }
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal server error in authentication' });
  }
};

module.exports = { verifyToken };
