/**
 * Authentication Middleware
 * Validates JWT tokens and extracts user info
 */

const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      // For patient role, fetch patientId
      if (decoded.role === 'patient') {
        const patient = await Patient.findOne({
          userId: req.user.userId.toString(),
          isDeleted: { $ne: true }
        }).select('patientId');

        if (patient) {
          req.user.patientId = patient.patientId;
        }
      }

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Role-based access control middleware
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }
  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  optionalAuth
};
