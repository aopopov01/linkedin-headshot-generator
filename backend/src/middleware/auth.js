const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Middleware to authenticate users using JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token or user not found' 
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      subscription_status: user.subscription_status,
      credits_remaining: user.credits_remaining
    };

    // Update last_active timestamp
    await db('users')
      .where({ id: user.id })
      .update({ last_active: new Date() });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

/**
 * Middleware to check if user has required subscription level
 */
const requireSubscription = (requiredLevel = 'premium') => {
  return (req, res, next) => {
    const { subscription_status } = req.user;
    
    const subscriptionLevels = {
      free: 0,
      premium: 1,
      enterprise: 2
    };

    if (subscriptionLevels[subscription_status] >= subscriptionLevels[requiredLevel]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `${requiredLevel} subscription required`,
      current_subscription: subscription_status,
      required_subscription: requiredLevel
    });
  };
};

/**
 * Middleware to check if user has sufficient credits
 */
const requireCredits = (creditsNeeded = 1) => {
  return (req, res, next) => {
    const { credits_remaining, subscription_status } = req.user;

    // Premium and enterprise users have unlimited credits
    if (subscription_status === 'premium' || subscription_status === 'enterprise') {
      return next();
    }

    if (credits_remaining >= creditsNeeded) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient credits',
      credits_remaining,
      credits_needed: creditsNeeded
    });
  };
};

module.exports = {
  authenticateToken,
  requireSubscription,
  requireCredits
};