/**
 * Optimization API Routes
 * 
 * Core endpoints for the OmniShot optimization engine.
 * Handles single photo optimization, batch processing, custom dimensions,
 * and progress tracking.
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import { OptimizationController } from '../controllers/optimization.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { validateSubscription } from '../middleware/subscription';
import { uploadMiddleware } from '../middleware/upload';

const router = express.Router();
const optimizationController = new OptimizationController();

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const validateOptimizationRequest = [
  body('targetPlatforms')
    .isArray({ min: 1 })
    .withMessage('Target platforms must be a non-empty array'),
  body('targetPlatforms.*')
    .isIn(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'snapchat', 'whatsapp'])
    .withMessage('Invalid platform specified'),
  body('professionalStyle')
    .isIn(['executive', 'creative', 'casual', 'corporate', 'artistic', 'minimalist', 'modern'])
    .withMessage('Invalid professional style'),
  body('options.qualityPreference')
    .optional()
    .isIn(['high', 'balanced', 'fast'])
    .withMessage('Invalid quality preference'),
  body('options.costPreference')
    .optional()
    .isIn(['lowest', 'optimized', 'premium'])
    .withMessage('Invalid cost preference')
];

const validateBatchRequest = [
  body('targetPlatforms')
    .isArray({ min: 1 })
    .withMessage('Target platforms must be a non-empty array'),
  body('professionalStyle')
    .isIn(['executive', 'creative', 'casual', 'corporate', 'artistic', 'minimalist', 'modern'])
    .withMessage('Invalid professional style'),
  body('options.maxConcurrency')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Max concurrency must be between 1 and 5')
];

const validateCustomDimensions = [
  body('dimensions.width')
    .isInt({ min: 100, max: 4000 })
    .withMessage('Width must be between 100 and 4000 pixels'),
  body('dimensions.height')
    .isInt({ min: 100, max: 4000 })
    .withMessage('Height must be between 100 and 4000 pixels'),
  body('professionalStyle')
    .isIn(['executive', 'creative', 'casual', 'corporate', 'artistic', 'minimalist', 'modern'])
    .withMessage('Invalid professional style')
];

// ================================
// SINGLE PHOTO OPTIMIZATION
// ================================

/**
 * @route POST /api/optimization/optimize
 * @desc Optimize a single photo for multiple platforms
 * @access Private
 */
router.post('/optimize',
  authMiddleware,
  validateSubscription,
  rateLimitMiddleware('optimization', 10, 60), // 10 requests per minute
  upload.single('image'),
  validateOptimizationRequest,
  optimizationController.optimizePhoto
);

/**
 * @route POST /api/optimization/optimize-url
 * @desc Optimize a photo from URL for multiple platforms
 * @access Private
 */
router.post('/optimize-url',
  authMiddleware,
  validateSubscription,
  rateLimitMiddleware('optimization', 10, 60),
  [
    body('imageUrl').isURL().withMessage('Valid image URL is required'),
    ...validateOptimizationRequest
  ],
  optimizationController.optimizePhotoFromUrl
);

/**
 * @route GET /api/optimization/:optimizationId
 * @desc Get optimization details and results
 * @access Private
 */
router.get('/:optimizationId',
  authMiddleware,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required')
  ],
  optimizationController.getOptimization
);

/**
 * @route GET /api/optimization/:optimizationId/status
 * @desc Get optimization status and progress
 * @access Private
 */
router.get('/:optimizationId/status',
  authMiddleware,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required')
  ],
  optimizationController.getOptimizationStatus
);

/**
 * @route GET /api/optimization/:optimizationId/results
 * @desc Get optimization results for all platforms
 * @access Private
 */
router.get('/:optimizationId/results',
  authMiddleware,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required')
  ],
  optimizationController.getOptimizationResults
);

/**
 * @route GET /api/optimization/:optimizationId/results/:platform
 * @desc Get optimization result for specific platform
 * @access Private
 */
router.get('/:optimizationId/results/:platform',
  authMiddleware,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required'),
    param('platform').isIn(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'snapchat', 'whatsapp'])
      .withMessage('Invalid platform')
  ],
  optimizationController.getPlatformResult
);

/**
 * @route POST /api/optimization/:optimizationId/retry
 * @desc Retry failed optimization
 * @access Private
 */
router.post('/:optimizationId/retry',
  authMiddleware,
  validateSubscription,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required')
  ],
  optimizationController.retryOptimization
);

/**
 * @route DELETE /api/optimization/:optimizationId
 * @desc Cancel running optimization
 * @access Private
 */
router.delete('/:optimizationId',
  authMiddleware,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required')
  ],
  optimizationController.cancelOptimization
);

// ================================
// BATCH PROCESSING
// ================================

/**
 * @route POST /api/optimization/batch
 * @desc Create a batch optimization job
 * @access Private
 */
router.post('/batch',
  authMiddleware,
  validateSubscription,
  rateLimitMiddleware('batch', 5, 60), // 5 batch jobs per minute
  upload.array('images', 10), // Max 10 images per batch
  validateBatchRequest,
  optimizationController.createBatchJob
);

/**
 * @route GET /api/optimization/batch/:batchId
 * @desc Get batch job details and progress
 * @access Private
 */
router.get('/batch/:batchId',
  authMiddleware,
  [
    param('batchId').isUUID().withMessage('Valid batch ID is required')
  ],
  optimizationController.getBatchJob
);

/**
 * @route GET /api/optimization/batch/:batchId/status
 * @desc Get batch job status
 * @access Private
 */
router.get('/batch/:batchId/status',
  authMiddleware,
  [
    param('batchId').isUUID().withMessage('Valid batch ID is required')
  ],
  optimizationController.getBatchJobStatus
);

/**
 * @route GET /api/optimization/batch/:batchId/results
 * @desc Get batch job results
 * @access Private
 */
router.get('/batch/:batchId/results',
  authMiddleware,
  [
    param('batchId').isUUID().withMessage('Valid batch ID is required')
  ],
  optimizationController.getBatchJobResults
);

/**
 * @route POST /api/optimization/batch/:batchId/cancel
 * @desc Cancel batch job
 * @access Private
 */
router.post('/batch/:batchId/cancel',
  authMiddleware,
  [
    param('batchId').isUUID().withMessage('Valid batch ID is required')
  ],
  optimizationController.cancelBatchJob
);

// ================================
// CUSTOM DIMENSIONS
// ================================

/**
 * @route POST /api/optimization/custom-dimensions
 * @desc Optimize photo with custom dimensions
 * @access Private
 */
router.post('/custom-dimensions',
  authMiddleware,
  validateSubscription,
  rateLimitMiddleware('optimization', 10, 60),
  upload.single('image'),
  validateCustomDimensions,
  optimizationController.optimizeCustomDimensions
);

// ================================
// RECOMMENDATIONS & SUGGESTIONS
// ================================

/**
 * @route GET /api/optimization/recommendations
 * @desc Get optimization recommendations for user
 * @access Private
 */
router.get('/recommendations',
  authMiddleware,
  optimizationController.getRecommendations
);

/**
 * @route POST /api/optimization/analyze-image
 * @desc Analyze image and get platform suggestions
 * @access Private
 */
router.post('/analyze-image',
  authMiddleware,
  rateLimitMiddleware('analysis', 20, 60),
  upload.single('image'),
  optimizationController.analyzeImage
);

/**
 * @route GET /api/optimization/platform-specs
 * @desc Get specifications for all supported platforms
 * @access Private
 */
router.get('/platform-specs',
  authMiddleware,
  optimizationController.getPlatformSpecs
);

/**
 * @route GET /api/optimization/platform-specs/:platform
 * @desc Get specifications for specific platform
 * @access Private
 */
router.get('/platform-specs/:platform',
  authMiddleware,
  [
    param('platform').isIn(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'snapchat', 'whatsapp'])
      .withMessage('Invalid platform')
  ],
  optimizationController.getPlatformSpec
);

// ================================
// COST ESTIMATION & OPTIMIZATION
// ================================

/**
 * @route POST /api/optimization/estimate-cost
 * @desc Estimate optimization cost
 * @access Private
 */
router.post('/estimate-cost',
  authMiddleware,
  [
    body('targetPlatforms').isArray({ min: 1 }).withMessage('Target platforms required'),
    body('professionalStyle').notEmpty().withMessage('Professional style required'),
    body('imageCount').optional().isInt({ min: 1 }).withMessage('Image count must be positive integer')
  ],
  optimizationController.estimateCost
);

/**
 * @route GET /api/optimization/cost-breakdown/:optimizationId
 * @desc Get detailed cost breakdown for optimization
 * @access Private
 */
router.get('/cost-breakdown/:optimizationId',
  authMiddleware,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required')
  ],
  optimizationController.getCostBreakdown
);

// ================================
// USER OPTIMIZATION HISTORY
// ================================

/**
 * @route GET /api/optimization/history
 * @desc Get user's optimization history
 * @access Private
 */
router.get('/history',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED']).withMessage('Invalid status'),
    query('platform').optional().isIn(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'snapchat', 'whatsapp']).withMessage('Invalid platform'),
    query('style').optional().isIn(['executive', 'creative', 'casual', 'corporate', 'artistic', 'minimalist', 'modern']).withMessage('Invalid style')
  ],
  optimizationController.getHistory
);

/**
 * @route GET /api/optimization/stats
 * @desc Get user's optimization statistics
 * @access Private
 */
router.get('/stats',
  authMiddleware,
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year', 'all']).withMessage('Invalid period')
  ],
  optimizationController.getStats
);

// ================================
// QUALITY ASSESSMENT
// ================================

/**
 * @route POST /api/optimization/:optimizationId/rating
 * @desc Rate optimization quality
 * @access Private
 */
router.post('/:optimizationId/rating',
  authMiddleware,
  [
    param('optimizationId').isUUID().withMessage('Valid optimization ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString().withMessage('Feedback must be a string')
  ],
  optimizationController.rateOptimization
);

/**
 * @route GET /api/optimization/quality-report
 * @desc Get quality report and analytics
 * @access Private
 */
router.get('/quality-report',
  authMiddleware,
  optimizationController.getQualityReport
);

// ================================
// WEBHOOK ENDPOINTS
// ================================

/**
 * @route POST /api/optimization/webhook/processing-complete
 * @desc Webhook for optimization processing completion
 * @access Internal
 */
router.post('/webhook/processing-complete',
  // Add webhook authentication middleware here
  optimizationController.handleProcessingComplete
);

/**
 * @route POST /api/optimization/webhook/batch-complete
 * @desc Webhook for batch processing completion
 * @access Internal
 */
router.post('/webhook/batch-complete',
  // Add webhook authentication middleware here
  optimizationController.handleBatchComplete
);

// Error handling middleware for validation
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