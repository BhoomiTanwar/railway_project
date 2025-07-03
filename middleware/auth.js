const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const userResult = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Verify admin API key
const verifyAdminApiKey = (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key') || req.header('x-api-key');
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No API key provided.' 
      });
    }

    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Invalid API key.' 
      });
    }

    next();
  } catch (error) {
    console.error('API key verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
};

// Verify admin role
const verifyAdminRole = (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    console.error('Admin role verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization.' 
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdminApiKey,
  verifyAdminRole
};