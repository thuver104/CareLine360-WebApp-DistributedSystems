const { validationResult } = require('express-validator');
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendEmailVerificationOtp,
  verifyEmailOtp,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  verifyDoctor,
  validateToken,
} = require('../services/authService');
const User = require('../models/User');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const result = await registerUser(req.body);
  return res.status(result.status).json(result.data);
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const result = await loginUser(req.body);
  return res.status(result.status).json(result.data);
};

const refresh = async (req, res) => {
  const result = await refreshAccessToken(req.body);
  return res.status(result.status).json(result.data);
};

const logout = async (req, res) => {
  const result = await logoutUser({ userId: req.user.userId });
  return res.status(result.status).json(result.data);
};

const sendVerifyEmailOtp = async (req, res) => {
  const result = await sendEmailVerificationOtp(req.body);
  return res.status(result.status).json(result.data);
};

const confirmVerifyEmailOtp = async (req, res) => {
  const result = await verifyEmailOtp(req.body);
  return res.status(result.status).json(result.data);
};

const forgotPassword = async (req, res) => {
  const result = await sendPasswordResetOtp(req.body);
  return res.status(result.status).json(result.data);
};

const resetPassword = async (req, res) => {
  const result = await resetPasswordWithOtp(req.body);
  return res.status(result.status).json(result.data);
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'email phone role status isVerified fullName'
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        email: user.email || null,
        phone: user.phone || null,
        fullName: user.fullName || null,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate token (for API Gateway)
const validateTokenEndpoint = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token required' });
  }

  const result = await validateToken(token);
  return res.json(result);
};

// Verify doctor (admin only)
const verifyDoctorEndpoint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const result = await verifyDoctor({
    doctorUserId: req.params.id,
    adminUserId: req.user.userId,
    status: req.body.status,
  });
  
  return res.status(result.status).json(result.data);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  sendVerifyEmailOtp,
  confirmVerifyEmailOtp,
  forgotPassword,
  resetPassword,
  getMe,
  validateTokenEndpoint,
  verifyDoctorEndpoint,
};
