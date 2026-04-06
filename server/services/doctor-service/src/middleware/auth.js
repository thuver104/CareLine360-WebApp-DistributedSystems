const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * JWT Authentication Middleware
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = decoded; // { userId, role, email, phone }
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      throw err;
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Role-based Authorization Middleware
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
