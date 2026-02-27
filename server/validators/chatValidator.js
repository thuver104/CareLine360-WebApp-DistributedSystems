const { body, param } = require("express-validator");

const sendMessageRules = [
  body("appointment").notEmpty().withMessage("Appointment ID is required").isMongoId().withMessage("Invalid appointment ID"),
  body("sender").notEmpty().withMessage("Sender ID is required").isMongoId().withMessage("Invalid sender ID"),
  body("message").notEmpty().withMessage("Message is required").trim(),
];

const getMessagesRules = [
  param("appointmentId").isMongoId().withMessage("Invalid appointment ID"),
];

const markReadRules = [
  param("appointmentId").isMongoId().withMessage("Invalid appointment ID"),
  body("userId").notEmpty().withMessage("User ID is required").isMongoId().withMessage("Invalid user ID"),
];

module.exports = {
  sendMessageRules,
  getMessagesRules,
  markReadRules,
};
