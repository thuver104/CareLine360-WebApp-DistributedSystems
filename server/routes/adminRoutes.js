const express = require("express");
const { body } = require("express-validator");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  getPendingDoctors,
  patchUserStatus,
  postCreateUser,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getStats,
  getAppointments,
  createMeetingLink
} = require("../controllers/adminController");

const router = express.Router();

// admin-only for most routes
router.use(authMiddleware);

// Emergency tab endpoints (accessible by admin and responder)
const { getAllEmergencies, getEmergencyById, updateStatus, getNearestHospital } = require("../controllers/emergencyController");
router.get("/emergencies", roleMiddleware(["admin", "responder"]), getAllEmergencies);
router.get("/emergencies/:id", roleMiddleware(["admin", "responder"]), getEmergencyById);
router.patch("/emergencies/:id/status", roleMiddleware(["admin", "responder"]), updateStatus);
router.get("/emergencies/:id/nearest-hospital", roleMiddleware(["admin", "responder"]), getNearestHospital);

// All other admin routes remain admin-only
router.get("/doctors/pending", roleMiddleware(["admin"]), getPendingDoctors);
router.get("/users", roleMiddleware(["admin"]), getAllUsers);
router.get("/appointments", roleMiddleware(["admin"]), getAppointments);
router.post("/appointments/:id/meeting", roleMiddleware(["admin"]), createMeetingLink);
router.patch("/users/:id/toggle-status", roleMiddleware(["admin"]), toggleUserStatus);
router.delete("/users/:id", roleMiddleware(["admin"]), deleteUser);
router.get("/stats", roleMiddleware(["admin"]), getStats);

router.patch(
  "/users/:id/status",
  [roleMiddleware(["admin"]), body("status").isIn(["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"]).withMessage("Invalid status")],
  patchUserStatus
);

router.post(
  "/users",
  [
    roleMiddleware(["admin"]),
    body("password").isLength({ min: 8 }),
    body().custom((value) => {
      if (!value.email && !value.phone) throw new Error("Email or phone is required");
      return true;
    }),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("role").isIn(["patient", "doctor", "responder", "admin"]).withMessage("Invalid role")
  ],
  postCreateUser
);

module.exports = router;
