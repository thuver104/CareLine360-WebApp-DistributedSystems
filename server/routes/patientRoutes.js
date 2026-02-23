const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { getMyProfile , updateMyProfile , uploadAvatar} = require("../controllers/patientController");
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

module.exports = router;
