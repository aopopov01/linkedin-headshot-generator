/**
 * Authentication Service
 * 
 * Comprehensive authentication service handling JWT tokens, password management,
 * OAuth integrations, and session management.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { DatabaseService } from './database.service';
import { RedisService } from './redis.service';
import { LoggerService } from './logger.service';
import { EmailService } from './email.service';
import { AppConfig } from '../config/app.config';
import { APIError } from '../utils/errors';

export interface TokenPayload {
  userId: string;
  email: string;
  tier: string;
  sessionId: string;
}

export interface LoginResult {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OAuthUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  platformUserId: string;
  platform: string;
}

export class AuthService {
  private logger: LoggerService;
  private config: AppConfig;

  constructor() {
    this.logger = new LoggerService('AuthService');
    this.config = new AppConfig();
  }

  /**
   * Register a new user
   */
  public async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ user: any; verificationToken: string }> {
    try {
      const { email, password, firstName, lastName } = userData;

      // Check if user already exists
      const existingUser = await DatabaseService.getClient().user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new APIError('User already exists with this email', 409);
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user with profile
      const user = await DatabaseService.getClient().user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          profile: {
            create: {
              preferredStyles: ['executive'],
              defaultPlatforms: ['linkedin'],
              preferredAIModel: 'replicate',
              qualityPreference: 'balanced',
              costPreference: 'optimized'
            }
          },
          preferences: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              marketingEmails: false,
              autoOptimization: false,
              backgroundProcessing: true,
              qualityOverSpeed: true,
              shareAnalytics: false,
              publicProfile: false,
              theme: 'system',
              language: 'en',
              timezone: 'UTC'
            }
          },
          analytics: {
            create: {}
          }
        },
        include: {
          profile: true,
          preferences: true,
          subscription: true
        }
      });

      // Store verification token in Redis (expires in 24 hours)
      await RedisService.set(`email-verification:${verificationToken}`, {
        userId: user.id,
        email: user.email
      }, 86400);

      // Send verification email
      await EmailService.sendVerificationEmail(email, verificationToken, firstName);

      // Log registration event
      await DatabaseService.logAuditEvent({
        userId: user.id,
        userEmail: email,
        action: 'user_register',
        resource: 'user',
        resourceId: user.id,
        success: true,
        metadata: { firstName, lastName }
      });

      this.logger.info(`User registered successfully: ${email}`);

      return {
        user: this.sanitizeUser(user),
        verificationToken
      };

    } catch (error) {
      this.logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  public async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<LoginResult> {
    try {
      const { email, password, rememberMe = false, ipAddress, userAgent } = credentials;

      // Find user with profile data
      const user = await DatabaseService.getClient().user.findUnique({
        where: { email },
        include: {
          profile: true,
          preferences: true,
          subscription: {
            include: {
              features: true
            }
          }
        }
      });

      if (!user) {
        throw new APIError('Invalid credentials', 401);
      }

      if (!user.isActive) {
        throw new APIError('Account is deactivated', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        // Log failed login attempt
        await DatabaseService.logAuditEvent({
          userId: user.id,
          userEmail: email,
          action: 'login_failed',
          success: false,
          ipAddress,
          userAgent,
          metadata: { reason: 'invalid_password' }
        });

        throw new APIError('Invalid credentials', 401);
      }

      // Generate session ID
      const sessionId = crypto.randomUUID();

      // Create tokens
      const accessTokenExpiry = rememberMe ? '7d' : this.config.jwt.accessTokenExpiry;
      const refreshTokenExpiry = rememberMe ? '30d' : this.config.jwt.refreshTokenExpiry;

      const accessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        sessionId
      }, accessTokenExpiry);

      const refreshToken = this.generateRefreshToken({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        sessionId
      }, refreshTokenExpiry);

      // Store session in Redis
      await RedisService.setSession(sessionId, {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        ipAddress,
        userAgent,
        createdAt: new Date(),
        lastActivity: new Date(),
        rememberMe
      }, rememberMe ? 2592000 : 86400); // 30 days or 24 hours

      // Update user login statistics
      await DatabaseService.getClient().user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 }
        }
      });

      // Log successful login
      await DatabaseService.logAuditEvent({
        userId: user.id,
        userEmail: email,
        action: 'login_success',
        success: true,
        ipAddress,
        userAgent,
        metadata: { sessionId, rememberMe }
      });

      this.logger.info(`User logged in successfully: ${email}`);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiry(accessTokenExpiry)
      };

    } catch (error) {
      this.logger.error('User login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as TokenPayload;

      // Check if session exists
      const session = await RedisService.getSession(decoded.sessionId);
      if (!session) {
        throw new APIError('Invalid session', 401);
      }

      // Get user
      const user = await DatabaseService.getClient().user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, tier: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new APIError('User not found or inactive', 401);
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        sessionId: decoded.sessionId
      });

      const newRefreshToken = this.generateRefreshToken({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        sessionId: decoded.sessionId
      });

      // Update session activity
      await RedisService.hset(`session:${decoded.sessionId}`, 'lastActivity', new Date());

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getTokenExpiry(this.config.jwt.accessTokenExpiry)
      };

    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new APIError('Invalid refresh token', 401);
    }
  }

  /**
   * Logout user
   */
  public async logout(sessionId: string, userId: string): Promise<void> {
    try {
      // Remove session from Redis
      await RedisService.deleteSession(sessionId);

      // Log logout event
      await DatabaseService.logAuditEvent({
        userId,
        action: 'logout',
        success: true,
        metadata: { sessionId }
      });

      this.logger.info(`User logged out: ${userId}`);

    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   */
  public async verifyEmail(token: string): Promise<{ success: boolean; user?: any }> {
    try {
      // Get verification data from Redis
      const verificationData = await RedisService.get(`email-verification:${token}`);
      
      if (!verificationData) {
        throw new APIError('Invalid or expired verification token', 400);
      }

      // Update user email verification status
      const user = await DatabaseService.getClient().user.update({
        where: { id: verificationData.userId },
        data: { emailVerified: true },
        include: {
          profile: true,
          preferences: true
        }
      });

      // Remove verification token from Redis
      await RedisService.del(`email-verification:${token}`);

      // Log verification event
      await DatabaseService.logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: 'email_verified',
        success: true
      });

      // Send welcome email
      await EmailService.sendWelcomeEmail(user.email, user.firstName);

      this.logger.info(`Email verified successfully: ${user.email}`);

      return {
        success: true,
        user: this.sanitizeUser(user)
      };

    } catch (error) {
      this.logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  public async forgotPassword(email: string): Promise<void> {
    try {
      const user = await DatabaseService.getClient().user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true, isActive: true }
      });

      if (!user || !user.isActive) {
        // Don't reveal if user exists for security
        this.logger.warn(`Password reset requested for non-existent user: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Store reset token in Redis (expires in 1 hour)
      await RedisService.set(`password-reset:${resetToken}`, {
        userId: user.id,
        email: user.email
      }, 3600);

      // Send password reset email
      await EmailService.sendPasswordResetEmail(email, resetToken, user.firstName);

      // Log password reset request
      await DatabaseService.logAuditEvent({
        userId: user.id,
        userEmail: email,
        action: 'password_reset_requested',
        success: true
      });

      this.logger.info(`Password reset requested: ${email}`);

    } catch (error) {
      this.logger.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Get reset data from Redis
      const resetData = await RedisService.get(`password-reset:${token}`);
      
      if (!resetData) {
        throw new APIError('Invalid or expired reset token', 400);
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update user password
      await DatabaseService.getClient().user.update({
        where: { id: resetData.userId },
        data: { passwordHash }
      });

      // Remove reset token from Redis
      await RedisService.del(`password-reset:${token}`);

      // Revoke all user sessions for security
      await this.revokeAllUserSessions(resetData.userId);

      // Log password reset
      await DatabaseService.logAuditEvent({
        userId: resetData.userId,
        userEmail: resetData.email,
        action: 'password_reset_completed',
        success: true
      });

      // Send password change confirmation email
      await EmailService.sendPasswordChangeConfirmation(resetData.email);

      this.logger.info(`Password reset completed: ${resetData.email}`);

    } catch (error) {
      this.logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await DatabaseService.getClient().user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, passwordHash: true }
      });

      if (!user) {
        throw new APIError('User not found', 404);
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new APIError('Current password is incorrect', 400);
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await DatabaseService.getClient().user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      // Log password change
      await DatabaseService.logAuditEvent({
        userId,
        userEmail: user.email,
        action: 'password_changed',
        success: true
      });

      // Send confirmation email
      await EmailService.sendPasswordChangeConfirmation(user.email);

      this.logger.info(`Password changed successfully: ${user.email}`);

    } catch (error) {
      this.logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * OAuth login/registration
   */
  public async oauthLogin(oauthData: OAuthUserData): Promise<LoginResult> {
    try {
      const { email, firstName, lastName, avatar, platformUserId, platform } = oauthData;

      // Check if user exists
      let user = await DatabaseService.getClient().user.findUnique({
        where: { email },
        include: {
          profile: true,
          preferences: true,
          subscription: { include: { features: true } },
          platformAccounts: true
        }
      });

      if (!user) {
        // Create new user from OAuth data
        user = await DatabaseService.getClient().user.create({
          data: {
            email,
            firstName,
            lastName,
            avatar,
            emailVerified: true, // OAuth emails are pre-verified
            profile: {
              create: {
                preferredStyles: ['executive'],
                defaultPlatforms: [platform],
                preferredAIModel: 'replicate'
              }
            },
            preferences: {
              create: {}
            },
            analytics: {
              create: {}
            }
          },
          include: {
            profile: true,
            preferences: true,
            subscription: { include: { features: true } },
            platformAccounts: true
          }
        });
      }

      // Check if platform account exists
      const existingPlatformAccount = user.platformAccounts?.find(
        account => account.platform === platform
      );

      if (!existingPlatformAccount) {
        // Create platform account connection
        await DatabaseService.getClient().platformAccount.create({
          data: {
            userId: user.id,
            platform,
            platformUserId,
            username: oauthData.email,
            displayName: `${firstName} ${lastName}`.trim(),
            accessToken: 'oauth-placeholder', // Will be updated with real token
            isActive: true,
            lastSyncAt: new Date()
          }
        });
      }

      // Generate session and tokens
      const sessionId = crypto.randomUUID();

      const accessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        sessionId
      });

      const refreshToken = this.generateRefreshToken({
        userId: user.id,
        email: user.email,
        tier: user.tier,
        sessionId
      });

      // Store session
      await RedisService.setSession(sessionId, {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        platform,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      // Update login statistics
      await DatabaseService.getClient().user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 }
        }
      });

      // Log OAuth login
      await DatabaseService.logAuditEvent({
        userId: user.id,
        userEmail: email,
        action: 'oauth_login',
        success: true,
        metadata: { platform, platformUserId }
      });

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiry(this.config.jwt.accessTokenExpiry)
      };

    } catch (error) {
      this.logger.error('OAuth login failed:', error);
      throw error;
    }
  }

  /**
   * Revoke all user sessions
   */
  public async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      // Get all session keys for user
      const sessionKeys = await RedisService.getClient().keys(`session:*`);
      
      for (const sessionKey of sessionKeys) {
        const session = await RedisService.get(sessionKey);
        if (session && session.userId === userId) {
          await RedisService.del(sessionKey);
        }
      }

      // Log session revocation
      await DatabaseService.logAuditEvent({
        userId,
        action: 'all_sessions_revoked',
        success: true
      });

      this.logger.info(`All sessions revoked for user: ${userId}`);

    } catch (error) {
      this.logger.error('Failed to revoke all sessions:', error);
      throw error;
    }
  }

  /**
   * Validate session
   */
  public async validateSession(sessionId: string): Promise<any> {
    try {
      const session = await RedisService.getSession(sessionId);
      
      if (!session) {
        return null;
      }

      // Update last activity
      await RedisService.hset(`session:${sessionId}`, 'lastActivity', new Date());

      return session;

    } catch (error) {
      this.logger.error('Session validation failed:', error);
      return null;
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(payload: TokenPayload, expiresIn?: string): string {
    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: expiresIn || this.config.jwt.accessTokenExpiry,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(payload: TokenPayload, expiresIn?: string): string {
    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: expiresIn || this.config.jwt.refreshTokenExpiry,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    });
  }

  /**
   * Get token expiry in seconds
   */
  private getTokenExpiry(expiry: string): number {
    const timeMap: { [key: string]: number } = {
      '15m': 15 * 60,
      '1h': 60 * 60,
      '24h': 24 * 60 * 60,
      '7d': 7 * 24 * 60 * 60,
      '30d': 30 * 24 * 60 * 60
    };

    return timeMap[expiry] || 15 * 60;
  }

  /**
   * Sanitize user data for API responses
   */
  private sanitizeUser(user: any): any {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export default new AuthService();