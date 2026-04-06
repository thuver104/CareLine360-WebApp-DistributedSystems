const express = require("express");
const {
  createEmergency,
  getAllEmergencies,
  getEmergencyById,
  updateStatus,
  getNearestHospital,
} = require("../controllers/emergencyController");
const { validateEmergency, validateStatusUpdate } = require("../validators/emergencyValidator");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["patient", "admin", "responder"]), validateEmergency, createEmergency);
router.get("/", authMiddleware, roleMiddleware(["admin", "responder", "doctor"]), getAllEmergencies);
router.get("/:id", authMiddleware, roleMiddleware(["admin", "responder", "doctor", "patient"]), getEmergencyById);
router.patch("/:id/status", authMiddleware, roleMiddleware(["admin", "responder"]), validateStatusUpdate, updateStatus);
router.get("/:id/nearest-hospital", authMiddleware, roleMiddleware(["admin", "responder", "patient"]), getNearestHospital);

module.exports = router;
