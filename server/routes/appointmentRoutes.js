const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const {
  createAppointmentRules,
  updateAppointmentRules,
  statusTransitionRules,
  rescheduleRules,
  cancelRules,
} = require("../validators/appointmentValidator");
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  transitionStatus,
  rescheduleAppointment,
  cancelAppointment,
} = require("../controllers/appointmentController");

// All appointment routes require authentication
router.use(authMiddleware);

router.post("/", roleMiddleware(["patient"]), createAppointmentRules, validateRequest, createAppointment);
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id", updateAppointmentRules, validateRequest, updateAppointment);
router.delete("/:id", deleteAppointment);
router.patch("/:id/status", roleMiddleware(["doctor"]), statusTransitionRules, validateRequest, transitionStatus);
router.patch("/:id/reschedule", rescheduleRules, validateRequest, rescheduleAppointment);
router.patch("/:id/cancel", cancelRules, validateRequest, cancelAppointment);

module.exports = router;
