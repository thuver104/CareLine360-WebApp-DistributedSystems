const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { 
  getMyProfile , 
  updateMyProfile , 
  uploadAvatar, 
  deactivateMyAccount , 
  medicalRecord 
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

// NEW ROUTE: Get my medical history (for patients)
router.get(
  "/me/medical-record", 
  authMiddleware,
  roleMiddleware(["patient"]),
  medicalRecord
);

module.exports = router;
