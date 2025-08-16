/**
 * User Management Routes
 * 
 * Handles user profile, preferences, subscription management,
 * and account operations.
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import multer from 'multer';

const router = express.Router();
const userController = new UserController();

// Configure multer for avatar uploads
const upload = multer({
  dest: 'uploads/avatars/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// ================================
// PROFILE MANAGEMENT
// ================================

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile',
  [
    body('firstName').optional().isLength({ min: 1 }).withMessage('First name cannot be empty'),
    body('lastName').optional().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
    body('phoneNumber').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('industry').optional().isLength({ min: 1 }).withMessage('Industry cannot be empty'),
    body('jobTitle').optional().isLength({ min: 1 }).withMessage('Job title cannot be empty'),
    body('company').optional().isLength({ min: 1 }).withMessage('Company cannot be empty'),
    body('location').optional().isLength({ min: 1 }).withMessage('Location cannot be empty'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('linkedinUrl').optional().isURL().withMessage('Invalid LinkedIn URL'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters')
  ],
  userController.updateProfile
);

/**
 * @route POST /api/users/avatar
 * @desc Upload user avatar
 * @access Private
 */
router.post('/avatar',
  rateLimitMiddleware('upload', 10, 60),
  upload.single('avatar'),
  userController.uploadAvatar
);

/**
 * @route DELETE /api/users/avatar
 * @desc Delete user avatar
 * @access Private
 */
router.delete('/avatar', userController.deleteAvatar);

// ================================
// PREFERENCES
// ================================

/**
 * @route GET /api/users/preferences
 * @desc Get user preferences
 * @access Private
 */
router.get('/preferences', userController.getPreferences);

/**
 * @route PUT /api/users/preferences
 * @desc Update user preferences
 * @access Private
 */
router.put('/preferences',
  [
    body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
    body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be boolean'),
    body('marketingEmails').optional().isBoolean().withMessage('Marketing emails must be boolean'),
    body('autoOptimization').optional().isBoolean().withMessage('Auto optimization must be boolean'),
    body('backgroundProcessing').optional().isBoolean().withMessage('Background processing must be boolean'),
    body('qualityOverSpeed').optional().isBoolean().withMessage('Quality over speed must be boolean'),
    body('shareAnalytics').optional().isBoolean().withMessage('Share analytics must be boolean'),
    body('publicProfile').optional().isBoolean().withMessage('Public profile must be boolean'),
    body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Invalid theme'),
    body('language').optional().isLength({ min: 2, max: 5 }).withMessage('Invalid language code'),
    body('timezone').optional().isLength({ min: 1 }).withMessage('Invalid timezone'),
    body('preferredStyles').optional().isArray().withMessage('Preferred styles must be an array'),
    body('defaultPlatforms').optional().isArray().withMessage('Default platforms must be an array'),
    body('preferredAIModel').optional().isIn(['openai', 'replicate', 'stabilityai']).withMessage('Invalid AI model'),
    body('qualityPreference').optional().isIn(['high', 'balanced', 'fast']).withMessage('Invalid quality preference'),
    body('costPreference').optional().isIn(['lowest', 'optimized', 'premium']).withMessage('Invalid cost preference')
  ],
  userController.updatePreferences
);

// ================================
// SUBSCRIPTION MANAGEMENT
// ================================

/**
 * @route GET /api/users/subscription
 * @desc Get user subscription details
 * @access Private
 */
router.get('/subscription', userController.getSubscription);

/**
 * @route POST /api/users/subscription/upgrade
 * @desc Upgrade subscription
 * @access Private
 */
router.post('/subscription/upgrade',
  [
    body('tier').isIn(['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']).withMessage('Invalid subscription tier'),
    body('interval').optional().isIn(['month', 'year']).withMessage('Invalid billing interval')
  ],
  userController.upgradeSubscription
);

/**
 * @route POST /api/users/subscription/cancel
 * @desc Cancel subscription
 * @access Private
 */
router.post('/subscription/cancel',
  [
    body('reason').optional().isLength({ max: 500 }).withMessage('Cancellation reason too long')
  ],
  userController.cancelSubscription
);

/**
 * @route POST /api/users/subscription/reactivate
 * @desc Reactivate canceled subscription
 * @access Private
 */
router.post('/subscription/reactivate', userController.reactivateSubscription);

/**
 * @route GET /api/users/subscription/usage
 * @desc Get subscription usage statistics
 * @access Private
 */
router.get('/subscription/usage',
  [
    query('period').optional().isIn(['current', 'last', 'year']).withMessage('Invalid period')
  ],
  userController.getUsage
);

// ================================
// BILLING & PAYMENTS
// ================================

/**
 * @route GET /api/users/billing/history
 * @desc Get billing history
 * @access Private
 */
router.get('/billing/history',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  userController.getBillingHistory
);

/**
 * @route GET /api/users/billing/upcoming
 * @desc Get upcoming billing information
 * @access Private
 */
router.get('/billing/upcoming', userController.getUpcomingBilling);

/**
 * @route POST /api/users/billing/payment-method
 * @desc Update payment method
 * @access Private
 */
router.post('/billing/payment-method',
  [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
  ],
  userController.updatePaymentMethod
);

/**
 * @route GET /api/users/billing/payment-methods
 * @desc Get saved payment methods
 * @access Private
 */
router.get('/billing/payment-methods', userController.getPaymentMethods);

/**
 * @route DELETE /api/users/billing/payment-method/:paymentMethodId
 * @desc Delete payment method
 * @access Private
 */
router.delete('/billing/payment-method/:paymentMethodId',
  [
    param('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
  ],
  userController.deletePaymentMethod
);

// ================================
// ANALYTICS & INSIGHTS
// ================================

/**
 * @route GET /api/users/analytics
 * @desc Get user analytics dashboard
 * @access Private
 */
router.get('/analytics',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'quarter', 'year']).withMessage('Invalid period')
  ],
  userController.getAnalytics
);

/**
 * @route GET /api/users/insights
 * @desc Get personalized insights and recommendations
 * @access Private
 */
router.get('/insights', userController.getInsights);

/**
 * @route GET /api/users/cost-analysis
 * @desc Get cost analysis and savings report
 * @access Private
 */
router.get('/cost-analysis',
  [
    query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('Invalid period')
  ],
  userController.getCostAnalysis
);

// ================================
// PLATFORM CONNECTIONS
// ================================

/**
 * @route GET /api/users/platforms
 * @desc Get connected platforms
 * @access Private
 */
router.get('/platforms', userController.getConnectedPlatforms);

/**
 * @route GET /api/users/platforms/:platform/stats
 * @desc Get platform-specific statistics
 * @access Private
 */
router.get('/platforms/:platform/stats',
  [
    param('platform').isIn(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'snapchat', 'whatsapp'])
      .withMessage('Invalid platform')
  ],
  userController.getPlatformStats
);

/**
 * @route POST /api/users/platforms/:platform/sync
 * @desc Sync platform data
 * @access Private
 */
router.post('/platforms/:platform/sync',
  rateLimitMiddleware('sync', 5, 60),
  [
    param('platform').isIn(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'snapchat', 'whatsapp'])
      .withMessage('Invalid platform')
  ],
  userController.syncPlatform
);

// ================================
// NOTIFICATIONS
// ================================

/**
 * @route GET /api/users/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/notifications',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('unread').optional().isBoolean().withMessage('Unread must be boolean')
  ],
  userController.getNotifications
);

/**
 * @route PUT /api/users/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/notifications/:notificationId/read',
  [
    param('notificationId').isUUID().withMessage('Invalid notification ID')
  ],
  userController.markNotificationRead
);

/**
 * @route PUT /api/users/notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/notifications/mark-all-read', userController.markAllNotificationsRead);

/**
 * @route DELETE /api/users/notifications/:notificationId
 * @desc Delete notification
 * @access Private
 */
router.delete('/notifications/:notificationId',
  [
    param('notificationId').isUUID().withMessage('Invalid notification ID')
  ],
  userController.deleteNotification
);

// ================================
// ACCOUNT MANAGEMENT
// ================================

/**
 * @route GET /api/users/activity
 * @desc Get account activity log
 * @access Private
 */
router.get('/activity',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  userController.getActivity
);

/**
 * @route POST /api/users/export-data
 * @desc Request data export
 * @access Private
 */
router.post('/export-data',
  rateLimitMiddleware('export', 1, 3600), // 1 export per hour
  [
    body('format').optional().isIn(['json', 'csv']).withMessage('Invalid export format'),
    body('includeOptimizations').optional().isBoolean().withMessage('Include optimizations must be boolean'),
    body('includeAnalytics').optional().isBoolean().withMessage('Include analytics must be boolean')
  ],
  userController.exportData
);

/**
 * @route DELETE /api/users/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account',
  rateLimitMiddleware('account-deletion', 1, 86400), // 1 deletion attempt per day
  [
    body('confirmation').equals('DELETE').withMessage('Confirmation must be "DELETE"'),
    body('reason').optional().isLength({ max: 1000 }).withMessage('Reason too long')
  ],
  userController.deleteAccount
);

/**
 * @route POST /api/users/feedback
 * @desc Submit user feedback
 * @access Private
 */
router.post('/feedback',
  rateLimitMiddleware('feedback', 5, 3600), // 5 feedback submissions per hour
  [
    body('type').isIn(['bug', 'feature', 'improvement', 'general']).withMessage('Invalid feedback type'),
    body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject must be 1-200 characters'),
    body('message').isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5')
  ],
  userController.submitFeedback
);

// Error handling middleware
router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
});

export default router;