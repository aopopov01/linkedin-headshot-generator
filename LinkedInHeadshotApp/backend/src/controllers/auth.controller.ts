/**
 * Authentication Controller
 * 
 * Handles all authentication-related HTTP requests including registration,
 * login, password management, OAuth, and platform connections.
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';
import { LoggerService } from '../services/logger.service';
import { EmailService } from '../services/email.service';
import { APIError } from '../utils/errors';

interface AuthRequest extends Request {
  user?: any;
  session?: any;
}

export class AuthController {
  private authService: AuthService;
  private logger: LoggerService;

  constructor() {
    this.authService = new AuthService();
    this.logger = new LoggerService('AuthController');
  }

  /**
   * Register new user
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, password, firstName, lastName } = req.body;

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user: result.user,
          emailSent: true
        }
      });

    } catch (error) {
      this.logger.error('Registration failed:', error);
      next(error);
    }
  };

  /**
   * User login
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, password, rememberMe } = req.body;

      const result = await this.authService.login({
        email,
        password,
        rememberMe,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 24 hours
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });

    } catch (error) {
      this.logger.error('Login failed:', error);
      next(error);
    }
  };

  /**
   * User logout
   */
  public logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user && req.session) {
        await this.authService.logout(req.session.sessionId || 'unknown', req.user.id);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      this.logger.error('Logout failed:', error);
      next(error);
    }
  };

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      // Try to get refresh token from cookie first, then from body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required'
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Update refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });

    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      next(error);
    }
  };

  /**
   * Forgot password
   */
  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email } = req.body;

      await this.authService.forgotPassword(email);

      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent password reset instructions.'
      });

    } catch (error) {
      this.logger.error('Forgot password failed:', error);
      next(error);
    }
  };

  /**
   * Reset password
   */
  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { token, password } = req.body;

      await this.authService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      });

    } catch (error) {
      this.logger.error('Password reset failed:', error);
      next(error);
    }
  };

  /**
   * Verify email address
   */
  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;

      const result = await this.authService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: result.user
        }
      });

    } catch (error) {
      this.logger.error('Email verification failed:', error);
      next(error);
    }
  };

  /**
   * Resend verification email
   */
  public resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email } = req.body;

      const user = await DatabaseService.getClient().user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true, emailVerified: true }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({
          success: false,
          error: 'Email is already verified'
        });
        return;
      }

      // Generate new verification token
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Store in Redis
      await RedisService.set(`email-verification:${verificationToken}`, {
        userId: user.id,
        email: user.email
      }, 86400); // 24 hours

      // Send verification email
      await EmailService.sendVerificationEmail(user.email, verificationToken, user.firstName);

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      this.logger.error('Resend verification failed:', error);
      next(error);
    }
  };

  /**
   * Change password
   */
  public changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      this.logger.error('Password change failed:', error);
      next(error);
    }
  };

  // OAuth Methods (placeholders - would need actual OAuth implementation)

  /**
   * LinkedIn OAuth login
   */
  public linkedinAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Redirect to LinkedIn OAuth
      const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
        `redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&` +
        `scope=r_liteprofile%20r_emailaddress%20w_member_social`;

      res.redirect(linkedinAuthUrl);

    } catch (error) {
      this.logger.error('LinkedIn auth failed:', error);
      next(error);
    }
  };

  /**
   * LinkedIn OAuth callback
   */
  public linkedinCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, error } = req.query;

      if (error) {
        res.status(400).json({
          success: false,
          error: 'OAuth authorization failed'
        });
        return;
      }

      // Exchange code for access token and user data
      // This would involve LinkedIn API calls
      // For now, returning placeholder response

      res.json({
        success: true,
        message: 'LinkedIn OAuth not fully implemented',
        data: { code }
      });

    } catch (error) {
      this.logger.error('LinkedIn OAuth callback failed:', error);
      next(error);
    }
  };

  /**
   * Google OAuth login
   */
  public googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Placeholder for Google OAuth
      res.status(501).json({
        success: false,
        error: 'Google OAuth not implemented yet'
      });

    } catch (error) {
      this.logger.error('Google auth failed:', error);
      next(error);
    }
  };

  /**
   * Google OAuth callback
   */
  public googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Placeholder for Google OAuth callback
      res.status(501).json({
        success: false,
        error: 'Google OAuth callback not implemented yet'
      });

    } catch (error) {
      this.logger.error('Google OAuth callback failed:', error);
      next(error);
    }
  };

  // Platform Connection Methods (placeholders)

  /**
   * Connect LinkedIn account
   */
  public connectLinkedIn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(501).json({
        success: false,
        error: 'LinkedIn connection not implemented yet'
      });

    } catch (error) {
      this.logger.error('LinkedIn connection failed:', error);
      next(error);
    }
  };

  /**
   * Connect Instagram account
   */
  public connectInstagram = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(501).json({
        success: false,
        error: 'Instagram connection not implemented yet'
      });

    } catch (error) {
      this.logger.error('Instagram connection failed:', error);
      next(error);
    }
  };

  /**
   * Connect Facebook account
   */
  public connectFacebook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(501).json({
        success: false,
        error: 'Facebook connection not implemented yet'
      });

    } catch (error) {
      this.logger.error('Facebook connection failed:', error);
      next(error);
    }
  };

  /**
   * Disconnect platform account
   */
  public disconnectPlatform = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { platform } = req.params;
      const userId = req.user?.id;

      await DatabaseService.getClient().platformAccount.deleteMany({
        where: {
          userId,
          platform
        }
      });

      res.json({
        success: true,
        message: `${platform} account disconnected successfully`
      });

    } catch (error) {
      this.logger.error('Platform disconnection failed:', error);
      next(error);
    }
  };

  /**
   * Get connected platforms
   */
  public getConnections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      const connections = await DatabaseService.getClient().platformAccount.findMany({
        where: { userId },
        select: {
          id: true,
          platform: true,
          username: true,
          displayName: true,
          isActive: true,
          lastSyncAt: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: { connections }
      });

    } catch (error) {
      this.logger.error('Get connections failed:', error);
      next(error);
    }
  };

  // Security Methods

  /**
   * Revoke all user sessions
   */
  public revokeAllSessions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      await this.authService.revokeAllUserSessions(userId);

      res.json({
        success: true,
        message: 'All sessions revoked successfully'
      });

    } catch (error) {
      this.logger.error('Revoke all sessions failed:', error);
      next(error);
    }
  };

  /**
   * Get active user sessions
   */
  public getUserSessions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This would require storing session metadata
      res.status(501).json({
        success: false,
        error: 'Session management not fully implemented yet'
      });

    } catch (error) {
      this.logger.error('Get user sessions failed:', error);
      next(error);
    }
  };

  // 2FA Methods (placeholders)

  /**
   * Enable two-factor authentication
   */
  public enableTwoFA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(501).json({
        success: false,
        error: '2FA not implemented yet'
      });

    } catch (error) {
      this.logger.error('Enable 2FA failed:', error);
      next(error);
    }
  };

  /**
   * Verify 2FA code
   */
  public verifyTwoFA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(501).json({
        success: false,
        error: '2FA verification not implemented yet'
      });

    } catch (error) {
      this.logger.error('Verify 2FA failed:', error);
      next(error);
    }
  };

  /**
   * Disable two-factor authentication
   */
  public disableTwoFA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(501).json({
        success: false,
        error: '2FA disable not implemented yet'
      });

    } catch (error) {
      this.logger.error('Disable 2FA failed:', error);
      next(error);
    }
  };
}