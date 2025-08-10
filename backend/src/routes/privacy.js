const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');
const { authenticateToken, validatePrivacyRequest } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

/**
 * GDPR/CCPA Compliant Privacy Rights Endpoints
 * 
 * This router handles:
 * - Data Subject Access Requests (GDPR Article 15, CCPA Section 1798.110)
 * - Right to Rectification (GDPR Article 16)
 * - Right to Erasure/Deletion (GDPR Article 17, CCPA Section 1798.105)
 * - Data Portability (GDPR Article 20, CCPA Section 1798.130)
 * - Right to Object (GDPR Article 21)
 * - Do Not Sell (CCPA Section 1798.120)
 */

// Temporary storage for verification tokens (in production, use Redis or database)
const verificationTokens = new Map();

/**
 * Initiate Data Subject Access Request (GDPR Article 15)
 * GET /api/privacy/access-request
 */
router.post('/access-request', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { email, requestReason, includeProcessingDetails } = req.body;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    verificationTokens.set(verificationToken, {
      userId,
      requestType: 'access',
      email,
      requestReason,
      includeProcessingDetails,
      expiresAt,
      verified: false
    });

    // Send verification email (implement email service)
    await sendVerificationEmail(email, verificationToken, 'access');

    // Log the request
    await db('privacy_requests').insert({
      user_id: userId,
      request_type: 'access',
      status: 'pending_verification',
      request_details: JSON.stringify({
        requestReason,
        includeProcessingDetails
      }),
      verification_token: verificationToken,
      expires_at: expiresAt,
      created_at: new Date()
    });

    logger.info('Data access request initiated', {
      userId,
      requestType: 'access',
      verificationToken: verificationToken.substring(0, 8) + '...'
    });

    res.json({
      success: true,
      message: 'Data access request initiated. Please check your email to verify the request.',
      request_id: verificationToken.substring(0, 8),
      estimated_completion: '30 days'
    });

  } catch (error) {
    logger.error('Failed to initiate data access request:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to initiate data access request'
    });
  }
});

/**
 * Verify and process data access request
 * GET /api/privacy/verify-access/:token
 */
router.get('/verify-access/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const request = verificationTokens.get(token);

    if (!request || request.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark as verified and process request
    request.verified = true;
    await processDataAccessRequest(request.userId, token);

    // Update database
    await db('privacy_requests')
      .where({ verification_token: token })
      .update({
        status: 'processing',
        verified_at: new Date()
      });

    res.json({
      success: true,
      message: 'Request verified successfully. Your data export will be available within 30 days.',
      status: 'processing'
    });

  } catch (error) {
    logger.error('Failed to verify access request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify access request'
    });
  }
});

/**
 * Request Data Deletion (GDPR Article 17 / CCPA Section 1798.105)
 * POST /api/privacy/deletion-request
 */
router.post('/deletion-request', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { email, deletionReason, deleteAllData = true } = req.body;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    verificationTokens.set(verificationToken, {
      userId,
      requestType: 'deletion',
      email,
      deletionReason,
      deleteAllData,
      expiresAt,
      verified: false
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken, 'deletion');

    // Log the request
    await db('privacy_requests').insert({
      user_id: userId,
      request_type: 'deletion',
      status: 'pending_verification',
      request_details: JSON.stringify({
        deletionReason,
        deleteAllData
      }),
      verification_token: verificationToken,
      expires_at: expiresAt,
      created_at: new Date()
    });

    logger.info('Data deletion request initiated', {
      userId,
      requestType: 'deletion',
      verificationToken: verificationToken.substring(0, 8) + '...'
    });

    res.json({
      success: true,
      message: 'Data deletion request initiated. Please verify via email to proceed.',
      request_id: verificationToken.substring(0, 8),
      warning: 'This action cannot be undone. All your data will be permanently deleted.'
    });

  } catch (error) {
    logger.error('Failed to initiate deletion request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate deletion request'
    });
  }
});

/**
 * Verify and process data deletion request
 * POST /api/privacy/verify-deletion/:token
 */
router.post('/verify-deletion/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { confirmDeletion } = req.body;

    if (!confirmDeletion) {
      return res.status(400).json({
        success: false,
        message: 'Deletion confirmation required'
      });
    }

    const request = verificationTokens.get(token);

    if (!request || request.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Process deletion immediately for CCPA compliance (right to delete)
    await processDataDeletion(request.userId, request.deleteAllData);

    // Update request status
    await db('privacy_requests')
      .where({ verification_token: token })
      .update({
        status: 'completed',
        completed_at: new Date()
      });

    // Remove verification token
    verificationTokens.delete(token);

    logger.info('Data deletion completed', {
      userId: request.userId,
      deleteAllData: request.deleteAllData
    });

    res.json({
      success: true,
      message: 'Your data has been successfully deleted from our systems.',
      completion_date: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to process deletion request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process deletion request'
    });
  }
});

/**
 * Data Portability Request (GDPR Article 20)
 * POST /api/privacy/portability-request
 */
router.post('/portability-request', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { format = 'json', includePhotos = true } = req.body;

    if (!['json', 'csv', 'xml'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export format. Supported formats: json, csv, xml'
      });
    }

    // Generate export data
    const exportData = await generatePortabilityExport(userId, format, includePhotos);

    // Log the request
    await db('privacy_requests').insert({
      user_id: userId,
      request_type: 'portability',
      status: 'completed',
      request_details: JSON.stringify({ format, includePhotos }),
      completed_at: new Date(),
      created_at: new Date()
    });

    logger.info('Data portability request completed', {
      userId,
      format,
      includePhotos
    });

    res.json({
      success: true,
      message: 'Data export generated successfully',
      data: exportData,
      format,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to generate data export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate data export'
    });
  }
});

/**
 * Update Privacy Preferences (GDPR Article 7)
 * PUT /api/privacy/preferences
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { 
      marketing_consent,
      analytics_consent,
      personalization_consent,
      data_processing_consent,
      do_not_sell // CCPA
    } = req.body;

    // Update user preferences
    await db('users')
      .where({ id: userId })
      .update({
        preferences: JSON.stringify({
          marketing_consent,
          analytics_consent,
          personalization_consent,
          data_processing_consent,
          do_not_sell,
          updated_at: new Date().toISOString()
        }),
        updated_at: new Date()
      });

    // Log consent changes
    await db('privacy_requests').insert({
      user_id: userId,
      request_type: 'consent_update',
      status: 'completed',
      request_details: JSON.stringify({
        marketing_consent,
        analytics_consent,
        personalization_consent,
        data_processing_consent,
        do_not_sell
      }),
      completed_at: new Date(),
      created_at: new Date()
    });

    logger.info('Privacy preferences updated', {
      userId,
      changes: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Privacy preferences updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update privacy preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy preferences'
    });
  }
});

/**
 * Get Privacy Request Status
 * GET /api/privacy/request-status/:requestId
 */
router.get('/request-status/:requestId', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { requestId } = req.params;

    const request = await db('privacy_requests')
      .where({ user_id: userId })
      .where('verification_token', 'like', `${requestId}%`)
      .orderBy('created_at', 'desc')
      .first();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Privacy request not found'
      });
    }

    res.json({
      success: true,
      data: {
        request_id: requestId,
        type: request.request_type,
        status: request.status,
        created_at: request.created_at,
        estimated_completion: getEstimatedCompletion(request.request_type, request.status)
      }
    });

  } catch (error) {
    logger.error('Failed to get request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get request status'
    });
  }
});

// Helper Functions

async function processDataAccessRequest(userId, token) {
  try {
    // Collect all user data
    const userData = await collectUserData(userId);
    
    // Store export data (in production, use secure file storage)
    await db('data_exports').insert({
      user_id: userId,
      verification_token: token,
      export_data: JSON.stringify(userData),
      export_format: 'json',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    });

    // Send download link via email (implement in production)
    logger.info('Data export generated and stored', { userId });

  } catch (error) {
    logger.error('Failed to process data access request:', error);
    throw error;
  }
}

async function processDataDeletion(userId, deleteAllData) {
  try {
    await db.transaction(async (trx) => {
      if (deleteAllData) {
        // Delete all user-related data
        await trx('analytics_events').where({ user_id: userId }).del();
        await trx('generated_photos').where({ user_id: userId }).del();
        await trx('purchases').where({ user_id: userId }).del();
        await trx('privacy_requests').where({ user_id: userId }).del();
        await trx('data_exports').where({ user_id: userId }).del();
        await trx('users').where({ id: userId }).del();
      } else {
        // Anonymize user data instead of deletion
        await trx('users')
          .where({ id: userId })
          .update({
            email: `deleted_${userId}@anonymized.local`,
            first_name: null,
            last_name: null,
            phone: null,
            is_active: false,
            preferences: null,
            deleted_at: new Date()
          });
      }
    });

    logger.info('User data deletion completed', { userId, deleteAllData });

  } catch (error) {
    logger.error('Failed to delete user data:', error);
    throw error;
  }
}

async function collectUserData(userId) {
  try {
    // Collect all user data for export
    const user = await db('users')
      .where({ id: userId })
      .select(['id', 'email', 'first_name', 'last_name', 'created_at', 'preferences'])
      .first();

    const photos = await db('generated_photos')
      .where({ user_id: userId })
      .select(['id', 'style_template', 'created_at', 'processing_status']);

    const purchases = await db('purchases')
      .where({ user_id: userId })
      .select(['id', 'product_id', 'amount_usd', 'created_at', 'status']);

    const analytics = await db('analytics_events')
      .where({ user_id: userId })
      .select(['event_name', 'event_timestamp', 'platform'])
      .orderBy('event_timestamp', 'desc')
      .limit(1000);

    return {
      user_profile: user,
      generated_photos: photos,
      purchase_history: purchases,
      analytics_summary: {
        total_events: analytics.length,
        recent_events: analytics.slice(0, 50)
      },
      export_metadata: {
        generated_at: new Date().toISOString(),
        format: 'json',
        gdpr_compliant: true
      }
    };

  } catch (error) {
    logger.error('Failed to collect user data:', error);
    throw error;
  }
}

async function generatePortabilityExport(userId, format, includePhotos) {
  const userData = await collectUserData(userId);

  if (!includePhotos) {
    delete userData.generated_photos;
  }

  switch (format) {
    case 'csv':
      return convertToCSV(userData);
    case 'xml':
      return convertToXML(userData);
    default:
      return userData;
  }
}

function convertToCSV(data) {
  // Simplified CSV conversion - implement full conversion in production
  return 'CSV export not fully implemented in demo';
}

function convertToXML(data) {
  // Simplified XML conversion - implement full conversion in production
  return 'XML export not fully implemented in demo';
}

async function sendVerificationEmail(email, token, requestType) {
  // In production, implement proper email service
  logger.info('Verification email would be sent', {
    email,
    requestType,
    token: token.substring(0, 8) + '...'
  });
  
  // Example email content structure:
  const emailContent = {
    to: email,
    subject: `Verify your ${requestType} request - LinkedIn Headshot Generator`,
    html: `
      <h2>Privacy Request Verification</h2>
      <p>Please click the link below to verify your ${requestType} request:</p>
      <a href="https://app.linkedinheadshots.com/verify/${requestType}/${token}">
        Verify Request
      </a>
      <p>This link expires in 24 hours.</p>
    `
  };
  
  // Implement actual email sending here
  return Promise.resolve();
}

function getEstimatedCompletion(requestType, status) {
  switch (requestType) {
    case 'access':
    case 'portability':
      return status === 'processing' ? '30 days' : 'Immediate';
    case 'deletion':
      return 'Immediate';
    case 'consent_update':
      return 'Immediate';
    default:
      return '30 days';
  }
}

module.exports = router;