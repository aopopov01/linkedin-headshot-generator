/**
 * Database Service
 * 
 * Centralized database connection and management service using Prisma ORM.
 * Handles connection pooling, health checks, and database operations.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { LoggerService } from './logger.service';

export class DatabaseService {
  private static instance: DatabaseService;
  private static prismaClient: PrismaClient;
  private static logger: LoggerService;

  private constructor() {
    DatabaseService.logger = new LoggerService('DatabaseService');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database connection
   */
  public static async initialize(): Promise<void> {
    try {
      DatabaseService.logger = new LoggerService('DatabaseService');
      
      DatabaseService.prismaClient = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      // Setup event handlers for logging
      DatabaseService.prismaClient.$on('query', (e) => {
        if (process.env.NODE_ENV === 'development') {
          DatabaseService.logger.debug(`Query: ${e.query}`, {
            params: e.params,
            duration: e.duration,
            target: e.target
          });
        }
      });

      DatabaseService.prismaClient.$on('error', (e) => {
        DatabaseService.logger.error('Database error:', e);
      });

      DatabaseService.prismaClient.$on('info', (e) => {
        DatabaseService.logger.info('Database info:', e);
      });

      DatabaseService.prismaClient.$on('warn', (e) => {
        DatabaseService.logger.warn('Database warning:', e);
      });

      // Test connection
      await DatabaseService.prismaClient.$connect();
      
      // Run health check
      await DatabaseService.healthCheck();
      
      DatabaseService.logger.info('Database service initialized successfully');
    } catch (error) {
      DatabaseService.logger.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  /**
   * Get Prisma client instance
   */
  public static getClient(): PrismaClient {
    if (!DatabaseService.prismaClient) {
      throw new Error('Database service not initialized. Call initialize() first.');
    }
    return DatabaseService.prismaClient;
  }

  /**
   * Health check
   */
  public static async healthCheck(): Promise<{ status: string; connection: boolean; version?: string }> {
    try {
      // Simple query to test connection
      const result = await DatabaseService.prismaClient.$queryRaw`SELECT 1 as test`;
      
      // Get database version
      const versionResult = await DatabaseService.prismaClient.$queryRaw`SELECT version() as version`;
      
      return {
        status: 'healthy',
        connection: true,
        version: (versionResult as any)[0]?.version
      };
    } catch (error) {
      DatabaseService.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        connection: false
      };
    }
  }

  /**
   * Get database statistics
   */
  public static async getStatistics(): Promise<any> {
    try {
      const [
        userCount,
        optimizationCount,
        activeOptimizations,
        totalCost,
        platformStats
      ] = await Promise.all([
        DatabaseService.prismaClient.user.count(),
        DatabaseService.prismaClient.optimization.count(),
        DatabaseService.prismaClient.optimization.count({
          where: { status: 'PROCESSING' }
        }),
        DatabaseService.prismaClient.optimization.aggregate({
          _sum: { actualCost: true }
        }),
        DatabaseService.prismaClient.optimization.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      ]);

      return {
        users: userCount,
        totalOptimizations: optimizationCount,
        activeOptimizations,
        totalCost: totalCost._sum.actualCost || 0,
        optimizationsByStatus: platformStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      DatabaseService.logger.error('Failed to get database statistics:', error);
      throw error;
    }
  }

  /**
   * Execute raw query with error handling
   */
  public static async executeRaw<T = any>(
    query: TemplateStringsArray,
    ...values: any[]
  ): Promise<T> {
    try {
      return await DatabaseService.prismaClient.$queryRaw(query, ...values);
    } catch (error) {
      DatabaseService.logger.error('Raw query execution failed:', error);
      throw error;
    }
  }

  /**
   * Transaction wrapper
   */
  public static async transaction<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
  ): Promise<T> {
    try {
      return await DatabaseService.prismaClient.$transaction(fn);
    } catch (error) {
      DatabaseService.logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  public static async batchWrite(operations: any[]): Promise<any[]> {
    try {
      return await DatabaseService.prismaClient.$transaction(operations);
    } catch (error) {
      DatabaseService.logger.error('Batch operation failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old records
   */
  public static async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

      // Clean up old audit logs
      await DatabaseService.prismaClient.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      // Clean up old notifications
      await DatabaseService.prismaClient.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: 'READ'
        }
      });

      // Clean up old job queue entries
      await DatabaseService.prismaClient.jobQueue.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: {
            in: ['COMPLETED', 'FAILED', 'CANCELED']
          }
        }
      });

      DatabaseService.logger.info('Database cleanup completed');
    } catch (error) {
      DatabaseService.logger.error('Database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Backup database (PostgreSQL specific)
   */
  public static async backup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `omnishot_backup_${timestamp}.sql`;
      
      // This would typically use pg_dump command
      DatabaseService.logger.info(`Database backup initiated: ${filename}`);
      
      return filename;
    } catch (error) {
      DatabaseService.logger.error('Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Get connection info
   */
  public static getConnectionInfo(): any {
    return {
      url: process.env.DATABASE_URL ? 'Set' : 'Not set',
      isConnected: !!DatabaseService.prismaClient,
      poolSize: process.env.DB_MAX_CONNECTIONS || 10
    };
  }

  /**
   * Close database connections
   */
  public static async close(): Promise<void> {
    try {
      if (DatabaseService.prismaClient) {
        await DatabaseService.prismaClient.$disconnect();
        DatabaseService.logger.info('Database connections closed');
      }
    } catch (error) {
      DatabaseService.logger.error('Error closing database connections:', error);
      throw error;
    }
  }

  // ================================
  // CONVENIENCE METHODS FOR COMMON OPERATIONS
  // ================================

  /**
   * Get user with related data
   */
  public static async getUserWithProfile(userId: string) {
    return await DatabaseService.prismaClient.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        subscription: {
          include: {
            features: true
          }
        },
        analytics: true
      }
    });
  }

  /**
   * Create optimization with result tracking
   */
  public static async createOptimization(data: any) {
    return await DatabaseService.prismaClient.optimization.create({
      data,
      include: {
        results: true,
        user: {
          select: {
            id: true,
            email: true,
            tier: true
          }
        }
      }
    });
  }

  /**
   * Get optimization with all related data
   */
  public static async getOptimizationDetails(optimizationId: string) {
    return await DatabaseService.prismaClient.optimization.findUnique({
      where: { id: optimizationId },
      include: {
        results: true,
        publications: true,
        user: {
          select: {
            id: true,
            email: true,
            tier: true
          }
        },
        batchJob: true
      }
    });
  }

  /**
   * Update user analytics
   */
  public static async updateUserAnalytics(userId: string, updates: any) {
    return await DatabaseService.prismaClient.userAnalytics.upsert({
      where: { userId },
      create: {
        userId,
        ...updates
      },
      update: updates
    });
  }

  /**
   * Log audit event
   */
  public static async logAuditEvent(data: any) {
    return await DatabaseService.prismaClient.auditLog.create({
      data: {
        ...data,
        timestamp: new Date()
      }
    });
  }

  /**
   * Create notification
   */
  public static async createNotification(userId: string, data: any) {
    return await DatabaseService.prismaClient.notification.create({
      data: {
        userId,
        ...data
      }
    });
  }

  /**
   * Get user usage stats for current period
   */
  public static async getUserUsageStats(userId: string, period: 'month' | 'day' = 'month') {
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'month') {
      startDate.setMonth(now.getMonth(), 1);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    return await DatabaseService.prismaClient.usageStats.findMany({
      where: {
        userId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }
}

export default DatabaseService;