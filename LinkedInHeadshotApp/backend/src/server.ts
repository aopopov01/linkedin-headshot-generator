/**
 * OmniShot Production Backend Server
 * 
 * High-performance, scalable backend API server for the OmniShot 
 * multi-platform professional photo optimization system.
 * 
 * Features:
 * - RESTful API with comprehensive endpoints
 * - WebSocket support for real-time updates
 * - Rate limiting and security middleware
 * - Comprehensive logging and monitoring
 * - Health checks and system diagnostics
 * - Job queue management
 * - Service integration layer
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { AppConfig } from './config/app.config';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { LoggerService } from './services/logger.service';
import { MonitoringService } from './services/monitoring.service';
import { JobQueueService } from './services/jobQueue.service';
import { ServiceRegistry } from './services/serviceRegistry';

// Import route modules
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import optimizationRoutes from './routes/optimization.routes';
import aiRoutes from './routes/ai.routes'; // SECURE AI PROXY ROUTES
import platformRoutes from './routes/platform.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import healthRoutes from './routes/health.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { securityMiddleware } from './middleware/security';
import { authMiddleware } from './middleware/auth';

// Import types
import { APIError } from './utils/errors';

class OmnishotServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private logger: LoggerService;
  private config: AppConfig;

  constructor() {
    this.loadEnvironment();
    this.app = express();
    this.config = new AppConfig();
    this.logger = new LoggerService('OmnishotServer');
    
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  /**
   * Load environment configuration
   */
  private loadEnvironment(): void {
    dotenv.config();
    
    // Validate required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'NODE_ENV'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    }
  }

  /**
   * Initialize core services
   */
  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing core services...');

      // Initialize database connection
      await DatabaseService.initialize();
      this.logger.info('Database service initialized');

      // Initialize Redis connection
      await RedisService.initialize();
      this.logger.info('Redis service initialized');

      // Initialize job queue system
      await JobQueueService.initialize();
      this.logger.info('Job queue service initialized');

      // Initialize monitoring service
      await MonitoringService.initialize();
      this.logger.info('Monitoring service initialized');

      // Initialize service registry
      await ServiceRegistry.initialize();
      this.logger.info('Service registry initialized');

      this.logger.info('All core services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Request parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.config.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Logging middleware
    this.app.use(morgan('combined', {
      stream: { write: message => this.logger.info(message.trim()) }
    }));
    this.app.use(requestLogger);

    // Security middleware
    this.app.use(securityMiddleware);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check routes (no auth required)
    this.app.use('/api/health', healthRoutes);

    // Public routes
    this.app.use('/api/auth', authRoutes);

    // Protected routes
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/optimization', authMiddleware, optimizationRoutes);
    this.app.use('/api/ai', authMiddleware, aiRoutes); // SECURE AI PROXY - AUTHENTICATED ONLY
    this.app.use('/api/platforms', authMiddleware, platformRoutes);
    this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
    
    // Admin routes (additional role-based auth applied)
    this.app.use('/api/admin', authMiddleware, adminRoutes);

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'OmniShot Backend API',
        version: '1.0.0',
        description: 'Multi-platform professional photo optimization system',
        documentation: '/api/docs',
        health: '/api/health',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          optimization: '/api/optimization',
          ai: '/api/ai', // SECURE AI PROXY ENDPOINTS
          platforms: '/api/platforms',
          analytics: '/api/analytics',
          admin: '/api/admin'
        }
      });
    });

    // Catch-all route for 404s
    this.app.all('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.path,
        method: req.method
      });
    });
  }

  /**
   * Setup WebSocket for real-time updates
   */
  private setupWebSocket(): void {
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: this.config.allowedOrigins,
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // WebSocket authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        // Verify JWT token (implement token verification logic)
        // const user = await verifyToken(token);
        // socket.userId = user.id;
        
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // WebSocket connection handling
    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);

      // Join user-specific room for notifications
      if (socket.userId) {
        socket.join(`user_${socket.userId}`);
      }

      // Handle optimization progress updates
      socket.on('subscribe_optimization', (operationId) => {
        socket.join(`optimization_${operationId}`);
        this.logger.debug(`Client subscribed to optimization: ${operationId}`);
      });

      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Make io available globally for other services
    (global as any).io = this.io;
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle termination signals
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, shutting down gracefully');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, shutting down gracefully');
      this.gracefulShutdown('SIGINT');
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      const port = this.config.port;
      
      this.server.listen(port, () => {
        this.logger.info(`🚀 OmniShot Backend Server started successfully`);
        this.logger.info(`📡 Server running on port ${port}`);
        this.logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
        this.logger.info(`📊 Health check: http://localhost:${port}/api/health`);
        this.logger.info(`📚 API docs: http://localhost:${port}/api`);
        
        // Start system health monitoring
        this.startHealthMonitoring();
      });

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Periodic health checks
    setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        if (health.status !== 'healthy') {
          this.logger.warn('System health check failed:', health);
        }
      } catch (error) {
        this.logger.error('Health monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get system health status
   */
  private async getSystemHealth(): Promise<any> {
    try {
      const [dbHealth, redisHealth, queueHealth] = await Promise.allSettled([
        DatabaseService.healthCheck(),
        RedisService.healthCheck(),
        JobQueueService.healthCheck()
      ]);

      return {
        status: 'healthy',
        services: {
          database: dbHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
          redis: redisHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
          jobQueue: queueHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    this.logger.info(`Graceful shutdown initiated (${signal})`);

    try {
      // Stop accepting new connections
      this.server.close(() => {
        this.logger.info('HTTP server closed');
      });

      // Close WebSocket connections
      this.io.close(() => {
        this.logger.info('WebSocket server closed');
      });

      // Close job queue connections
      await JobQueueService.close();
      this.logger.info('Job queue closed');

      // Close database connections
      await DatabaseService.close();
      this.logger.info('Database connections closed');

      // Close Redis connections
      await RedisService.close();
      this.logger.info('Redis connections closed');

      this.logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new OmnishotServer();

// Start server with error handling
server.start().catch((error) => {
  console.error('Failed to start OmniShot Backend Server:', error);
  process.exit(1);
});

export default server;