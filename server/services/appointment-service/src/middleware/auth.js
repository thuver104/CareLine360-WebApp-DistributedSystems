const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * JWT authentication middleware
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to request
      req.user = {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role,
        fullName: decoded.fullName || decoded.name,
      };
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
    });
  }
};

/**
 * Role authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        yourRole: req.user.role,
      });
    }
    
    next();
  };
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName || decoded.name,
    };
  } catch (error) {
    req.user = null;
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
