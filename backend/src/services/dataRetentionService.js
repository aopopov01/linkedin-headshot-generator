const db = require('../config/database');
const logger = require('../config/logger');
const cron = require('node-cron');

/**
 * GDPR/CCPA Compliant Data Retention Service
 * 
 * This service handles:
 * - Automated data deletion based on retention policies
 * - Consent expiration handling
 * - Data archival and anonymization
 * - Compliance with "right to be forgotten"
 * - Secure data destruction
 */

class DataRetentionService {
  constructor() {
    this.isInitialized = false;
    this.retentionPolicies = {
      // GDPR-compliant retention periods
      sourcePhotos: 24 * 60 * 60 * 1000, // 24 hours
      generatedPhotos: 30 * 24 * 60 * 60 * 1000, // 30 days
      userSavedPhotos: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      analyticsEvents: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years (then anonymized)
      consentRecords: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years (legal requirement)
      purchaseRecords: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years (tax/legal)
      supportTickets: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      dataExports: 90 * 24 * 60 * 60 * 1000, // 90 days
      privacyRequests: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      auditLogs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      consentExpiry: 365 * 24 * 60 * 60 * 1000 // 1 year (GDPR requirement)
    };
  }

  /**
   * Initialize the data retention service and schedule cleanup tasks
   */
  async initialize() {
    try {
      this.isInitialized = true;
      
      // Schedule daily retention cleanup at 2 AM
      cron.schedule('0 2 * * *', () => {
        this.performDailyCleanup();
      });

      // Schedule weekly deep cleanup on Sundays at 3 AM
      cron.schedule('0 3 * * 0', () => {
        this.performWeeklyCleanup();
      });

      // Schedule monthly compliance audit on 1st of each month at 4 AM
      cron.schedule('0 4 1 * *', () => {
        this.performMonthlyAudit();
      });

      logger.info('DataRetentionService initialized with automated cleanup schedules');
    } catch (error) {
      logger.error('Failed to initialize DataRetentionService:', error);
    }
  }

  /**
   * Daily automated cleanup tasks
   */
  async performDailyCleanup() {
    try {
      logger.info('Starting daily data retention cleanup');

      const results = await Promise.allSettled([
        this.deleteExpiredSourcePhotos(),
        this.deleteExpiredGeneratedPhotos(),
        this.deleteExpiredDataExports(),
        this.handleExpiredConsent(),
        this.cleanupFailedProcessing()
      ]);

      const summary = this.generateCleanupSummary(results, 'daily');
      logger.info('Daily cleanup completed:', summary);

    } catch (error) {
      logger.error('Daily cleanup failed:', error);
    }
  }

  /**
   * Weekly deep cleanup tasks
   */
  async performWeeklyCleanup() {
    try {
      logger.info('Starting weekly data retention cleanup');

      const results = await Promise.allSettled([
        this.anonymizeOldAnalytics(),
        this.archiveOldPurchaseRecords(),
        this.cleanupOldSupportTickets(),
        this.validateRetentionCompliance()
      ]);

      const summary = this.generateCleanupSummary(results, 'weekly');
      logger.info('Weekly cleanup completed:', summary);

    } catch (error) {
      logger.error('Weekly cleanup failed:', error);
    }
  }

  /**
   * Monthly compliance audit
   */
  async performMonthlyAudit() {
    try {
      logger.info('Starting monthly data retention audit');

      const auditResults = await Promise.allSettled([
        this.auditDataRetentionCompliance(),
        this.generateRetentionReport(),
        this.validateConsentRecords(),
        this.checkDataMinimization()
      ]);

      const summary = this.generateCleanupSummary(auditResults, 'monthly');
      logger.info('Monthly audit completed:', summary);

    } catch (error) {
      logger.error('Monthly audit failed:', error);
    }
  }

  /**
   * Delete source photos older than 24 hours (GDPR compliance)
   */
  async deleteExpiredSourcePhotos() {
    const cutoffTime = new Date(Date.now() - this.retentionPolicies.sourcePhotos);
    
    const deletedCount = await db('generated_photos')
      .where('created_at', '<', cutoffTime)
      .whereNotNull('source_photo_path')
      .update({
        source_photo_path: null,
        source_photo_deleted_at: new Date()
      });

    logger.info(`Deleted ${deletedCount} expired source photos`);
    return { deleted: deletedCount, type: 'source_photos' };
  }

  /**
   * Delete generated photos older than 30 days (unless user-saved)
   */
  async deleteExpiredGeneratedPhotos() {
    const cutoffTime = new Date(Date.now() - this.retentionPolicies.generatedPhotos);
    
    const deletedCount = await db('generated_photos')
      .where('created_at', '<', cutoffTime)
      .where('user_saved', false)
      .whereNotNull('generated_photo_url')
      .update({
        generated_photo_url: null,
        cloudinary_public_id: null,
        deleted_at: new Date()
      });

    logger.info(`Deleted ${deletedCount} expired generated photos`);
    return { deleted: deletedCount, type: 'generated_photos' };
  }

  /**
   * Delete expired data exports (90 days)
   */
  async deleteExpiredDataExports() {
    const cutoffTime = new Date(Date.now() - this.retentionPolicies.dataExports);
    
    const deletedCount = await db('data_exports')
      .where('created_at', '<', cutoffTime)
      .del();

    logger.info(`Deleted ${deletedCount} expired data exports`);
    return { deleted: deletedCount, type: 'data_exports' };
  }

  /**
   * Handle expired consent (GDPR Article 7)
   */
  async handleExpiredConsent() {
    const cutoffTime = new Date(Date.now() - this.retentionPolicies.consentExpiry);
    
    // Find users with expired consent
    const expiredConsent = await db('consent_history')
      .where('consent_date', '<', cutoffTime)
      .where('consent_given', true)
      .whereNull('expires_at')
      .orWhere('expires_at', '<', new Date());

    let renewalCount = 0;
    
    for (const consent of expiredConsent) {
      // Mark consent as expired
      await db('consent_history')
        .where('id', consent.id)
        .update({
          consent_given: false,
          consent_method: 'expired',
          updated_at: new Date()
        });

      // Update user preferences
      await this.revokeExpiredUserConsent(consent.user_id, consent.consent_type);
      
      // Schedule consent renewal request
      await this.scheduleConsentRenewal(consent.user_id, consent.consent_type);
      
      renewalCount++;
    }

    logger.info(`Processed ${renewalCount} expired consent records`);
    return { processed: renewalCount, type: 'expired_consent' };
  }

  /**
   * Revoke expired consent from user preferences
   */
  async revokeExpiredUserConsent(userId, consentType) {
    const user = await db('users').where('id', userId).first();
    
    if (user && user.preferences) {
      const preferences = JSON.parse(user.preferences);
      
      // Set specific consent to false
      switch (consentType) {
        case 'marketing':
          preferences.marketing_consent = false;
          break;
        case 'analytics':
          preferences.analytics_consent = false;
          break;
        case 'personalization':
          preferences.personalization_consent = false;
          break;
      }

      await db('users')
        .where('id', userId)
        .update({
          preferences: JSON.stringify(preferences),
          updated_at: new Date()
        });
    }
  }

  /**
   * Schedule consent renewal request
   */
  async scheduleConsentRenewal(userId, consentType) {
    // In production, integrate with notification/email service
    logger.info(`Scheduled consent renewal for user ${userId}, type: ${consentType}`);
    
    // Create privacy request for consent renewal
    await db('privacy_requests').insert({
      user_id: userId,
      request_type: 'consent_renewal',
      status: 'scheduled',
      request_details: JSON.stringify({
        consent_type: consentType,
        reason: 'expired_consent',
        scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }),
      created_at: new Date()
    });
  }

  /**
   * Anonymize old analytics events (after 2 years)
   */
  async anonymizeOldAnalytics() {
    const cutoffTime = new Date(Date.now() - this.retentionPolicies.analyticsEvents);
    
    const anonymizedCount = await db('analytics_events')
      .where('created_at', '<', cutoffTime)
      .whereNotNull('user_id')
      .update({
        user_id: null,
        device_id: null,
        ip_address: null,
        user_agent: null,
        city: null,
        anonymized_at: new Date()
      });

    logger.info(`Anonymized ${anonymizedCount} old analytics events`);
    return { anonymized: anonymizedCount, type: 'analytics_events' };
  }

  /**
   * Archive old purchase records (keep for 7 years for tax/legal compliance)
   */
  async archiveOldPurchaseRecords() {
    const cutoffTime = new Date(Date.now() - this.retentionPolicies.purchaseRecords);
    
    const archiveCount = await db('purchases')
      .where('created_at', '<', cutoffTime)
      .whereNull('archived_at')
      .update({
        archived_at: new Date(),
        // Remove PII but keep transaction data for legal compliance
        user_email: null,
        billing_address: null
      });

    logger.info(`Archived ${archiveCount} old purchase records`);
    return { archived: archiveCount, type: 'purchase_records' };
  }

  /**
   * Clean up failed processing records
   */
  async cleanupFailedProcessing() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const cleanedCount = await db('generated_photos')
      .where('processing_status', 'failed')
      .where('created_at', '<', oneDayAgo)
      .del();

    logger.info(`Cleaned up ${cleanedCount} failed processing records`);
    return { cleaned: cleanedCount, type: 'failed_processing' };
  }

  /**
   * Validate retention compliance across all data types
   */
  async validateRetentionCompliance() {
    const validationResults = {
      compliant: true,
      issues: [],
      recommendations: []
    };

    // Check for overdue deletions
    const overduePhotos = await db('generated_photos')
      .where('created_at', '<', new Date(Date.now() - this.retentionPolicies.generatedPhotos))
      .where('user_saved', false)
      .whereNotNull('generated_photo_url')
      .count('id as count')
      .first();

    if (overduePhotos.count > 0) {
      validationResults.compliant = false;
      validationResults.issues.push(`${overduePhotos.count} generated photos overdue for deletion`);
    }

    // Check consent expiry
    const expiredConsent = await db('consent_history')
      .where('consent_date', '<', new Date(Date.now() - this.retentionPolicies.consentExpiry))
      .where('consent_given', true)
      .count('id as count')
      .first();

    if (expiredConsent.count > 0) {
      validationResults.issues.push(`${expiredConsent.count} consent records need renewal`);
      validationResults.recommendations.push('Send consent renewal requests');
    }

    return validationResults;
  }

  /**
   * Generate comprehensive retention report
   */
  async generateRetentionReport() {
    const report = {
      generated_at: new Date().toISOString(),
      data_categories: {},
      compliance_status: 'compliant',
      recommendations: []
    };

    // Count records by category and age
    const categories = [
      'users', 'generated_photos', 'purchases', 
      'analytics_events', 'consent_history', 'privacy_requests'
    ];

    for (const category of categories) {
      const stats = await this.getCategoryStats(category);
      report.data_categories[category] = stats;
    }

    return report;
  }

  /**
   * Get statistics for a data category
   */
  async getCategoryStats(tableName) {
    const total = await db(tableName).count('id as count').first();
    const thirtyDaysOld = await db(tableName)
      .where('created_at', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .count('id as count')
      .first();
    const oneYearOld = await db(tableName)
      .where('created_at', '<', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .count('id as count')
      .first();

    return {
      total: parseInt(total.count),
      older_than_30_days: parseInt(thirtyDaysOld.count),
      older_than_1_year: parseInt(oneYearOld.count)
    };
  }

  /**
   * Immediate data deletion for specific user (right to erasure)
   */
  async deleteUserData(userId, deleteOptions = {}) {
    const {
      deleteAllData = true,
      anonymizeInsteadOfDelete = false,
      retainForLegal = ['purchases', 'consent_history']
    } = deleteOptions;

    try {
      await db.transaction(async (trx) => {
        if (deleteAllData && !anonymizeInsteadOfDelete) {
          // Complete deletion
          await this.performCompleteUserDeletion(trx, userId, retainForLegal);
        } else if (anonymizeInsteadOfDelete) {
          // Anonymization instead of deletion
          await this.performUserDataAnonymization(trx, userId);
        } else {
          // Selective deletion based on user preferences
          await this.performSelectiveUserDeletion(trx, userId, deleteOptions);
        }
      });

      logger.info('User data deletion completed', { userId, deleteAllData, anonymizeInsteadOfDelete });
      return { success: true, method: anonymizeInsteadOfDelete ? 'anonymized' : 'deleted' };

    } catch (error) {
      logger.error('User data deletion failed:', error);
      throw error;
    }
  }

  /**
   * Perform complete user data deletion
   */
  async performCompleteUserDeletion(trx, userId, retainForLegal) {
    const tables = ['analytics_events', 'generated_photos', 'data_exports', 'privacy_requests'];
    
    // Delete from tables (except those retained for legal reasons)
    for (const table of tables) {
      if (!retainForLegal.includes(table)) {
        await trx(table).where('user_id', userId).del();
      }
    }

    // Handle legally required data with anonymization
    for (const table of retainForLegal) {
      if (table === 'purchases') {
        await trx('purchases')
          .where('user_id', userId)
          .update({
            user_id: null,
            user_email: `deleted_${userId}@anonymized.local`,
            billing_address: null,
            anonymized_at: new Date()
          });
      }
      
      if (table === 'consent_history') {
        await trx('consent_history')
          .where('user_id', userId)
          .update({
            user_id: null,
            anonymized_at: new Date()
          });
      }
    }

    // Delete user account
    await trx('users').where('id', userId).del();
  }

  /**
   * Perform user data anonymization
   */
  async performUserDataAnonymization(trx, userId) {
    // Anonymize user account
    await trx('users')
      .where('id', userId)
      .update({
        email: `anonymized_${userId}@local.dev`,
        first_name: null,
        last_name: null,
        phone: null,
        is_active: false,
        preferences: null,
        anonymized_at: new Date()
      });

    // Anonymize analytics
    await trx('analytics_events')
      .where('user_id', userId)
      .update({
        device_id: null,
        ip_address: null,
        user_agent: null,
        city: null,
        anonymized_at: new Date()
      });
  }

  /**
   * Generate cleanup summary
   */
  generateCleanupSummary(results, type) {
    const summary = {
      type,
      timestamp: new Date().toISOString(),
      total_operations: results.length,
      successful_operations: 0,
      failed_operations: 0,
      details: {}
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        summary.successful_operations++;
        if (result.value) {
          summary.details[`operation_${index}`] = result.value;
        }
      } else {
        summary.failed_operations++;
        summary.details[`error_${index}`] = result.reason?.message || 'Unknown error';
      }
    });

    return summary;
  }

  /**
   * Manual retention policy enforcement
   */
  async enforceRetentionPolicy(category, options = {}) {
    switch (category) {
      case 'source_photos':
        return await this.deleteExpiredSourcePhotos();
      case 'generated_photos':
        return await this.deleteExpiredGeneratedPhotos();
      case 'analytics':
        return await this.anonymizeOldAnalytics();
      case 'data_exports':
        return await this.deleteExpiredDataExports();
      case 'consent':
        return await this.handleExpiredConsent();
      default:
        throw new Error(`Unknown retention category: ${category}`);
    }
  }
}

// Export singleton instance
module.exports = new DataRetentionService();