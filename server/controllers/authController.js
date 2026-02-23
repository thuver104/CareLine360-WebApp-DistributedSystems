const { validationResult } = require("express-validator");
const { registerUser, loginUser, refreshAccessToken, logoutUser , sendEmailVerificationOtp, verifyEmailOtp, sendPasswordResetOtp, resetPasswordWithOtp } = require("../services/authService");

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


module.exports = { register, 
            login, 
            refresh, 
            logout, 
            sendVerifyEmailOtp, 
            confirmVerifyEmailOtp, 
            forgotPassword, 
            resetPassword };
