const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const logger = require('../config/logger');
const { authenticateToken } = require('../middleware/auth');
// Validation middlewares removed for demo - add back in production
const analyticsService = require('../services/analyticsService');
const paymentService = require('../services/paymentService');

const router = express.Router();

/**
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    const user = await db('users')
      .where({ id: userId })
      .select([
        'id', 'email', 'first_name', 'last_name', 'profile_picture_url',
        'subscription_status', 'photo_credits', 'total_photos_generated',
        'created_at', 'last_active', 'preferences'
      ])
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's recent activity
    const recentPhotos = await db('generated_photos')
      .where({ user_id: userId })
      .whereNotNull('completed_at')
      .orderBy('completed_at', 'desc')
      .limit(5)
      .select(['id', 'style_template', 'completed_at', 'download_count']);

    // Get subscription details if active
    let subscriptionDetails = null;
    if (user.subscription_status === 'active' && user.stripe_customer_id) {
      try {
        // Get subscription info from payment service
        subscriptionDetails = await paymentService.getUserSubscriptionDetails(userId);
      } catch (error) {
        logger.warn('Failed to get subscription details:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          preferences: user.preferences ? JSON.parse(user.preferences) : {}
        },
        recent_photos: recentPhotos,
        subscription_details: subscriptionDetails,
        available_credits: user.subscription_status === 'active' ? 'unlimited' : user.photo_credits
      }
    });

  } catch (error) {
    logger.error('Failed to get user profile:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const allowedFields = ['first_name', 'last_name', 'profile_picture_url', 'preferences'];
    
    // Filter only allowed fields
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'preferences') {
          updateData[field] = JSON.stringify(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateData.updated_at = new Date();

    await db('users')
      .where({ id: userId })
      .update(updateData);

    // Track profile update
    await analyticsService.trackEvent(userId, 'Profile Updated', {
      updated_fields: Object.keys(updateData)
    });

    logger.info('User profile updated:', {
      userId,
      fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update user profile:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * Change user password
 */
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { current_password, new_password } = req.body;

    // Get current user data
    const user = await db('users')
      .where({ id: userId })
      .select('password_hash')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 12);

    // Update password
    await db('users')
      .where({ id: userId })
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    // Track password change
    await analyticsService.trackEvent(userId, 'Password Changed', {
      timestamp: new Date().toISOString()
    });

    logger.info('User password changed:', { userId });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Failed to change user password:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

/**
 * Get user's photo generation history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count }] = await db('generated_photos')
      .where({ user_id: userId })
      .count('id as count');

    // Get photos with details
    const photos = await db('generated_photos')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select([
        'id', 'style_template', 'processing_status', 'processing_time_seconds',
        'processing_cost', 'download_count', 'created_at', 'completed_at'
      ]);

    // Calculate statistics
    const stats = await db('generated_photos')
      .where({ user_id: userId })
      .select([
        db.raw('COUNT(*) as total_generations'),
        db.raw('COUNT(CASE WHEN processing_status = "completed" THEN 1 END) as successful_generations'),
        db.raw('SUM(CASE WHEN processing_status = "completed" THEN processing_cost ELSE 0 END) as total_processing_cost'),
        db.raw('SUM(download_count) as total_downloads'),
        db.raw('AVG(CASE WHEN processing_status = "completed" THEN processing_time_seconds END) as avg_processing_time')
      ])
      .first();

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        photos,
        statistics: {
          total_generations: parseInt(stats.total_generations) || 0,
          successful_generations: parseInt(stats.successful_generations) || 0,
          success_rate: stats.total_generations > 0 
            ? ((stats.successful_generations / stats.total_generations) * 100).toFixed(1) + '%'
            : '0%',
          total_processing_cost: parseFloat(stats.total_processing_cost) || 0,
          total_downloads: parseInt(stats.total_downloads) || 0,
          average_processing_time: Math.round(stats.avg_processing_time) || 0
        },
        pagination: {
          page,
          limit,
          total: parseInt(count),
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get user history:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get generation history'
    });
  }
});

/**
 * Get user's purchase history
 */
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    const purchases = await db('purchases')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .select([
        'id', 'product_id', 'amount_usd', 'status', 'platform',
        'created_at', 'stripe_payment_id'
      ]);

    // Calculate purchase statistics
    const stats = await db('purchases')
      .where({ user_id: userId, status: 'completed' })
      .select([
        db.raw('COUNT(*) as total_purchases'),
        db.raw('SUM(amount_usd) as total_spent'),
        db.raw('MIN(created_at) as first_purchase'),
        db.raw('MAX(created_at) as latest_purchase')
      ])
      .first();

    res.json({
      success: true,
      data: {
        purchases,
        statistics: {
          total_purchases: parseInt(stats.total_purchases) || 0,
          total_spent: parseFloat(stats.total_spent) || 0,
          first_purchase: stats.first_purchase,
          latest_purchase: stats.latest_purchase
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get user purchases:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get purchase history'
    });
  }
});

/**
 * Delete user account
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Verify password
    const user = await db('users')
      .where({ id: userId })
      .select('password_hash')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Start transaction for account deletion
    await db.transaction(async (trx) => {
      // Delete related data
      await trx('analytics_events').where({ user_id: userId }).del();
      await trx('generated_photos').where({ user_id: userId }).del();
      await trx('purchases').where({ user_id: userId }).del();
      
      // Delete user account
      await trx('users').where({ id: userId }).del();
    });

    // Track account deletion
    await analyticsService.trackEvent(userId, 'Account Deleted', {
      deletion_date: new Date().toISOString()
    });

    logger.info('User account deleted:', { userId });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete user account:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

/**
 * Get user analytics and insights
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const days = parseInt(req.query.days) || 30;

    // Get analytics data
    const analytics = await analyticsService.getUserAnalytics(userId, days);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Failed to get user analytics:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data'
    });
  }
});

module.exports = router;