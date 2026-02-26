const express = require("express");
const { body } = require("express-validator");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

const {
  createProfile,
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
  getAnalytics,
  getAvailability,
  addSlots,
  deleteSlot,
  updateSlot,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  getPatients,
  getPatientDetail,
  createRecord,
  getRecordsByPatient,
  updateRecord,
  savePrescription,
  getPrescriptions,
  downloadPrescription,
  getRatings,
  listDoctors,
  deactivateAccount,
} = require("../controllers/doctorController");

const {
  generatePrescriptionPdf,
} = require("../controllers/prescriptionController");

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/public", listDoctors);

// ── Doctor-only protected ─────────────────────────────────────────────────────
const doctorAuth = [authMiddleware, roleMiddleware(["doctor"])];

// Profile
router.post(
  "/profile",
  doctorAuth,
  [body("fullName").notEmpty(), body("specialization").notEmpty()],
  createProfile,
);
router.get("/profile", doctorAuth, getProfile);
router.put("/profile", doctorAuth, updateProfile);

// Account deactivation (soft-delete)
router.delete("/account", doctorAuth, deactivateAccount);

// Avatar — base64 via JSON body: { image: "data:image/jpeg;base64,..." }
router.put(
  "/profile/avatar",
  doctorAuth,
  [body("image").notEmpty().withMessage("image (base64) is required")],
  updateAvatar,
);

// Dashboard & analytics
router.get("/dashboard", doctorAuth, getDashboard);
router.get("/analytics", doctorAuth, getAnalytics);

// Availability
router.get("/availability", doctorAuth, getAvailability);
router.post(
  "/availability",
  doctorAuth,
  [body("slots").isArray({ min: 1 })],
  addSlots,
);
router.delete("/availability/:slotId", doctorAuth, deleteSlot);
router.put(
  "/availability/:slotId",
  doctorAuth,
  [body("startTime").notEmpty(), body("endTime").notEmpty()],
  updateSlot,
);

// Appointments
router.get("/appointments", doctorAuth, getAppointments);
router.patch("/appointments/:appointmentId", doctorAuth, updateAppointment);
router.delete("/appointments/:appointmentId", doctorAuth, deleteAppointment);

// Patients
router.get("/patients", doctorAuth, getPatients);
router.get("/patients/:patientId", doctorAuth, getPatientDetail);

// Medical records
router.post("/records", doctorAuth, createRecord);
router.get("/records/:patientId", doctorAuth, getRecordsByPatient);
router.put("/records/:recordId", doctorAuth, updateRecord);

// Prescriptions
router.post("/prescriptions/generate", doctorAuth, generatePrescriptionPdf);
router.post("/prescriptions", doctorAuth, savePrescription);
router.get("/prescriptions", doctorAuth, getPrescriptions);
router.get("/prescriptions/download", doctorAuth, downloadPrescription);

// Ratings
router.get("/ratings", doctorAuth, getRatings);

module.exports = router;
