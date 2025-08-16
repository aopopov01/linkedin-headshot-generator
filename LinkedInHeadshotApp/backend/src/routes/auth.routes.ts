/**
 * Authentication Routes
 * 
 * Handles user authentication, registration, password management,
 * and OAuth integrations.
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = express.Router();
const authController = new AuthController();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('firstName').optional().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register',
  rateLimitMiddleware('auth', 5, 60), // 5 attempts per minute
  registerValidation,
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login',
  rateLimitMiddleware('auth', 10, 60), // 10 attempts per minute
  loginValidation,
  authController.login
);

/**
 * @route POST /api/auth/logout
 * @desc User logout
 * @access Private
 */
router.post('/logout', authController.logout);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh',
  rateLimitMiddleware('auth', 20, 60), // 20 refresh attempts per minute
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  authController.refreshToken
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password',
  rateLimitMiddleware('auth', 3, 60), // 3 attempts per minute
  forgotPasswordValidation,
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password',
  rateLimitMiddleware('auth', 5, 60),
  resetPasswordValidation,
  authController.resetPassword
);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify email address
 * @access Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification
 * @access Public
 */
router.post('/resend-verification',
  rateLimitMiddleware('auth', 3, 60),
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  authController.resendVerification
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain uppercase, lowercase, number and special character')
  ],
  authController.changePassword
);

// ================================
// OAUTH ROUTES
// ================================

/**
 * @route GET /api/auth/oauth/linkedin
 * @desc LinkedIn OAuth login
 * @access Public
 */
router.get('/oauth/linkedin', authController.linkedinAuth);

/**
 * @route GET /api/auth/oauth/linkedin/callback
 * @desc LinkedIn OAuth callback
 * @access Public
 */
router.get('/oauth/linkedin/callback', authController.linkedinCallback);

/**
 * @route GET /api/auth/oauth/google
 * @desc Google OAuth login
 * @access Public
 */
router.get('/oauth/google', authController.googleAuth);

/**
 * @route GET /api/auth/oauth/google/callback
 * @desc Google OAuth callback
 * @access Public
 */
router.get('/oauth/google/callback', authController.googleCallback);

// ================================
// PLATFORM CONNECTIONS
// ================================

/**
 * @route POST /api/auth/connect/linkedin
 * @desc Connect LinkedIn account
 * @access Private
 */
router.post('/connect/linkedin', authController.connectLinkedIn);

/**
 * @route POST /api/auth/connect/instagram
 * @desc Connect Instagram account
 * @access Private
 */
router.post('/connect/instagram', authController.connectInstagram);

/**
 * @route POST /api/auth/connect/facebook
 * @desc Connect Facebook account
 * @access Private
 */
router.post('/connect/facebook', authController.connectFacebook);

/**
 * @route DELETE /api/auth/disconnect/:platform
 * @desc Disconnect platform account
 * @access Private
 */
router.delete('/disconnect/:platform', authController.disconnectPlatform);

/**
 * @route GET /api/auth/connections
 * @desc Get user's connected platforms
 * @access Private
 */
router.get('/connections', authController.getConnections);

// ================================
// SECURITY & ADMIN
// ================================

/**
 * @route POST /api/auth/revoke-all-sessions
 * @desc Revoke all user sessions
 * @access Private
 */
router.post('/revoke-all-sessions', authController.revokeAllSessions);

/**
 * @route GET /api/auth/sessions
 * @desc Get active user sessions
 * @access Private
 */
router.get('/sessions', authController.getUserSessions);

/**
 * @route POST /api/auth/enable-2fa
 * @desc Enable two-factor authentication
 * @access Private
 */
router.post('/enable-2fa', authController.enableTwoFA);

/**
 * @route POST /api/auth/verify-2fa
 * @desc Verify 2FA code
 * @access Private
 */
router.post('/verify-2fa',
  [body('code').isLength({ min: 6, max: 6 }).withMessage('2FA code must be 6 digits')],
  authController.verifyTwoFA
);

/**
 * @route POST /api/auth/disable-2fa
 * @desc Disable two-factor authentication
 * @access Private
 */
router.post('/disable-2fa', authController.disableTwoFA);

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