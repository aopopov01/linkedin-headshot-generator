/**
 * Authentication Integration Tests
 * Tests for user authentication, registration, and authorization flows
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const { testDb, testUtils } = require('../setup');

describe('Authentication Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: expect.any(Number),
          email: userData.email,
          name: userData.name,
          subscription_plan: 'free',
        },
        token: expect.any(String),
      });

      // Verify user was created in database
      const user = await testDb('users').where('email', userData.email).first();
      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);

      // Verify password was hashed
      const passwordMatch = await bcrypt.compare(userData.password, user.password_hash);
      expect(passwordMatch).toBe(true);
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email'),
      });
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('password'),
      });
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        name: 'First User',
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Attempt to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, name: 'Second User' })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('already exists'),
      });
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password and name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await testUtils.createTestUser({
        email: 'login@example.com',
        password_hash: await bcrypt.hash('TestPassword123!', 10),
        name: 'Login Test User',
      });
    });

    it('should successfully login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: expect.any(Number),
          email: loginData.email,
          name: 'Login Test User',
        },
        token: expect.any(String),
      });

      // Verify JWT token format
      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid credentials'),
      });
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid credentials'),
      });
    });

    it('should handle missing login fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should update last login timestamp', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'TestPassword123!',
      };

      const userBefore = await testDb('users').where('email', loginData.email).first();
      
      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const userAfter = await testDb('users').where('email', loginData.email).first();
      expect(new Date(userAfter.last_login_at) > new Date(userBefore.last_login_at || 0)).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'me@example.com',
        name: 'Me Test User',
      });
      authToken = testUtils.generateTestToken(testUser.id);
    });

    it('should return current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          subscription_plan: testUser.subscription_plan,
        },
      });

      // Should not include sensitive data
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('token'),
      });
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid token'),
      });
    });

    it('should reject request with expired token', async () => {
      const expiredToken = testUtils.generateTestToken(testUser.id, '-1h'); // Expired 1 hour ago

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request for non-existent user', async () => {
      const nonExistentToken = testUtils.generateTestToken(99999);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${nonExistentToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser;
    let refreshToken;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'refresh@example.com',
      });
      
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        });
      
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should generate new access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        token: expect.any(String),
        user: {
          id: testUser.id,
          email: testUser.email,
        },
      });
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser();
      authToken = testUtils.generateTestToken(testUser.id);
    });

    it('should successfully logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('logged out'),
      });
    });

    it('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Password Reset Flow', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'reset@example.com',
      });
    });

    it('should initiate password reset request', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset link'),
      });

      // Verify reset token was created in database
      const updatedUser = await testDb('users').where('id', testUser.id).first();
      expect(updatedUser.reset_token).toBeTruthy();
      expect(updatedUser.reset_token_expires).toBeTruthy();
    });

    it('should handle forgot password for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return success for security reasons (don't reveal if email exists)
      expect(response.body.success).toBe(true);
    });

    it('should reset password with valid token', async () => {
      // Generate reset token
      const resetToken = 'test-reset-token-123';
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      await testDb('users')
        .where('id', testUser.id)
        .update({
          reset_token: resetToken,
          reset_token_expires: resetExpires,
        });

      const newPassword = 'NewSecurePassword123!';
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify password was updated and token was cleared
      const updatedUser = await testDb('users').where('id', testUser.id).first();
      expect(updatedUser.reset_token).toBe(null);
      expect(updatedUser.reset_token_expires).toBe(null);

      const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password_hash);
      expect(passwordMatch).toBe(true);
    });

    it('should reject password reset with expired token', async () => {
      const resetToken = 'expired-reset-token';
      const resetExpires = new Date(Date.now() - 3600000); // 1 hour ago

      await testDb('users')
        .where('id', testUser.id)
        .update({
          reset_token: resetToken,
          reset_token_expires: resetExpires,
        });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('expired');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'WrongPassword123!',
      };

      // Create user for testing
      await testUtils.createTestUser({
        email: loginData.email,
      });

      // Make multiple failed login attempts
      const promises = Array.from({ length: 6 }, () =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);

      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error).toContain('Too many attempts');
    });

    it('should rate limit registration attempts', async () => {
      const promises = Array.from({ length: 6 }, (_, i) =>
        request(app)
          .post('/api/auth/register')
          .send({
            email: `ratelimit${i}@example.com`,
            password: 'Password123!',
            name: `User ${i}`,
          })
      );

      const responses = await Promise.all(promises);

      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'security@example.com',
          password: 'Password123!',
          name: 'Security Test',
        });

      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
      });
    });

    it('should not expose sensitive server information', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });
  });
});