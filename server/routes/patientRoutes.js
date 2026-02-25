const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { getMyProfile, updateMyProfile, uploadAvatar, getPatientStats, generatePatientReport } = require("../controllers/patientController");
const { imageUpload } = require("../middleware/upload");

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  roleMiddleware(["patient"]),
  getMyProfile,
);

router.patch(
  "/me", 
  authMiddleware, 
  roleMiddleware(["patient"]), 
  updateMyProfile
);

router.patch(
  "/me/avatar",
  authMiddleware,
  roleMiddleware(["patient"]),
  imageUpload.single("avatar"),
  uploadAvatar
);

// Stats endpoint for patient analytics
router.get(
  "/me/stats",
  authMiddleware,
  roleMiddleware(["patient"]),
  getPatientStats
);

// Report generation endpoint for patients
router.post(
  "/reports/generate",
  authMiddleware,
  roleMiddleware(["patient"]),
  generatePatientReport
);

module.exports = router;
