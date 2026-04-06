/**
 * Patient Validators
 * Input validation for patient profile endpoints
 */

const { body, param, query } = require('express-validator');

const validateUpdateProfile = [
  // Full name validation
  body('fullName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),

  // Date of birth validation
  body('dob')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      if (date > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),

  // Gender validation
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', ''])
    .withMessage('Invalid gender value'),

  // NIC validation (Sri Lanka format)
  body('nic')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
      if (!nicRegex.test(value.trim())) {
        throw new Error('Invalid NIC format (9 digits + V/X or 12 digits)');
      }
      return true;
    }),

  // Phone validation
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const phoneRegex = /^(?:\+94|0)?\d{9}$/;
      if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
        throw new Error('Invalid phone number format');
      }
      return true;
    }),

  // Address validation
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),

  body('address.district')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must be max 100 characters'),

  body('address.city')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be max 100 characters'),

  body('address.line1')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line must be max 200 characters'),

  // Emergency contact validation
  body('emergencyContact')
    .optional()
    .isObject()
    .withMessage('Emergency contact must be an object'),

  body('emergencyContact.name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be max 100 characters'),

  body('emergencyContact.phone')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const phoneRegex = /^(?:\+94|0)?\d{9}$/;
      if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
        throw new Error('Invalid emergency phone number');
      }
      return true;
    }),

  body('emergencyContact.relationship')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship must be max 50 characters'),

  // Blood group validation
  body('bloodGroup')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const bgRegex = /^(A|B|AB|O)[+-]$/i;
      if (!bgRegex.test(value.trim())) {
        throw new Error('Invalid blood group (e.g., A+, O-, AB+)');
      }
      return true;
    }),

  // Allergies validation
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),

  body('allergies.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each allergy must be max 100 characters'),

  // Chronic conditions validation
  body('chronicConditions')
    .optional()
    .isArray()
    .withMessage('Chronic conditions must be an array'),

  body('chronicConditions.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each condition must be max 100 characters'),

  // Height validation
  body('heightCm')
    .optional()
    .isFloat({ min: 30, max: 250 })
    .withMessage('Height must be between 30 and 250 cm'),

  // Weight validation
  body('weightKg')
    .optional()
    .isFloat({ min: 2, max: 300 })
    .withMessage('Weight must be between 2 and 300 kg')
];

const validatePatientId = [
  param('patientId')
    .isString()
    .matches(/^P\d+$/)
    .withMessage('Invalid patient ID format')
];

const validateSearchQuery = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be max 100 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  validateUpdateProfile,
  validatePatientId,
  validateSearchQuery
};
