const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../config/logger');
const { authRateLimit } = require('../middleware/security');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// Apply auth rate limiting to all auth routes
router.use(authRateLimit);

/**
 * Register new user
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Create user
    const [user] = await db('users')
      .insert({
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        subscription_status: 'free',
        credits_remaining: 1, // Free tier gets 1 credit
        preferences: {}
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'subscription_status', 'credits_remaining']);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info('User registered successfully:', {
      userId: user.id,
      email: user.email
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        subscription_status: user.subscription_status,
        credits_remaining: user.credits_remaining
      },
      token
    });

  } catch (error) {
    logger.error('User registration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

/**
 * User login
 */
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last_active
    await db('users')
      .where({ id: user.id })
      .update({ last_active: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info('User logged in successfully:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        subscription_status: user.subscription_status,
        credits_remaining: user.credits_remaining,
        total_photos_generated: user.total_photos_generated
      },
      token
    });

  } catch (error) {
    logger.error('User login failed:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/**
 * Refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify current token (allowing expired ones for refresh)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Allow expired tokens for refresh
        decoded = jwt.decode(token);
      } else {
        throw error;
      }
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Verify user still exists and is active
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info('Token refreshed successfully:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

/**
 * Forgot password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await db('users').where({ email, is_active: true }).first();
    
    // Always return success to prevent email enumeration
    // In a real implementation, you would send a password reset email here
    logger.info('Password reset requested:', {
      email,
      userExists: !!user,
      userId: user?.id
    });

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });

  } catch (error) {
    logger.error('Forgot password failed:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
});

/**
 * Change password (requires authentication)
 */
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (new_password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(new_password)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number'
      });
    }

    // Get user
    const user = await db('users').where({ id: decoded.userId }).first();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Update password
    await db('users')
      .where({ id: user.id })
      .update({ password_hash: new_password_hash });

    logger.info('Password changed successfully:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password failed:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
});

/**
 * Demo login - creates or returns a demo user for testing
 */
router.post('/demo-login', async (req, res) => {
  try {
    const { email = 'demo@example.com' } = req.body;
    
    // Check if demo user exists
    let user = await db('users').where({ email }).first();
    
    if (!user) {
      // Create demo user
      [user] = await db('users')
        .insert({
          email,
          first_name: 'Demo',
          last_name: 'User',
          subscription_status: 'premium', // Give demo user premium access
          credits_remaining: 999, // Unlimited credits for demo
          preferences: {},
          password_hash: '$2a$12$demo.hash.for.demo.user.only' // Demo hash
        })
        .returning(['id', 'email', 'first_name', 'last_name', 'subscription_status', 'credits_remaining']);
    } else {
      // Reset demo user credits
      await db('users')
        .where({ id: user.id })
        .update({ 
          credits_remaining: 999,
          last_active: new Date()
        });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('Demo user logged in:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Demo login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        subscription_status: user.subscription_status,
        credits_remaining: user.credits_remaining,
        isDemo: true
      },
      token
    });

  } catch (error) {
    logger.error('Demo login failed:', error);
    res.status(500).json({
      success: false,
      message: 'Demo login failed'
    });
  }
});

module.exports = router;