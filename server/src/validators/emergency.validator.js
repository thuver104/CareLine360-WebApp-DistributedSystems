const { body, validationResult } = require('express-validator');

const validateEmergency = [
    body('patient')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isMongoId()
        .withMessage('Invalid Patient ID format'),
    body('description')
        .notEmpty()
        .withMessage('Description is required')
        .trim(),
    body('latitude')
        .notEmpty()
        .withMessage('Latitude is required')
        .isNumeric()
        .withMessage('Latitude must be a number'),
    body('longitude')
        .notEmpty()
        .withMessage('Longitude is required')
        .isNumeric()
        .withMessage('Longitude must be a number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
];

const validateStatusUpdate = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['PENDING', 'DISPATCHED', 'ARRIVED', 'RESOLVED'])
        .withMessage('Invalid status value'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
];

module.exports = { validateEmergency, validateStatusUpdate };
