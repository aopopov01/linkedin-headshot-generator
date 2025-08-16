/**
 * AI Service Secure API Routes
 * Implements secure server-side proxy for AI services
 * SECURITY: All external API credentials are server-side only
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { securityHeaders } from '../middleware/security';
import AIProxyService from '../services/aiProxy.service';
import { logger } from '../services/logger.service';

const router = Router();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 AI requests per 15 minutes per user
  message: {
    error: 'Too many AI processing requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per authenticated user
    return req.user?.id || req.ip;
  }
});

// Validation middleware for AI requests
const validateAIRequest = [
  body('imageData')
    .notEmpty()
    .withMessage('Image data is required')
    .custom((value) => {
      if (!value.startsWith('data:image/')) {
        throw new Error('Invalid image format');
      }
      // Check image size (base64 encoded)
      const sizeInBytes = (value.length * 3) / 4;
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (sizeInBytes > maxSize) {
        throw new Error('Image too large. Maximum size is 10MB');
      }
      return true;
    }),
  
  body('styleTemplate')
    .optional()
    .isIn(['executive', 'creative', 'healthcare', 'finance', 'startup', 'tech', 'corporate'])
    .withMessage('Invalid style template'),
  
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object'),
  
  body('options.numOutputs')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Number of outputs must be between 1 and 8'),
  
  body('options.dramatic')
    .optional()
    .isBoolean()
    .withMessage('Dramatic option must be boolean'),
  
  body('options.premium')
    .optional()
    .isBoolean()
    .withMessage('Premium option must be boolean')
];

const validatePredictionId = [
  param('predictionId')
    .isUUID(4)
    .withMessage('Invalid prediction ID format')
];

// Apply security middleware to all AI routes
router.use(securityHeaders);
router.use(authenticateToken);
router.use(aiRateLimit);

/**
 * POST /api/ai/transform
 * Secure AI transformation endpoint
 */
router.post('/transform', validateAIRequest, async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('AI transformation validation failed', {
        userId: req.user?.id,
        errors: errors.array(),
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { imageData, styleTemplate = 'executive', options = {} } = req.body;
    const userId = req.user?.id;

    // Log AI processing request for audit trail
    logger.info('AI transformation requested', {
      userId,
      styleTemplate,
      options: { ...options, imageData: '[REDACTED]' },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Process through secure AI proxy service
    const result = await AIProxyService.processImageTransformation(
      imageData,
      styleTemplate,
      {
        ...options,
        userId,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    );

    if (result.success) {
      logger.info('AI transformation completed successfully', {
        userId,
        predictionId: result.predictionId,
        styleTemplate,
        processingTime: result.processingTime
      });

      // Return sanitized response (no API keys or sensitive data)
      res.json({
        success: true,
        predictionId: result.predictionId,
        status: result.status,
        estimatedTime: result.estimatedTime,
        styleTemplate,
        processingOptions: {
          dramatic: options.dramatic,
          premium: options.premium,
          numOutputs: options.numOutputs
        }
      });
    } else {
      logger.error('AI transformation failed', {
        userId,
        error: result.error,
        styleTemplate
      });

      res.status(500).json({
        success: false,
        error: 'AI processing failed',
        code: 'AI_PROCESSING_ERROR',
        message: 'Unable to process image at this time'
      });
    }

  } catch (error) {
    logger.error('AI transformation endpoint error', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/ai/prediction/:predictionId
 * Check AI processing status
 */
router.get('/prediction/:predictionId', validatePredictionId, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prediction ID',
        code: 'VALIDATION_ERROR'
      });
    }

    const { predictionId } = req.params;
    const userId = req.user?.id;

    // Verify user has access to this prediction
    const hasAccess = await AIProxyService.verifyPredictionAccess(predictionId, userId);
    if (!hasAccess) {
      logger.warn('Unauthorized prediction access attempt', {
        userId,
        predictionId,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const status = await AIProxyService.checkPredictionStatus(predictionId);

    if (status.success) {
      res.json({
        success: true,
        predictionId,
        status: status.status,
        progress: status.progress,
        outputs: status.outputs || [],
        error: status.error || null,
        completedAt: status.completedAt,
        processingTime: status.processingTime
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Prediction not found',
        code: 'PREDICTION_NOT_FOUND'
      });
    }

  } catch (error) {
    logger.error('Prediction status check error', {
      userId: req.user?.id,
      predictionId: req.params.predictionId,
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Unable to check prediction status',
      code: 'STATUS_CHECK_ERROR'
    });
  }
});

/**
 * POST /api/ai/batch-transform
 * Batch processing for multiple styles
 */
router.post('/batch-transform', validateAIRequest, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { imageData, styleTemplates = ['executive', 'creative'], options = {} } = req.body;
    const userId = req.user?.id;

    // Validate style templates array
    if (!Array.isArray(styleTemplates) || styleTemplates.length === 0 || styleTemplates.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Style templates must be an array with 1-5 items',
        code: 'INVALID_STYLES'
      });
    }

    logger.info('Batch AI transformation requested', {
      userId,
      styleTemplates,
      numStyles: styleTemplates.length,
      ip: req.ip
    });

    const result = await AIProxyService.processBatchTransformation(
      imageData,
      styleTemplates,
      {
        ...options,
        userId,
        requestId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    );

    if (result.success) {
      res.json({
        success: true,
        batchId: result.batchId,
        predictions: result.predictions,
        totalStyles: styleTemplates.length,
        estimatedTime: result.estimatedTime
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Batch processing failed',
        code: 'BATCH_PROCESSING_ERROR'
      });
    }

  } catch (error) {
    logger.error('Batch transformation error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Batch processing failed',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/ai/prediction/:predictionId
 * Cancel running prediction
 */
router.delete('/prediction/:predictionId', validatePredictionId, async (req: Request, res: Response) => {
  try {
    const { predictionId } = req.params;
    const userId = req.user?.id;

    // Verify user has access to this prediction
    const hasAccess = await AIProxyService.verifyPredictionAccess(predictionId, userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const result = await AIProxyService.cancelPrediction(predictionId);

    if (result.success) {
      logger.info('Prediction cancelled', {
        userId,
        predictionId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Prediction cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Unable to cancel prediction',
        code: 'CANCELLATION_FAILED'
      });
    }

  } catch (error) {
    logger.error('Prediction cancellation error', {
      userId: req.user?.id,
      predictionId: req.params.predictionId,
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Cancellation failed',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/ai/styles
 * Get available AI styles and models
 */
router.get('/styles', async (req: Request, res: Response) => {
  try {
    const styles = AIProxyService.getAvailableStyles();
    
    res.json({
      success: true,
      styles,
      totalStyles: styles.length
    });

  } catch (error) {
    logger.error('Get styles error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Unable to retrieve styles',
      code: 'STYLES_ERROR'
    });
  }
});

export default router;