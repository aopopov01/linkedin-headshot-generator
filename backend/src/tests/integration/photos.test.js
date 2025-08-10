/**
 * Photos API Integration Tests
 * Tests for photo upload, processing, and management endpoints
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../../app');
const { testDb, testUtils } = require('../setup');

describe('Photos API Integration Tests', () => {
  let testUser;
  let authToken;
  let premiumUser;
  let premiumToken;

  beforeEach(async () => {
    // Create test users
    testUser = await testUtils.createTestUser({
      email: 'phototest@example.com',
      subscription_plan: 'free',
    });
    authToken = testUtils.generateTestToken(testUser.id);

    premiumUser = await testUtils.createTestUser({
      email: 'premium@example.com',
      subscription_plan: 'premium',
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    premiumToken = testUtils.generateTestToken(premiumUser.id);

    // Mock external services
    testUtils.mockServices.cloudinary.mockUpload();
    testUtils.mockServices.replicate.mockProcessPhoto();
  });

  describe('POST /api/photos/upload', () => {
    it('should successfully upload and process photo', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test-photo.jpg')
        .field('styleId', 'professional')
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        photo: {
          id: expect.any(Number),
          original_image_url: expect.stringContaining('cloudinary'),
          style_id: 'professional',
          processing_status: 'processing',
          user_id: testUser.id,
        },
        processingId: expect.any(String),
      });

      // Verify photo record was created in database
      const photo = await testDb('generated_photos').where('id', response.body.photo.id).first();
      expect(photo).toBeTruthy();
      expect(photo.user_id).toBe(testUser.id);
      expect(photo.style_id).toBe('professional');
    });

    it('should reject upload without authentication', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'professional')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject upload without photo file', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('styleId', 'professional')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('photo'),
      });
    });

    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-text-data'), 'test.txt')
        .field('styleId', 'professional')
        .expect(400);

      expect(response.body.error).toContain('Invalid file type');
    });

    it('should reject files that are too large', async () => {
      // Create a large buffer (10MB)
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024);

      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', largeBuffer, 'large-image.jpg')
        .field('styleId', 'professional')
        .expect(400);

      expect(response.body.error).toContain('File too large');
    });

    it('should reject premium styles for free users', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'executive') // Premium style
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('premium'),
      });
    });

    it('should allow premium styles for premium users', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${premiumToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'executive')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.photo.style_id).toBe('executive');
    });

    it('should enforce monthly limits for free users', async () => {
      // Create 3 photos for the user (free limit)
      for (let i = 0; i < 3; i++) {
        await testUtils.createTestPhoto(testUser.id, {
          created_at: new Date(),
        });
      }

      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'professional')
        .expect(403);

      expect(response.body.error).toContain('monthly limit');
    });

    it('should not enforce limits for premium users', async () => {
      // Create many photos for premium user
      for (let i = 0; i < 10; i++) {
        await testUtils.createTestPhoto(premiumUser.id);
      }

      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${premiumToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'professional')
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should handle Cloudinary upload errors', async () => {
      // Mock Cloudinary error
      testUtils.mockServices.cloudinary.mockUpload();
      const cloudinary = require('cloudinary');
      cloudinary.v2.uploader.upload.mockRejectedValueOnce(
        new Error('Cloudinary upload failed')
      );

      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'professional')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('upload failed'),
      });
    });
  });

  describe('GET /api/photos/processing/:processingId', () => {
    let testPhoto;

    beforeEach(async () => {
      testPhoto = await testUtils.createTestPhoto(testUser.id, {
        processing_status: 'processing',
        replicate_prediction_id: 'test-processing-id',
      });
    });

    it('should return processing status for valid processing ID', async () => {
      const response = await request(app)
        .get(`/api/photos/processing/${testPhoto.replicate_prediction_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'processing',
        photo: {
          id: testPhoto.id,
          processing_status: 'processing',
        },
      });
    });

    it('should return completed status when processing is done', async () => {
      // Update photo to completed status
      await testDb('generated_photos')
        .where('id', testPhoto.id)
        .update({
          processing_status: 'completed',
          processed_image_url: 'https://example.com/processed.jpg',
          processing_completed_at: new Date(),
        });

      const response = await request(app)
        .get(`/api/photos/processing/${testPhoto.replicate_prediction_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'completed',
        photo: {
          id: testPhoto.id,
          processing_status: 'completed',
          processed_image_url: expect.stringContaining('processed.jpg'),
        },
      });
    });

    it('should reject access to other users processing', async () => {
      const otherUser = await testUtils.createTestUser({
        email: 'other@example.com',
      });
      const otherToken = testUtils.generateTestToken(otherUser.id);

      const response = await request(app)
        .get(`/api/photos/processing/${testPhoto.replicate_prediction_id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid processing ID', async () => {
      const response = await request(app)
        .get('/api/photos/processing/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
      });
    });
  });

  describe('GET /api/photos', () => {
    beforeEach(async () => {
      // Create multiple photos for testing
      await testUtils.createTestPhoto(testUser.id, {
        style_id: 'professional',
        processing_status: 'completed',
        created_at: new Date('2024-01-01'),
      });
      
      await testUtils.createTestPhoto(testUser.id, {
        style_id: 'casual',
        processing_status: 'completed',
        created_at: new Date('2024-01-02'),
      });

      await testUtils.createTestPhoto(testUser.id, {
        style_id: 'executive',
        processing_status: 'processing',
        created_at: new Date('2024-01-03'),
      });

      // Create photos for other user (should not be returned)
      const otherUser = await testUtils.createTestUser({
        email: 'other@example.com',
      });
      await testUtils.createTestPhoto(otherUser.id);
    });

    it('should return user photos with pagination', async () => {
      const response = await request(app)
        .get('/api/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        photos: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            user_id: testUser.id,
            style_id: expect.any(String),
            processing_status: expect.any(String),
          }),
        ]),
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      // Should only return photos for authenticated user
      expect(response.body.photos).toHaveLength(3);
      response.body.photos.forEach(photo => {
        expect(photo.user_id).toBe(testUser.id);
      });
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/photos?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        photos: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
        ]),
        pagination: {
          total: 3,
          page: 1,
          limit: 2,
          totalPages: 2,
        },
      });

      expect(response.body.photos).toHaveLength(2);
    });

    it('should filter by processing status', async () => {
      const response = await request(app)
        .get('/api/photos?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photos).toHaveLength(2);
      
      response.body.photos.forEach(photo => {
        expect(photo.processing_status).toBe('completed');
      });
    });

    it('should filter by style ID', async () => {
      const response = await request(app)
        .get('/api/photos?styleId=professional')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photos).toHaveLength(1);
      expect(response.body.photos[0].style_id).toBe('professional');
    });

    it('should sort photos by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const photos = response.body.photos;
      expect(new Date(photos[0].created_at) >= new Date(photos[1].created_at)).toBe(true);
      expect(new Date(photos[1].created_at) >= new Date(photos[2].created_at)).toBe(true);
    });
  });

  describe('GET /api/photos/:id', () => {
    let testPhoto;

    beforeEach(async () => {
      testPhoto = await testUtils.createTestPhoto(testUser.id, {
        processing_status: 'completed',
        processed_image_url: 'https://example.com/processed.jpg',
      });
    });

    it('should return specific photo details', async () => {
      const response = await request(app)
        .get(`/api/photos/${testPhoto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        photo: {
          id: testPhoto.id,
          user_id: testUser.id,
          original_image_url: testPhoto.original_image_url,
          processed_image_url: testPhoto.processed_image_url,
          style_id: testPhoto.style_id,
          processing_status: 'completed',
        },
      });
    });

    it('should reject access to other users photos', async () => {
      const otherUser = await testUtils.createTestUser({
        email: 'other@example.com',
      });
      const otherToken = testUtils.generateTestToken(otherUser.id);

      const response = await request(app)
        .get(`/api/photos/${testPhoto.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent photo ID', async () => {
      const response = await request(app)
        .get('/api/photos/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
      });
    });
  });

  describe('DELETE /api/photos/:id', () => {
    let testPhoto;

    beforeEach(async () => {
      testPhoto = await testUtils.createTestPhoto(testUser.id);
    });

    it('should successfully delete user photo', async () => {
      const response = await request(app)
        .delete(`/api/photos/${testPhoto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('deleted'),
      });

      // Verify photo was deleted from database
      const deletedPhoto = await testDb('generated_photos').where('id', testPhoto.id).first();
      expect(deletedPhoto).toBeUndefined();
    });

    it('should reject deletion of other users photos', async () => {
      const otherUser = await testUtils.createTestUser({
        email: 'other@example.com',
      });
      const otherToken = testUtils.generateTestToken(otherUser.id);

      const response = await request(app)
        .delete(`/api/photos/${testPhoto.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);

      // Verify photo still exists
      const existingPhoto = await testDb('generated_photos').where('id', testPhoto.id).first();
      expect(existingPhoto).toBeTruthy();
    });

    it('should delete associated Cloudinary images', async () => {
      const cloudinary = require('cloudinary');
      
      await request(app)
        .delete(`/api/photos/${testPhoto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify Cloudinary deletion was called
      expect(cloudinary.v2.uploader.destroy).toHaveBeenCalled();
    });
  });

  describe('POST /api/photos/:id/share', () => {
    let completedPhoto;

    beforeEach(async () => {
      completedPhoto = await testUtils.createTestPhoto(testUser.id, {
        processing_status: 'completed',
        processed_image_url: 'https://example.com/processed.jpg',
      });
    });

    it('should generate shareable link for completed photo', async () => {
      const response = await request(app)
        .post(`/api/photos/${completedPhoto.id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        shareUrl: expect.stringContaining('http'),
        shareToken: expect.any(String),
        expiresAt: expect.any(String),
      });

      // Verify share record was created
      const shareRecord = await testDb('photo_shares')
        .where('photo_id', completedPhoto.id)
        .first();
      expect(shareRecord).toBeTruthy();
    });

    it('should reject sharing of processing photos', async () => {
      const processingPhoto = await testUtils.createTestPhoto(testUser.id, {
        processing_status: 'processing',
      });

      const response = await request(app)
        .post(`/api/photos/${processingPhoto.id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toContain('not completed');
    });

    it('should set custom expiration time', async () => {
      const expirationHours = 24;
      
      const response = await request(app)
        .post(`/api/photos/${completedPhoto.id}/share`)
        .send({ expirationHours })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const expiresAt = new Date(response.body.expiresAt);
      const expectedExpiration = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
      
      expect(Math.abs(expiresAt - expectedExpiration)).toBeLessThan(60000); // Within 1 minute
    });
  });

  describe('Analytics Integration', () => {
    beforeEach(() => {
      testUtils.mockServices.mixpanel.mockTrackEvent();
    });

    it('should track photo upload events', async () => {
      await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'professional')
        .expect(201);

      const mixpanel = require('mixpanel');
      expect(mixpanel.init().track).toHaveBeenCalledWith(
        'photo_uploaded',
        expect.objectContaining({
          userId: testUser.id,
          styleId: 'professional',
          userPlan: 'free',
        })
      );
    });

    it('should track photo processing completion', async () => {
      const photo = await testUtils.createTestPhoto(testUser.id, {
        processing_status: 'processing',
      });

      // Simulate processing completion
      await testDb('generated_photos')
        .where('id', photo.id)
        .update({
          processing_status: 'completed',
          processed_image_url: 'https://example.com/processed.jpg',
          processing_completed_at: new Date(),
        });

      const mixpanel = require('mixpanel');
      expect(mixpanel.init().track).toHaveBeenCalledWith(
        'photo_processing_completed',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalSelect = testDb.select;
      testDb.select = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('server error'),
      });

      // Restore original method
      testDb.select = originalSelect;
    });

    it('should handle Replicate API errors', async () => {
      const replicate = require('replicate');
      replicate.run.mockRejectedValueOnce(new Error('Replicate API failed'));

      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', Buffer.from('fake-image-data'), 'test.jpg')
        .field('styleId', 'professional')
        .expect(500);

      expect(response.body.error).toContain('processing failed');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent photo uploads', async () => {
      const uploadPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/photos/upload')
          .set('Authorization', `Bearer ${premiumToken}`) // Use premium to avoid limits
          .attach('photo', Buffer.from(`fake-image-data-${i}`), `test-${i}.jpg`)
          .field('styleId', 'professional')
      );

      const responses = await Promise.all(uploadPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    it('should optimize photo listing queries', async () => {
      // Create many photos
      const photos = await Promise.all(
        Array.from({ length: 50 }, () => testUtils.createTestPhoto(testUser.id))
      );

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/photos?limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(response.body.photos).toHaveLength(20);
    });
  });
});