const { body, validationResult } = require("express-validator");

const finishValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return next();
};

const validateEmergency = [
  body("patient").notEmpty().isMongoId().withMessage("Valid patient ID is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("latitude").notEmpty().isNumeric().withMessage("Latitude must be numeric"),
  body("longitude").notEmpty().isNumeric().withMessage("Longitude must be numeric"),
  finishValidation,
];

const validateStatusUpdate = [
  body("status")
    .notEmpty()
    .isIn(["PENDING", "DISPATCHED", "ARRIVED", "RESOLVED"])
    .withMessage("Invalid status value"),
  finishValidation,
];

module.exports = { validateEmergency, validateStatusUpdate };
