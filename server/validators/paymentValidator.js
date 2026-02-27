const { body, param } = require("express-validator");

const createPaymentRules = [
  body("appointment").notEmpty().withMessage("Appointment ID is required").isMongoId().withMessage("Invalid appointment ID"),
  body("patient").notEmpty().withMessage("Patient ID is required").isMongoId().withMessage("Invalid patient ID"),
  body("amount").notEmpty().withMessage("Amount is required").isFloat({ min: 0 }).withMessage("Amount must be positive"),
  body("currency").optional().trim(),
  body("method").optional().trim(),
];

const paymentIdRules = [
  param("id").isMongoId().withMessage("Invalid payment ID"),
];

module.exports = {
  createPaymentRules,
  paymentIdRules,
};
