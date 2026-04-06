/**
 * Patient Routes
 * API endpoints for patient profile management
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { imageUpload } = require('../middleware/upload');
const { validateUpdateProfile } = require('../validators/patientValidator');
const {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deactivateAccount,
  searchPatients,
  getPatientById,
  getPatientSummary
} = require('../controllers/patientController');

// ===== Patient's own profile =====

// GET /api/v1/patient/me - Get my profile
router.get(
  '/me',
  authMiddleware,
  roleMiddleware(['patient']),
  getMyProfile
);

// PATCH /api/v1/patient/me - Update my profile
router.patch(
  '/me',
  authMiddleware,
  roleMiddleware(['patient']),
  validateUpdateProfile,
  updateMyProfile
);

// PATCH /api/v1/patient/me/avatar - Upload avatar
router.patch(
  '/me/avatar',
  authMiddleware,
  roleMiddleware(['patient']),
  imageUpload.single('avatar'),
  uploadAvatar
);

// PATCH /api/v1/patient/me/deactivate - Deactivate account
router.patch(
  '/me/deactivate',
  authMiddleware,
  roleMiddleware(['patient']),
  deactivateAccount
);

// ===== Admin/Doctor access =====

// GET /api/v1/patient/search - Search patients
router.get(
  '/search',
  authMiddleware,
  roleMiddleware(['admin', 'doctor']),
  searchPatients
);

// GET /api/v1/patient/:patientId - Get patient by ID
router.get(
  '/:patientId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor']),
  getPatientById
);

// GET /api/v1/patient/:patientId/summary - Get patient summary (internal API)
router.get(
  '/:patientId/summary',
  authMiddleware,
  getPatientSummary
);

module.exports = router;
