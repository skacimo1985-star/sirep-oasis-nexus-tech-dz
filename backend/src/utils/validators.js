'use strict';

const { body, param, query } = require('express-validator');

const validateEmail = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Invalid email address');

const validatePassword = body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .withMessage('Password must be at least 8 chars with uppercase, lowercase, number, and special char');

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const sanitizeInput = body().trim().escape();

module.exports = {
  validateEmail,
  validatePassword,
  validateObjectId,
  validatePagination,
  sanitizeInput,
};
