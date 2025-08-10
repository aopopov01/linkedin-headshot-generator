/**
 * Database Optimization Service
 * Provides optimized database queries, connection management, and performance monitoring
 */

const db = require('../config/database');
const logger = require('../config/logger');

class DatabaseOptimizationService {
  constructor() {
    this.queryCache = new Map();
    this.queryStats = new Map();
    this.connectionPool = db;
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Execute optimized query with caching and monitoring
   */
  async executeQuery(query, params = [], options = {}) {
    const startTime = Date.now();
    const queryKey = this.generateQueryKey(query, params);
    
    try {
      // Check cache if enabled
      if (options.cache && this.queryCache.has(queryKey)) {
        const cachedResult = this.queryCache.get(queryKey);
        if (Date.now() - cachedResult.timestamp < (options.cacheTTL || 300000)) { // 5 min default
          this.recordQueryStats(query, Date.now() - startTime, true);
          return cachedResult.data;
        }
      }

      // Execute query
      const result = await this.connectionPool.raw(query, params);
      const executionTime = Date.now() - startTime;

      // Cache result if enabled
      if (options.cache) {
        this.queryCache.set(queryKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      // Record statistics
      this.recordQueryStats(query, executionTime, false);

      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        logger.warn('Slow query detected:', {
          query: query.substring(0, 200),
          executionTime,
          params: params.slice(0, 5) // Limit params in logs
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordQueryStats(query, executionTime, false, error);
      
      logger.error('Database query failed:', {
        query: query.substring(0, 200),
        error: error.message,
        executionTime
      });
      
      throw error;
    }
  }

  /**
   * Get users with optimized pagination and filtering
   */
  async getUsersOptimized(filters = {}, pagination = { page: 1, limit: 20 }) {
    const offset = (pagination.page - 1) * pagination.limit;
    
    let query = db('users')
      .select([
        'id',
        'email', 
        'first_name',
        'last_name',
        'created_at',
        'subscription_tier',
        'is_active'
      ])
      .where('is_active', true);

    // Apply filters efficiently
    if (filters.email) {
      query = query.where('email', 'ilike', `%${filters.email}%`);
    }
    
    if (filters.subscriptionTier) {
      query = query.where('subscription_tier', filters.subscriptionTier);
    }
    
    if (filters.createdAfter) {
      query = query.where('created_at', '>', filters.createdAfter);
    }

    // Add pagination
    query = query.limit(pagination.limit).offset(offset);

    // Execute with index hint for PostgreSQL
    const result = await query;
    
    return result;
  }

  /**
   * Get user photo history with optimized joins
   */
  async getUserPhotoHistory(userId, limit = 50) {
    return await db('generated_photos as gp')
      .select([
        'gp.id',
        'gp.prediction_id',
        'gp.style_template',
        'gp.status',
        'gp.created_at',
        'gp.processing_time',
        'st.name as style_name',
        'st.description as style_description'
      ])
      .leftJoin('style_templates as st', 'gp.style_template', 'st.id')
      .where('gp.user_id', userId)
      .orderBy('gp.created_at', 'desc')
      .limit(limit);
  }

  /**
   * Get analytics data with optimized aggregation
   */
  async getAnalyticsOptimized(dateRange, groupBy = 'day') {
    const dateFormat = {
      hour: 'YYYY-MM-DD HH24',
      day: 'YYYY-MM-DD',
      week: 'YYYY-"W"WW',
      month: 'YYYY-MM'
    }[groupBy] || 'YYYY-MM-DD';

    return await db('analytics_events')
      .select([
        db.raw(`to_char(created_at, '${dateFormat}') as period`),
        'event_name',
        db.raw('count(*) as event_count'),
        db.raw('count(distinct user_id) as unique_users')
      ])
      .whereBetween('created_at', [dateRange.start, dateRange.end])
      .groupBy(['period', 'event_name'])
      .orderBy('period', 'desc');
  }

  /**
   * Optimized photo generation tracking
   */
  async trackPhotoGeneration(data) {
    const transaction = await db.transaction();
    
    try {
      // Insert generated photo record
      const [photoRecord] = await transaction('generated_photos')
        .insert({
          user_id: data.userId,
          prediction_id: data.predictionId,
          style_template: data.styleTemplate,
          original_image_url: data.originalImageUrl,
          status: 'processing',
          created_at: new Date()
        })
        .returning('*');

      // Update user statistics
      await transaction('users')
        .where('id', data.userId)
        .increment('total_generations', 1)
        .update('last_generation_at', new Date());

      // Track analytics event efficiently
      await transaction('analytics_events')
        .insert({
          user_id: data.userId,
          event_name: 'photo_generation_started',
          properties: {
            style_template: data.styleTemplate,
            prediction_id: data.predictionId
          },
          created_at: new Date()
        });

      await transaction.commit();
      return photoRecord;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Bulk update photo statuses (optimized for batch processing)
   */
  async bulkUpdatePhotoStatuses(updates) {
    if (updates.length === 0) return [];

    const transaction = await db.transaction();
    
    try {
      const updatePromises = updates.map(update => 
        transaction('generated_photos')
          .where('prediction_id', update.predictionId)
          .update({
            status: update.status,
            generated_images: update.generatedImages,
            processing_time: update.processingTime,
            updated_at: new Date()
          })
      );

      await Promise.all(updatePromises);
      await transaction.commit();
      
      return updates;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get database performance statistics
   */
  async getDatabaseStats() {
    try {
      // Get connection pool status
      const poolStats = {
        min: this.connectionPool.client.pool.min,
        max: this.connectionPool.client.pool.max,
        used: this.connectionPool.client.pool.used,
        waiting: this.connectionPool.client.pool.pending
      };

      // Get table sizes
      const tableSizes = await db.raw(`
        SELECT 
          schemaname,
          tablename,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
        LIMIT 10
      `);

      // Get slow queries (if pg_stat_statements is available)
      let slowQueries = [];
      try {
        slowQueries = await db.raw(`
          SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements
          ORDER BY mean_time DESC
          LIMIT 10
        `);
      } catch (error) {
        // pg_stat_statements not available
      }

      // Get index usage
      const indexUsage = await db.raw(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10
      `);

      return {
        connectionPool: poolStats,
        tableSizes: tableSizes.rows,
        slowQueries: slowQueries.rows || [],
        indexUsage: indexUsage.rows,
        queryStats: this.getQueryStats()
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Optimize database with maintenance tasks
   */
  async runDatabaseMaintenance() {
    logger.info('Starting database maintenance tasks');
    
    try {
      // Analyze tables for query optimization
      await db.raw('ANALYZE');
      
      // Vacuum tables to reclaim space (if needed)
      if (process.env.NODE_ENV !== 'production') {
        await db.raw('VACUUM ANALYZE');
      }

      // Update table statistics
      const tables = ['users', 'generated_photos', 'analytics_events', 'purchases'];
      for (const table of tables) {
        await db.raw(`ANALYZE ${table}`);
      }

      logger.info('Database maintenance completed successfully');
      
      return {
        success: true,
        completedAt: new Date(),
        tasks: ['ANALYZE', 'Table statistics updated']
      };
    } catch (error) {
      logger.error('Database maintenance failed:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for performance optimization
   */
  async createOptimizationIndexes() {
    const indexes = [
      // Users table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription ON users(subscription_tier) WHERE is_active = true',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
      
      // Generated photos indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_photos_user_id ON generated_photos(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_photos_prediction_id ON generated_photos(prediction_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_photos_status ON generated_photos(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_photos_created_at ON generated_photos(created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_photos_style_template ON generated_photos(style_template)',
      
      // Analytics events indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_composite ON analytics_events(event_name, created_at DESC)',
      
      // Purchases indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_user_id ON purchases(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_status ON purchases(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC)'
    ];

    for (const indexQuery of indexes) {
      try {
        await db.raw(indexQuery);
        logger.info(`Index created: ${indexQuery.substring(0, 80)}...`);
      } catch (error) {
        // Index might already exist
        if (!error.message.includes('already exists')) {
          logger.warn(`Failed to create index: ${error.message}`);
        }
      }
    }
  }

  /**
   * Generate query key for caching
   */
  generateQueryKey(query, params) {
    return `${query}|${JSON.stringify(params)}`;
  }

  /**
   * Record query statistics
   */
  recordQueryStats(query, executionTime, fromCache, error = null) {
    const queryType = query.trim().split(' ')[0].toUpperCase();
    
    if (!this.queryStats.has(queryType)) {
      this.queryStats.set(queryType, {
        count: 0,
        totalTime: 0,
        cacheHits: 0,
        errors: 0,
        slowQueries: 0
      });
    }

    const stats = this.queryStats.get(queryType);
    stats.count++;
    stats.totalTime += executionTime;
    
    if (fromCache) stats.cacheHits++;
    if (error) stats.errors++;
    if (executionTime > this.slowQueryThreshold) stats.slowQueries++;
  }

  /**
   * Get query statistics
   */
  getQueryStats() {
    const stats = {};
    
    for (const [queryType, data] of this.queryStats.entries()) {
      stats[queryType] = {
        ...data,
        averageTime: data.count > 0 ? data.totalTime / data.count : 0,
        cacheHitRate: data.count > 0 ? (data.cacheHits / data.count) * 100 : 0,
        errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0
      };
    }

    return stats;
  }

  /**
   * Clear query cache
   */
  clearQueryCache() {
    this.queryCache.clear();
    logger.info('Query cache cleared');
  }

  /**
   * Test database connection and performance
   */
  async testDatabasePerformance() {
    const tests = [];
    
    try {
      // Simple connection test
      const startTime = Date.now();
      await db.raw('SELECT 1 as test');
      tests.push({
        name: 'Connection Test',
        duration: Date.now() - startTime,
        status: 'success'
      });

      // Query performance test
      const queryStart = Date.now();
      await db('users').select('id').limit(1);
      tests.push({
        name: 'Query Performance Test',
        duration: Date.now() - queryStart,
        status: 'success'
      });

      // Transaction test
      const txStart = Date.now();
      await db.transaction(async (trx) => {
        await trx.raw('SELECT 1');
      });
      tests.push({
        name: 'Transaction Test',
        duration: Date.now() - txStart,
        status: 'success'
      });

    } catch (error) {
      tests.push({
        name: 'Database Performance Test',
        error: error.message,
        status: 'failed'
      });
    }

    return {
      timestamp: new Date(),
      tests,
      overallStatus: tests.every(test => test.status === 'success') ? 'healthy' : 'unhealthy'
    };
  }
}

module.exports = new DatabaseOptimizationService();