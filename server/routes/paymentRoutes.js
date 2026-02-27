const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const { createPaymentRules, paymentIdRules } = require("../validators/paymentValidator");
const {
  createPayment,
  getPaymentById,
  getPaymentByAppointment,
  verifyPayment,
  failPayment,
} = require("../controllers/paymentController");

router.post("/", createPaymentRules, validateRequest, createPayment);
router.get("/appointment/:appointmentId", getPaymentByAppointment);
router.get("/:id", paymentIdRules, validateRequest, getPaymentById);
router.patch("/:id/verify", paymentIdRules, validateRequest, verifyPayment);
router.patch("/:id/fail", paymentIdRules, validateRequest, failPayment);

module.exports = router;
