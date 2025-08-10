/**
 * Test Setup Configuration for Backend Integration Tests
 * Sets up test database, mocks, and utilities
 */

const knex = require('knex');
const knexConfig = require('../../knexfile');

// Test database configuration
const testDbConfig = {
  ...knexConfig.test,
  connection: {
    ...knexConfig.test.connection,
    database: 'linkedin_headshot_test'
  }
};

// Global test database instance
global.testDb = knex(testDbConfig);

// Test utilities
global.testUtils = {
  // Clean all tables but preserve structure
  cleanDatabase: async () => {
    await global.testDb('analytics_events').del();
    await global.testDb('purchases').del();
    await global.testDb('generated_photos').del();
    await global.testDb('user_consent_records').del();
    await global.testDb('data_deletion_requests').del();
    await global.testDb('users').del();
  },

  // Create test user
  createTestUser: async (overrides = {}) => {
    const userData = {
      email: 'test@example.com',
      password_hash: '$2a$10$test.hash.example',
      name: 'Test User',
      subscription_plan: 'free',
      subscription_expires_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };

    const [user] = await global.testDb('users').insert(userData).returning('*');
    return user;
  },

  // Create test photo
  createTestPhoto: async (userId, overrides = {}) => {
    const photoData = {
      user_id: userId,
      original_image_url: 'https://example.com/original.jpg',
      processed_image_url: 'https://example.com/processed.jpg',
      style_id: 'professional',
      processing_status: 'completed',
      processing_started_at: new Date(),
      processing_completed_at: new Date(),
      created_at: new Date(),
      ...overrides,
    };

    const [photo] = await global.testDb('generated_photos').insert(photoData).returning('*');
    return photo;
  },

  // Create test purchase
  createTestPurchase: async (userId, overrides = {}) => {
    const purchaseData = {
      user_id: userId,
      stripe_payment_intent_id: 'pi_test_12345',
      amount: 999,
      currency: 'usd',
      product_type: 'premium_subscription',
      status: 'completed',
      created_at: new Date(),
      ...overrides,
    };

    const [purchase] = await global.testDb('purchases').insert(purchaseData).returning('*');
    return purchase;
  },

  // Generate JWT token for testing
  generateTestToken: (userId, expiresIn = '1h') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn }
    );
  },

  // Mock external services
  mockServices: {
    replicate: {
      mockProcessPhoto: (result = { output: ['https://example.com/processed.jpg'] }) => {
        jest.mock('replicate', () => ({
          run: jest.fn().mockResolvedValue(result),
        }));
      },
    },

    stripe: {
      mockCreatePaymentIntent: (result = { id: 'pi_test_12345', client_secret: 'pi_test_secret' }) => {
        jest.mock('stripe', () => () => ({
          paymentIntents: {
            create: jest.fn().mockResolvedValue(result),
            confirm: jest.fn().mockResolvedValue({ status: 'succeeded' }),
            retrieve: jest.fn().mockResolvedValue({ status: 'succeeded' }),
          },
        }));
      },
    },

    cloudinary: {
      mockUpload: (result = { secure_url: 'https://res.cloudinary.com/test.jpg', public_id: 'test_id' }) => {
        jest.mock('cloudinary', () => ({
          v2: {
            uploader: {
              upload: jest.fn().mockResolvedValue(result),
              destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
            },
          },
        }));
      },
    },

    mixpanel: {
      mockTrackEvent: () => {
        jest.mock('mixpanel', () => ({
          init: jest.fn(() => ({
            track: jest.fn(),
            people: {
              set: jest.fn(),
              increment: jest.fn(),
            },
          })),
        }));
      },
    },
  },
};

// Setup before all tests
beforeAll(async () => {
  // Run migrations
  await global.testDb.migrate.latest();
  
  // Set environment to test
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  process.env.REPLICATE_API_TOKEN = 'test-replicate-token';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
});

// Setup before each test
beforeEach(async () => {
  // Clean database before each test
  await global.testUtils.cleanDatabase();
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  await global.testUtils.cleanDatabase();
  await global.testDb.destroy();
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console logs in tests unless needed
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

module.exports = {
  testDb: global.testDb,
  testUtils: global.testUtils,
};