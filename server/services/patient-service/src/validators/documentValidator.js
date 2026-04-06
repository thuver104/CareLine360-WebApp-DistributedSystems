/**
 * Document Validators
 * Input validation for document endpoints
 */

const { body, param, query } = require('express-validator');

const validateUpdateDocument = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters'),

  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be max 1000 characters'),

  body('documentType')
    .optional()
    .isIn([
      'lab_report',
      'prescription',
      'medical_image',
      'discharge_summary',
      'insurance',
      'identification',
      'vaccination',
      'allergy_report',
      'other'
    ])
    .withMessage('Invalid document type'),

  body('documentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be max 50 characters')
];

const validateDocumentId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID')
];

const validateDocumentQuery = [
  query('documentType')
    .optional()
    .isIn([
      'lab_report',
      'prescription',
      'medical_image',
      'discharge_summary',
      'insurance',
      'identification',
      'vaccination',
      'allergy_report',
      'other'
    ])
    .withMessage('Invalid document type'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'documentDate', 'title'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

module.exports = {
  validateUpdateDocument,
  validateDocumentId,
  validateDocumentQuery
};
