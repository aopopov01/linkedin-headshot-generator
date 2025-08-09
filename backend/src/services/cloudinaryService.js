const cloudinary = require('cloudinary').v2;
const logger = require('../config/logger');

class CloudinaryService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(imageBuffer, options = {}) {
    try {
      const defaultOptions = {
        folder: 'linkedin-headshots',
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto',
        transformation: [
          { width: 1024, height: 1024, crop: 'limit' }, // Limit max size
          { quality: 'auto:good' } // Auto optimize quality
        ]
      };

      const uploadOptions = { ...defaultOptions, ...options };

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(imageBuffer);
      });

      logger.info('Image uploaded to Cloudinary:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        size: result.bytes,
        folder: options.folder
      });

      return {
        success: true,
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes
      };
    } catch (error) {
      logger.error('Cloudinary upload failed:', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  /**
   * Upload base64 image to Cloudinary
   */
  async uploadBase64Image(base64String, options = {}) {
    try {
      const defaultOptions = {
        folder: 'linkedin-headshots/originals',
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto',
        transformation: [
          { width: 1024, height: 1024, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      };

      const uploadOptions = { ...defaultOptions, ...options };

      const result = await cloudinary.uploader.upload(base64String, uploadOptions);

      logger.info('Base64 image uploaded to Cloudinary:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        size: result.bytes
      });

      return {
        success: true,
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes
      };
    } catch (error) {
      logger.error('Base64 Cloudinary upload failed:', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  /**
   * Upload generated headshots array
   */
  async uploadGeneratedImages(imageUrls, userId, styleTemplate) {
    try {
      const uploadPromises = imageUrls.map(async (imageUrl, index) => {
        try {
          // Download image from Replicate URL and re-upload to our Cloudinary
          const result = await cloudinary.uploader.upload(imageUrl, {
            folder: `linkedin-headshots/generated/${userId}`,
            public_id: `${styleTemplate}_${Date.now()}_${index}`,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto:good',
            transformation: [
              { width: 1024, height: 1024, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          });

          return {
            success: true,
            public_id: result.public_id,
            url: result.secure_url,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes,
            index
          };
        } catch (error) {
          logger.error(`Failed to upload generated image ${index}:`, {
            error: error.message,
            imageUrl
          });
          return {
            success: false,
            error: error.message,
            index
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      logger.info('Generated images upload completed:', {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        userId,
        styleTemplate
      });

      return {
        success: successful.length > 0,
        images: successful,
        failedUploads: failed,
        totalProcessed: results.length
      };
    } catch (error) {
      logger.error('Batch upload failed:', {
        error: error.message,
        userId,
        styleTemplate
      });
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      logger.info('Image deleted from Cloudinary:', {
        public_id: publicId,
        result: result.result
      });

      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      logger.error('Cloudinary delete failed:', {
        public_id: publicId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate optimized image URLs with transformations
   */
  generateImageUrl(publicId, options = {}) {
    const defaultOptions = {
      quality: 'auto',
      format: 'auto'
    };

    const transformOptions = { ...defaultOptions, ...options };

    return cloudinary.url(publicId, transformOptions);
  }

  /**
   * Generate LinkedIn optimized image URL
   */
  generateLinkedInImageUrl(publicId) {
    return cloudinary.url(publicId, {
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto:good',
      format: 'jpg'
    });
  }

  /**
   * Generate thumbnail image URL
   */
  generateThumbnailUrl(publicId) {
    return cloudinary.url(publicId, {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto:low',
      format: 'jpg'
    });
  }

  /**
   * Get image metadata
   */
  async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      
      return {
        success: true,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        created_at: result.created_at,
        url: result.secure_url
      };
    } catch (error) {
      logger.error('Failed to get image info:', {
        public_id: publicId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List images in folder
   */
  async listImages(folder, maxResults = 50) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: maxResults,
        resource_type: 'image'
      });

      return {
        success: true,
        images: result.resources,
        total: result.total_count
      };
    } catch (error) {
      logger.error('Failed to list images:', {
        folder,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new CloudinaryService();