/**
 * Medical Record Routes
 * API endpoints for patient medical history
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  getMyMedicalRecords,
  getMedicalRecord,
  getLatestVitals,
  getDiagnosisHistory,
  getPatientStats
} = require('../controllers/medicalRecordController');

// All routes require patient role
router.use(authMiddleware);
router.use(roleMiddleware(['patient']));

// GET /api/v1/patient/medical-records - Get my medical records
router.get('/', getMyMedicalRecords);

// GET /api/v1/patient/medical-records/vitals/latest - Get latest vitals
router.get('/vitals/latest', getLatestVitals);

// GET /api/v1/patient/medical-records/diagnosis - Get diagnosis history
router.get('/diagnosis', getDiagnosisHistory);

// GET /api/v1/patient/medical-records/stats - Get visit statistics
router.get('/stats', getPatientStats);

// GET /api/v1/patient/medical-records/:id - Get single record
router.get('/:id', getMedicalRecord);

module.exports = router;
