const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
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
} = require('../controllers/authController');


const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: { message: 'Too many attempts, try again later' },
});

// ===== Public Routes =====

router.post(
  "/register",
  authLimiter,
  [
    body("role").isIn(["patient", "doctor"]).withMessage("Role must be patient or doctor"),
    body("fullName").notEmpty().withMessage("fullName required"),
    body("identifier").notEmpty().withMessage("Email or phone is required"),
    body("password")
      .isLength({ min: 8 })
      .matches(/[A-Z]/).withMessage("Must include uppercase")
      .matches(/[0-9]/).withMessage("Must include number")
      .matches(/[^A-Za-z0-9]/).withMessage("Must include special character"),
  ],
  register
);

router.post(
  "/login",
  authLimiter,
  [
    body("identifier").notEmpty().withMessage("Email or phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

// Refresh token
router.post(
  '/refresh', 
  authLimiter, 
  [body('refreshToken').notEmpty()], 
  refresh
);

router.post(
  "/email/send-verify-otp",
  authLimiter,
  [body("identifier").notEmpty().withMessage("Email or phone is required")],
  sendVerifyEmailOtp
);

router.post(
  "/email/verify-otp",
  authLimiter,
  [
    body("identifier").notEmpty(),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  ],
  confirmVerifyEmailOtp
);

router.post(
  "/password/forgot",
  authLimiter,
  [body("identifier").notEmpty().withMessage("Email or phone is required")],
  forgotPassword
);

router.post(
  '/password/reset',
  authLimiter,
  [
    body('identifier').notEmpty(),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .matches(/[0-9]/)
      .matches(/[^A-Za-z0-9]/),
  ],
  resetPassword
);

// ===== Protected Routes =====

// Logout
router.post('/logout', authMiddleware, logout);

// Get current user
router.get('/me', authMiddleware, getMe);

// Validate token (for API Gateway)
router.post('/validate', validateTokenEndpoint);

// Verify doctor (admin only)
router.patch(
  '/verify-doctor/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [body('status').isIn(['ACTIVE', 'REJECTED']).withMessage('Status must be ACTIVE or REJECTED')],
  verifyDoctorEndpoint
);

module.exports = router;
