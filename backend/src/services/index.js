const logger = require('../config/logger');
const aiService = require('./aiService');
const cloudinaryService = require('./cloudinaryService');
const paymentService = require('./paymentService');
const analyticsService = require('./analyticsService');
const redisService = require('./redisService');

/**
 * Initialize all external services
 */
async function initializeServices() {
  try {
    // Initialize Redis connection
    await redisService.connect();
    logger.info('Redis service initialized');

    // Initialize Cloudinary
    cloudinaryService.configure();
    logger.info('Cloudinary service initialized');

    // Initialize payment service (Stripe/RevenueCat)
    await paymentService.initialize();
    logger.info('Payment service initialized');

    // Initialize analytics service
    await analyticsService.initialize();
    logger.info('Analytics service initialized');

    // Test AI service connection
    await aiService.testConnection();
    logger.info('AI service initialized');

    return true;
  } catch (error) {
    logger.error('Service initialization failed:', error);
    throw error;
  }
}

/**
 * Gracefully shutdown all services
 */
async function shutdownServices() {
  try {
    await redisService.disconnect();
    logger.info('Services shutdown complete');
  } catch (error) {
    logger.error('Error during service shutdown:', error);
    throw error;
  }
}

module.exports = {
  initializeServices,
  shutdownServices,
  aiService,
  cloudinaryService,
  paymentService,
  analyticsService,
  redisService
};