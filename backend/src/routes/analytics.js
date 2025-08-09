const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

/**
 * Track custom event
 */
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { event_name, properties = {} } = req.body;

    if (!event_name) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required'
      });
    }

    await analyticsService.trackEvent(userId, event_name, {
      ...properties,
      source: 'mobile_app',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to track event:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track event'
    });
  }
});

/**
 * Batch track multiple events
 */
router.post('/track-batch', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Events array is required and must not be empty'
      });
    }

    const trackingPromises = events.map(event => {
      if (!event.event_name) {
        throw new Error('All events must have event_name');
      }

      return analyticsService.trackEvent(userId, event.event_name, {
        ...event.properties,
        source: 'mobile_app',
        timestamp: new Date().toISOString()
      });
    });

    await Promise.all(trackingPromises);

    logger.info('Batch events tracked:', {
      userId,
      eventCount: events.length
    });

    res.json({
      success: true,
      message: `${events.length} events tracked successfully`
    });

  } catch (error) {
    logger.error('Failed to track batch events:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track events'
    });
  }
});

/**
 * Get user's personal analytics
 */
router.get('/user-stats', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const days = parseInt(req.query.days) || 30;

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

/**
 * Track app session start
 */
router.post('/session/start', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { 
      app_version, 
      device_type, 
      os_version, 
      platform = 'mobile' 
    } = req.body;

    await analyticsService.trackSessionStart(userId, {
      appVersion: app_version,
      deviceType: device_type,
      osVersion: os_version,
      platform
    });

    res.json({
      success: true,
      message: 'Session started'
    });

  } catch (error) {
    logger.error('Failed to track session start:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track session start'
    });
  }
});

/**
 * Track app session end
 */
router.post('/session/end', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { 
      duration_minutes, 
      photos_generated = 0, 
      actions_taken = 0 
    } = req.body;

    await analyticsService.trackSessionEnd(userId, {
      durationMinutes: duration_minutes,
      photosGenerated: photos_generated,
      actionsTaken: actions_taken
    });

    res.json({
      success: true,
      message: 'Session ended'
    });

  } catch (error) {
    logger.error('Failed to track session end:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track session end'
    });
  }
});

/**
 * Track error
 */
router.post('/error', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { 
      error_type, 
      error_message, 
      error_code, 
      context, 
      stack_trace 
    } = req.body;

    await analyticsService.trackError(userId, {
      errorType: error_type,
      errorMessage: error_message,
      errorCode: error_code,
      context,
      stackTrace: stack_trace
    });

    logger.warn('User error tracked:', {
      userId,
      errorType: error_type,
      errorMessage: error_message
    });

    res.json({
      success: true,
      message: 'Error tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to track error:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to track error'
    });
  }
});

/**
 * Submit feedback
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { 
      rating, 
      feedback_type, 
      feedback_text, 
      context 
    } = req.body;

    await analyticsService.trackFeedback(userId, {
      rating,
      type: feedback_type,
      text: feedback_text,
      context
    });

    // Also store detailed feedback in database
    await db('user_feedback').insert({
      user_id: userId,
      rating: rating || null,
      feedback_type: feedback_type || 'general',
      feedback_text: feedback_text || '',
      context: context ? JSON.stringify(context) : null,
      created_at: new Date()
    });

    logger.info('User feedback received:', {
      userId,
      rating,
      feedbackType: feedback_type
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    logger.error('Failed to submit feedback:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// Admin-only routes below this point
/**
 * Get application-wide analytics (Admin only)
 */
router.get('/app-stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const analytics = await analyticsService.getApplicationAnalytics(days);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Failed to get application analytics:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get application analytics'
    });
  }
});

/**
 * Get user funnel analysis (Admin only)
 */
router.get('/funnel', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const funnel = await analyticsService.getUserFunnel(days);

    res.json({
      success: true,
      data: funnel
    });

  } catch (error) {
    logger.error('Failed to get user funnel:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get funnel analysis'
    });
  }
});

/**
 * Get detailed user analytics by user ID (Admin only)
 */
router.get('/user/:userId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const analytics = await analyticsService.getUserAnalytics(userId, days);

    // Get additional user context
    const user = await db('users')
      .where({ id: userId })
      .select([
        'email', 'created_at', 'subscription_status', 
        'total_photos_generated', 'last_active'
      ])
      .first();

    res.json({
      success: true,
      data: {
        user_info: user,
        analytics
      }
    });

  } catch (error) {
    logger.error('Failed to get user analytics:', {
      error: error.message,
      targetUserId: req.params.userId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics'
    });
  }
});

/**
 * Get recent errors for monitoring (Admin only)
 */
router.get('/errors', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const errors = await db('analytics_events')
      .where('event_name', 'Error Occurred')
      .where('created_at', '>=', since)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .select(['user_id', 'properties', 'created_at']);

    const processedErrors = errors.map(error => ({
      user_id: error.user_id,
      timestamp: error.created_at,
      ...JSON.parse(error.properties)
    }));

    // Get error summary
    const errorSummary = {};
    processedErrors.forEach(error => {
      const key = `${error.error_type}:${error.error_code || 'unknown'}`;
      errorSummary[key] = (errorSummary[key] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        recent_errors: processedErrors,
        error_summary: errorSummary,
        period_hours: hours,
        total_errors: errors.length
      }
    });

  } catch (error) {
    logger.error('Failed to get error analytics:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get error data'
    });
  }
});

module.exports = router;