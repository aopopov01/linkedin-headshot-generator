const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const db = require('../config/database');
const logger = require('../config/logger');
const aiService = require('../services/aiService');
const cloudinaryService = require('../services/cloudinaryService');
const { authenticateToken, requireCredits } = require('../middleware/auth');
const { aiGenerationRateLimit } = require('../middleware/security');
const { validatePhotoGeneration, validateUuidParam, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Configure multer for image upload
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Get user's generated photos
 */
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count }] = await db('generated_photos')
      .where({ user_id: userId })
      .count('id as count');

    // Get photos with pagination
    const photos = await db('generated_photos')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select([
        'id',
        'original_image_url',
        'generated_images',
        'style_template',
        'processing_status',
        'processing_time_seconds',
        'download_count',
        'completed_at',
        'created_at'
      ]);

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        photos,
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
    logger.error('Failed to get user photos:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photos'
    });
  }
});

/**
 * Generate professional headshots
 */
router.post('/generate', 
  authenticateToken, 
  requireCredits(1),
  aiGenerationRateLimit,
  upload.single('photo'),
  validatePhotoGeneration,
  async (req, res) => {
    try {
      const { id: userId } = req.user;
      const { style_template } = req.body;
      const numOutputs = parseInt(req.body.num_outputs) || 4;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Photo file is required'
        });
      }

      // Process and optimize the uploaded image
      const processedImageBuffer = await sharp(req.file.buffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Convert to base64 for AI processing
      const imageBase64 = `data:image/jpeg;base64,${processedImageBuffer.toString('base64')}`;

      // Validate image
      const imageValidation = aiService.validateImage(imageBase64);
      if (!imageValidation.valid) {
        return res.status(400).json({
          success: false,
          message: imageValidation.error
        });
      }

      // Upload original image to Cloudinary
      const originalImageUpload = await cloudinaryService.uploadBase64Image(imageBase64, {
        folder: `linkedin-headshots/originals/${userId}`,
        public_id: `original_${Date.now()}`
      });

      // Estimate processing cost
      const estimatedCost = aiService.estimateProcessingCost(style_template, numOutputs);

      // Create database record
      const [photoRecord] = await db('generated_photos')
        .insert({
          user_id: userId,
          original_image_url: originalImageUpload.url,
          original_image_cloudinary_id: originalImageUpload.public_id,
          style_template,
          processing_status: 'pending',
          processing_cost: estimatedCost
        })
        .returning('*');

      // Start AI generation (async)
      const generationPromise = aiService.generateHeadshot(imageBase64, style_template, {
        numOutputs
      }).then(async (result) => {
        try {
          // Upload generated images to Cloudinary
          const uploadResult = await cloudinaryService.uploadGeneratedImages(
            result.generatedImages,
            userId,
            style_template
          );

          // Update database with results
          await db('generated_photos')
            .where({ id: photoRecord.id })
            .update({
              generated_images: JSON.stringify(uploadResult.images),
              processing_status: 'completed',
              processing_time_seconds: result.processingTime,
              replicate_prediction_id: result.predictionId,
              ai_processing_metadata: JSON.stringify(result.metadata),
              completed_at: new Date()
            });

          // Deduct credit for free users
          if (req.user.subscription_status === 'free') {
            await db('users')
              .where({ id: userId })
              .decrement('credits_remaining', 1)
              .increment('total_photos_generated', uploadResult.images.length);
          } else {
            await db('users')
              .where({ id: userId })
              .increment('total_photos_generated', uploadResult.images.length);
          }

          logger.info('Photo generation completed successfully:', {
            photoId: photoRecord.id,
            userId,
            styleTemplate: style_template,
            generatedCount: uploadResult.images.length,
            processingTime: result.processingTime
          });

        } catch (error) {
          logger.error('Failed to process generated images:', {
            photoId: photoRecord.id,
            error: error.message
          });

          // Update status to failed
          await db('generated_photos')
            .where({ id: photoRecord.id })
            .update({
              processing_status: 'failed',
              ai_processing_metadata: JSON.stringify({ error: error.message })
            });
        }
      }).catch(async (error) => {
        logger.error('AI generation failed:', {
          photoId: photoRecord.id,
          error: error.message
        });

        // Update status to failed
        await db('generated_photos')
          .where({ id: photoRecord.id })
          .update({
            processing_status: 'failed',
            ai_processing_metadata: JSON.stringify({ error: error.message })
          });
      });

      // Return immediate response
      res.status(202).json({
        success: true,
        message: 'Photo generation started',
        data: {
          id: photoRecord.id,
          processing_status: 'pending',
          estimated_processing_time: '30-60 seconds',
          estimated_cost: estimatedCost,
          style_template,
          num_outputs: numOutputs,
          original_image_url: originalImageUpload.url
        }
      });

      // Let the generation continue in background
      generationPromise.catch(() => {}); // Errors already handled above

    } catch (error) {
      logger.error('Photo generation request failed:', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start photo generation'
      });
    }
  }
);

/**
 * Get generation status
 */
router.get('/:photoId/status', authenticateToken, validateUuidParam('photoId'), async (req, res) => {
  try {
    const { photoId } = req.params;
    const { id: userId } = req.user;

    const photo = await db('generated_photos')
      .where({ id: photoId, user_id: userId })
      .first();

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // If still processing and has prediction ID, check Replicate status
    if (photo.processing_status === 'processing' && photo.replicate_prediction_id) {
      try {
        const replicateStatus = await aiService.getGenerationStatus(photo.replicate_prediction_id);
        
        // Update our database if status changed
        if (replicateStatus.status !== photo.processing_status) {
          await db('generated_photos')
            .where({ id: photoId })
            .update({
              processing_status: replicateStatus.status,
              ai_processing_metadata: JSON.stringify(replicateStatus)
            });
          
          photo.processing_status = replicateStatus.status;
        }
      } catch (error) {
        logger.error('Failed to check Replicate status:', {
          photoId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        id: photo.id,
        processing_status: photo.processing_status,
        processing_time_seconds: photo.processing_time_seconds,
        generated_images: photo.generated_images ? JSON.parse(photo.generated_images) : null,
        style_template: photo.style_template,
        created_at: photo.created_at,
        completed_at: photo.completed_at,
        download_count: photo.download_count
      }
    });

  } catch (error) {
    logger.error('Failed to get photo status:', {
      error: error.message,
      photoId: req.params.photoId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get photo status'
    });
  }
});

/**
 * Download generated photo
 */
router.get('/:photoId/download/:imageIndex', authenticateToken, async (req, res) => {
  try {
    const { photoId, imageIndex } = req.params;
    const { id: userId } = req.user;
    
    const photo = await db('generated_photos')
      .where({ id: photoId, user_id: userId })
      .first();

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    if (photo.processing_status !== 'completed' || !photo.generated_images) {
      return res.status(400).json({
        success: false,
        message: 'Photo generation not completed'
      });
    }

    const generatedImages = JSON.parse(photo.generated_images);
    const imageIndexInt = parseInt(imageIndex);
    
    if (imageIndexInt < 0 || imageIndexInt >= generatedImages.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    const selectedImage = generatedImages[imageIndexInt];

    // Track download
    await db('generated_photos')
      .where({ id: photoId })
      .increment('download_count', 1);

    // Redirect to the Cloudinary URL or return the URL
    if (req.query.redirect === 'false') {
      res.json({
        success: true,
        data: {
          download_url: selectedImage.url,
          filename: `headshot_${photo.style_template}_${imageIndexInt + 1}.jpg`
        }
      });
    } else {
      res.redirect(selectedImage.url);
    }

  } catch (error) {
    logger.error('Failed to download photo:', {
      error: error.message,
      photoId: req.params.photoId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to download photo'
    });
  }
});

/**
 * Delete generated photo
 */
router.delete('/:photoId', authenticateToken, validateUuidParam('photoId'), async (req, res) => {
  try {
    const { photoId } = req.params;
    const { id: userId } = req.user;

    const photo = await db('generated_photos')
      .where({ id: photoId, user_id: userId })
      .first();

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Delete from Cloudinary
    const deletePromises = [];
    
    if (photo.original_image_cloudinary_id) {
      deletePromises.push(cloudinaryService.deleteImage(photo.original_image_cloudinary_id));
    }

    if (photo.generated_images) {
      const generatedImages = JSON.parse(photo.generated_images);
      generatedImages.forEach(image => {
        if (image.public_id) {
          deletePromises.push(cloudinaryService.deleteImage(image.public_id));
        }
      });
    }

    // Execute deletions (don't wait for completion)
    Promise.all(deletePromises).catch(error => {
      logger.error('Failed to delete images from Cloudinary:', {
        photoId,
        error: error.message
      });
    });

    // Delete from database
    await db('generated_photos').where({ id: photoId }).del();

    logger.info('Photo deleted successfully:', {
      photoId,
      userId
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete photo:', {
      error: error.message,
      photoId: req.params.photoId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete photo'
    });
  }
});

/**
 * Get available style templates
 */
router.get('/styles', async (req, res) => {
  try {
    const styles = await db('style_templates')
      .where({ is_active: true })
      .orderBy('sort_order')
      .select([
        'id',
        'template_key',
        'display_name',
        'description',
        'preview_image_url',
        'target_industry',
        'is_premium',
        'premium_price',
        'average_rating',
        'usage_count'
      ]);

    res.json({
      success: true,
      data: styles
    });

  } catch (error) {
    logger.error('Failed to get style templates:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get style templates'
    });
  }
});

module.exports = router;