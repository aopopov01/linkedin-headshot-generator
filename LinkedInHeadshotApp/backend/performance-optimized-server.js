/**
 * Performance-Optimized OmniShot Backend Server
 * Focused on image processing performance and optimization
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cluster = require('cluster');
const os = require('os');

// Import services
const { IntelligentImageProcessor } = require('./src/services/intelligentImageProcessor');
const { MultiPlatformOptimizationEngine } = require('./src/services/multiPlatformOptimizationEngine');
const { PlatformSpecificationEngine } = require('./src/services/platformSpecificationEngine');
const { MonitoringService } = require('./src/services/monitoringService');

class PerformanceOptimizedServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.server = null;
    this.io = null;
    
    // Performance services
    this.imageProcessor = new IntelligentImageProcessor();
    this.optimizationEngine = new MultiPlatformOptimizationEngine();
    this.platformSpecs = new PlatformSpecificationEngine();
    this.monitor = new MonitoringService();
    
    // Performance metrics
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      activeConnections: 0,
      imageProcessingJobs: 0,
      memoryUsage: process.memoryUsage(),
      startTime: Date.now()
    };
    
    this.setupExpress();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupPerformanceMonitoring();
  }

  setupExpress() {
    // Performance-optimized middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));
    
    this.app.use(cors({
      origin: true,
      credentials: true
    }));
    
    // Aggressive compression for better performance
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    }));
    
    // Enhanced rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Higher limit for performance testing
      message: { error: 'Rate limit exceeded' },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);
    
    // Optimized body parsing
    this.app.use(express.json({ 
      limit: '100mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '100mb' 
    }));
    
    // Performance logging
    this.app.use(morgan('combined', {
      stream: { 
        write: (message) => {
          console.log(message.trim());
        }
      }
    }));
    
    // Request timing middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      this.metrics.requestCount++;
      this.metrics.activeConnections++;
      
      res.on('finish', () => {
        const responseTime = Date.now() - req.startTime;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.activeConnections--;
      });
      
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getSystemHealth();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Performance metrics endpoint
    this.app.get('/api/metrics', (req, res) => {
      const uptime = Date.now() - this.metrics.startTime;
      const avgResponseTime = this.metrics.requestCount > 0 
        ? this.metrics.totalResponseTime / this.metrics.requestCount 
        : 0;

      res.json({
        uptime: `${(uptime / 1000).toFixed(2)}s`,
        requests: this.metrics.requestCount,
        activeConnections: this.metrics.activeConnections,
        averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        imageProcessingJobs: this.metrics.imageProcessingJobs,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      });
    });

    // Image optimization endpoint
    this.app.post('/api/optimize', async (req, res) => {
      try {
        const startTime = Date.now();
        const { platforms, style, imageData } = req.body;
        
        if (!imageData || !platforms || !style) {
          return res.status(400).json({
            error: 'Missing required parameters: imageData, platforms, style'
          });
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageData, 'base64');
        
        this.metrics.imageProcessingJobs++;
        
        // Process image with optimization engine
        const result = await this.optimizationEngine.optimizeForMultiplePlatforms(
          imageBuffer,
          platforms,
          style,
          { budget: 'premium' }
        );
        
        const processingTime = Date.now() - startTime;
        
        res.json({
          success: true,
          result,
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Optimization failed:', error);
        res.status(500).json({
          error: 'Image optimization failed',
          message: error.message
        });
      }
    });

    // Platform specifications endpoint
    this.app.get('/api/platforms', async (req, res) => {
      try {
        const supportedPlatforms = ['linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'whatsapp_business', 'github'];
        const platforms = await this.platformSpecs.getMultiplePlatformSpecs(supportedPlatforms);
        res.json({
          success: true,
          platforms,
          supportedPlatforms
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get platform specifications',
          message: error.message
        });
      }
    });

    // Load testing endpoint
    this.app.post('/api/load-test', async (req, res) => {
      const { duration = 30000, concurrency = 10 } = req.body;
      
      try {
        const loadTestResult = await this.executeLoadTest(duration, concurrency);
        res.json({
          success: true,
          result: loadTestResult
        });
      } catch (error) {
        res.status(500).json({
          error: 'Load test failed',
          message: error.message
        });
      }
    });

    // Stress testing endpoint  
    this.app.post('/api/stress-test', async (req, res) => {
      const { maxConcurrency = 50, stepSize = 5, stepDuration = 10000 } = req.body;
      
      try {
        const stressTestResult = await this.executeStressTest(maxConcurrency, stepSize, stepDuration);
        res.json({
          success: true,
          result: stressTestResult
        });
      } catch (error) {
        res.status(500).json({
          error: 'Stress test failed',
          message: error.message
        });
      }
    });

    // Memory analysis endpoint
    this.app.get('/api/memory-analysis', (req, res) => {
      const memUsage = process.memoryUsage();
      const memAnalysis = {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUtilization: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
      };
      
      res.json({
        success: true,
        memory: memAnalysis,
        timestamp: new Date().toISOString()
      });
    });

    // Service health checks
    this.app.get('/api/services/health', async (req, res) => {
      try {
        const serviceHealth = await Promise.allSettled([
          this.imageProcessor.healthCheck(),
          this.optimizationEngine.healthCheck(),
          this.platformSpecs.healthCheck(),
          this.monitor.healthCheck()
        ]);

        const results = {
          imageProcessor: serviceHealth[0].status === 'fulfilled' ? serviceHealth[0].value : { status: 'unhealthy', error: serviceHealth[0].reason?.message },
          optimizationEngine: serviceHealth[1].status === 'fulfilled' ? serviceHealth[1].value : { status: 'unhealthy', error: serviceHealth[1].reason?.message },
          platformSpecs: serviceHealth[2].status === 'fulfilled' ? serviceHealth[2].value : { status: 'unhealthy', error: serviceHealth[2].reason?.message },
          monitoring: serviceHealth[3].status === 'fulfilled' ? serviceHealth[3].value : { status: 'unhealthy', error: serviceHealth[3].reason?.message }
        };

        const overallHealth = Object.values(results).every(r => r.status === 'healthy') ? 'healthy' : 'degraded';

        res.json({
          status: overallHealth,
          services: results,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('Error:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
  }

  setupWebSocket() {
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('subscribe-metrics', () => {
        socket.join('metrics');
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // Broadcast metrics every 5 seconds
    setInterval(() => {
      this.io.to('metrics').emit('metrics-update', {
        activeConnections: this.metrics.activeConnections,
        memory: process.memoryUsage(),
        timestamp: Date.now()
      });
    }, 5000);
  }

  setupPerformanceMonitoring() {
    // Memory monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage = memUsage;
      
      // Memory leak detection
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        console.warn(`⚠️ High memory usage detected: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      }
    }, 10000);

    // Cleanup interval
    setInterval(() => {
      if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection triggered');
      }
    }, 30000);
  }

  async getSystemHealth() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${uptime.toFixed(2)}s`,
      memory: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      requests: {
        total: this.metrics.requestCount,
        active: this.metrics.activeConnections,
        averageResponseTime: this.metrics.requestCount > 0 
          ? `${(this.metrics.totalResponseTime / this.metrics.requestCount).toFixed(2)}ms`
          : '0ms'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      }
    };
  }

  async executeLoadTest(duration, concurrency) {
    console.log(`🔥 Executing load test: ${concurrency} concurrent users for ${duration}ms`);
    
    const results = {
      concurrency,
      duration,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrency; i++) {
      promises.push(this.simulateLoad(duration, results));
    }

    await Promise.all(promises);

    results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    results.throughput = (results.totalRequests / (duration / 1000)).toFixed(2);
    results.successRate = ((results.successfulRequests / results.totalRequests) * 100).toFixed(2);

    return results;
  }

  async simulateLoad(duration, results) {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      const startTime = Date.now();
      
      try {
        // Simulate health check request
        const response = await fetch(`http://localhost:${this.port}/health`);
        const responseTime = Date.now() - startTime;
        
        results.responseTimes.push(responseTime);
        results.totalRequests++;
        
        if (response.ok) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
        }
      } catch (error) {
        results.totalRequests++;
        results.failedRequests++;
        results.responseTimes.push(Date.now() - startTime);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async executeStressTest(maxConcurrency, stepSize, stepDuration) {
    console.log(`💥 Executing stress test: up to ${maxConcurrency} users, steps of ${stepSize}`);
    
    const results = {
      maxConcurrency,
      stepSize,
      stepDuration,
      steps: [],
      breakingPoint: null
    };

    for (let concurrency = stepSize; concurrency <= maxConcurrency; concurrency += stepSize) {
      console.log(`Testing with ${concurrency} concurrent users...`);
      
      const stepResult = await this.executeLoadTest(stepDuration, concurrency);
      stepResult.concurrency = concurrency;
      results.steps.push(stepResult);
      
      // Check if we've reached a breaking point
      if (parseFloat(stepResult.successRate) < 80 || stepResult.averageResponseTime > 10000) {
        results.breakingPoint = {
          concurrency,
          successRate: stepResult.successRate,
          averageResponseTime: stepResult.averageResponseTime
        };
        console.log(`💔 Breaking point reached at ${concurrency} concurrent users`);
        break;
      }
      
      // Cool down between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log('🚀 Performance-Optimized OmniShot Backend Server');
      console.log(`📡 Server running on port ${this.port}`);
      console.log(`🔍 Health check: http://localhost:${this.port}/health`);
      console.log(`📊 Metrics: http://localhost:${this.port}/api/metrics`);
      console.log(`🏥 Service health: http://localhost:${this.port}/api/services/health`);
      console.log('✅ Ready for performance testing!');
    });
  }
}

// Start server
const server = new PerformanceOptimizedServer();
server.start();

module.exports = PerformanceOptimizedServer;