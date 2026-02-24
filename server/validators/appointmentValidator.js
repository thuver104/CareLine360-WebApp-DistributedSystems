const { body, param } = require("express-validator");

const createAppointmentRules = [
  // patient is set server-side from JWT (req.user.userId)
  body("doctor").notEmpty().withMessage("Doctor ID is required").isMongoId().withMessage("Invalid doctor ID"),
  body("date").notEmpty().withMessage("Date is required").isISO8601().withMessage("Invalid date format"),
  body("time").notEmpty().withMessage("Time is required").trim(),
  body("consultationType")
    .notEmpty().withMessage("Consultation type is required")
    .isIn(["in-person", "video", "phone"]).withMessage("Invalid consultation type"),
  body("symptoms").optional().trim(),
  body("notes").optional().trim(),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
];

const updateAppointmentRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),
  body("date").optional().isISO8601().withMessage("Invalid date format"),
  body("time").optional().trim(),
  body("consultationType").optional().isIn(["in-person", "video", "phone"]).withMessage("Invalid consultation type"),
  body("symptoms").optional().trim(),
  body("notes").optional().trim(),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
];

const statusTransitionRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),
  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["confirmed", "completed", "cancelled"]).withMessage("Invalid status"),
];

const rescheduleRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),
  body("date").notEmpty().withMessage("New date is required").isISO8601().withMessage("Invalid date format"),
  body("time").notEmpty().withMessage("New time is required").trim(),
];

const cancelRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),
  body("reason").notEmpty().withMessage("Cancellation reason is required").trim(),
];

module.exports = {
  createAppointmentRules,
  updateAppointmentRules,
  statusTransitionRules,
  rescheduleRules,
  cancelRules,
};
