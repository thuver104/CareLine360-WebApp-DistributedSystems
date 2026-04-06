const { body, param, query } = require('express-validator');

const createProfileValidation = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),
  body('specialization')
    .notEmpty()
    .withMessage('Specialization is required'),
];

const avatarValidation = [
  body('image')
    .notEmpty()
    .withMessage('Image is required')
    .matches(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/)
    .withMessage('Invalid base64 image format'),
];

const slotsValidation = [
  body('slots')
    .isArray({ min: 1 })
    .withMessage('At least one slot is required'),
  body('slots.*.date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('slots.*.startTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('slots.*.endTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
];

const updateSlotValidation = [
  param('slotId')
    .isMongoId()
    .withMessage('Invalid slot ID'),
  body('startTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time must be in HH:MM format'),
];

module.exports = {
  createProfileValidation,
  avatarValidation,
  slotsValidation,
  updateSlotValidation,
};
