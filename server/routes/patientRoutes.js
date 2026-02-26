const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { 
  getMyProfile , 
  updateMyProfile , 
  uploadAvatar, 
  deactivateMyAccount , 
  explainMedicalText,

  getMyMedicalRecords,
  getMyPrescriptions,
  getAllDoctorsForPatient,

  getDoctorDetailsForPatient,
  getAllHospitalsForPatient,
  getHospitalDetailsForPatient,
  createEmergency,
} = require("../controllers/patientController");
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

router.patch(
  "/me/deactivate",
  authMiddleware,
  roleMiddleware(["patient"]),
  deactivateMyAccount
);

router.post(
  "/me/ai-explain", 
  authMiddleware, 
  roleMiddleware(["patient"]), 
  explainMedicalText
);

// ✅ NEW: Patient view own medical records
router.get(
  "/me/medical-record", 
  authMiddleware, 
  roleMiddleware(["patient"]), 
  getMyMedicalRecords
);

// ✅ NEW: Patient view own prescriptions
router.get(
  "/me/prescription", 
  authMiddleware, 
  roleMiddleware(["patient"]), 
  getMyPrescriptions
);

// ✅ NEW: Patient get all doctors list
router.get(
  "/doctor", 
  authMiddleware, 
  roleMiddleware(["patient"]), 
  getAllDoctorsForPatient
);

// hospitals
router.get(
  "/hospital",
  authMiddleware, 
  roleMiddleware(["patient"]),
  getAllHospitalsForPatient
);

router.get(
  "/hospital/:id",
  authMiddleware, 
  roleMiddleware(["patient"]),
  getHospitalDetailsForPatient
);

// doctors detail
router.get(
  "/doctor/:id",
  authMiddleware, 
  roleMiddleware(["patient"]),
  getDoctorDetailsForPatient
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["patient"]),
  createEmergency
);

// Get appointments for a specific patient (for doctors)
router.get(
  "/:patientId/appointment",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getAllPatientAppointments
);

// Get ratings for a specific patient (for doctors)
router.get(
  "/:patientId/rating",
  authMiddleware,
  roleMiddleware(["doctor"]),
  getPatientRatings
);



module.exports = router;
