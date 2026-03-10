'use strict';

const { body, param, query, validationResult } = require('express-validator');
const { ROLES, SENSOR_TYPES, ALERT_SEVERITY } = require('../utils/constants');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }
  return next();
};

const validateLoginBody = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validateRegisterBody = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be at least 8 chars with uppercase, lowercase, number, and special char'),
  body('firstName').notEmpty().trim().withMessage('First name required'),
  body('lastName').notEmpty().trim().withMessage('Last name required'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role'),
];

const validateUpdateUserBody = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const validateSensorDataBody = [
  body('deviceId').notEmpty().trim().withMessage('Device ID is required'),
  body('sensorType').isIn(Object.values(SENSOR_TYPES)).withMessage('Invalid sensor type'),
  body('value').isNumeric().withMessage('Value must be numeric'),
  body('unit').notEmpty().trim().withMessage('Unit is required'),
];

const validateAlertBody = [
  body('type').notEmpty().withMessage('Alert type is required'),
  body('severity').isIn(Object.values(ALERT_SEVERITY)).withMessage('Invalid severity level'),
  body('message').notEmpty().withMessage('Message is required'),
  body('source').notEmpty().withMessage('Source is required'),
];

const validatePaginationQuery = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

module.exports = {
  validate,
  validateLoginBody,
  validateRegisterBody,
  validateUpdateUserBody,
  validateSensorDataBody,
  validateAlertBody,
  validatePaginationQuery,
  validateObjectId,
};
