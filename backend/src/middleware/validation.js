const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', { errors: errors.array(), path: req.path });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  next();
};

/**
 * User registration validation rules
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1-50 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1-50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  handleValidationErrors
];

/**
 * User login validation rules
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Photo generation validation rules
 */
const validatePhotoGeneration = [
  body('style_template')
    .isIn(['corporate', 'creative', 'executive', 'startup', 'healthcare'])
    .withMessage('Invalid style template'),
  body('ai_parameters')
    .optional()
    .isObject()
    .withMessage('AI parameters must be a valid object'),
  handleValidationErrors
];

/**
 * Purchase validation rules
 */
const validatePurchase = [
  body('product_id')
    .isIn(['5_photos', '10_photos', '25_photos', 'monthly_unlimited', 'annual_unlimited'])
    .withMessage('Invalid product ID'),
  body('payment_method_id')
    .notEmpty()
    .withMessage('Payment method ID is required'),
  body('platform')
    .isIn(['ios', 'android', 'web'])
    .withMessage('Invalid platform'),
  handleValidationErrors
];

/**
 * Analytics event validation rules
 */
const validateAnalyticsEvent = [
  body('event_name')
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Event name is required and must be under 100 characters'),
  body('event_properties')
    .optional()
    .isObject()
    .withMessage('Event properties must be a valid object'),
  body('session_id')
    .optional()
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  body('platform')
    .optional()
    .isIn(['ios', 'android', 'web'])
    .withMessage('Invalid platform'),
  handleValidationErrors
];

/**
 * UUID parameter validation
 */
const validateUuidParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePhotoGeneration,
  validatePurchase,
  validateAnalyticsEvent,
  validateUuidParam,
  validatePagination
};