const { body, query, param } = require('express-validator');

/**
 * Create appointment validation
 */
const createAppointmentRules = [
  body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isString()
    .trim(),
  body('doctorName')
    .optional()
    .isString()
    .trim(),
  body('specialization')
    .optional()
    .isString()
    .trim(),
  body('date')
    .notEmpty()
    .withMessage('Appointment date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  body('time')
    .notEmpty()
    .withMessage('Appointment time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)'),
  body('consultationType')
    .optional()
    .isIn(['in-person', 'video', 'phone'])
    .withMessage('Invalid consultation type'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
];

/**
 * Update appointment validation
 */
const updateAppointmentRules = [
  param('id')
    .notEmpty()
    .withMessage('Appointment ID is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format'),
  body('consultationType')
    .optional()
    .isIn(['in-person', 'video', 'phone'])
    .withMessage('Invalid consultation type'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 }),
];

/**
 * Reschedule validation
 */
const rescheduleRules = [
  param('id')
    .notEmpty()
    .withMessage('Appointment ID is required'),
  body('date')
    .notEmpty()
    .withMessage('New date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const newDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        throw new Error('Cannot reschedule to a past date');
      }
      return true;
    }),
  body('time')
    .notEmpty()
    .withMessage('New time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format'),
];

/**
 * Cancel validation
 */
const cancelRules = [
  param('id')
    .notEmpty()
    .withMessage('Appointment ID is required'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

/**
 * Query filters validation
 */
const queryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status filter'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateFrom format'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateTo format'),
];

/**
 * ID param validation
 */
const idParamRules = [
  param('id')
    .notEmpty()
    .withMessage('Appointment ID is required'),
];

/**
 * Check availability validation
 */
const checkAvailabilityRules = [
  query('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required'),
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  query('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format'),
];

module.exports = {
  createAppointmentRules,
  updateAppointmentRules,
  rescheduleRules,
  cancelRules,
  queryRules,
  idParamRules,
  checkAvailabilityRules,
};
