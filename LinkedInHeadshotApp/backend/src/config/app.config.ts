/**
 * Application Configuration
 * 
 * Centralized configuration management for the OmniShot backend system.
 * Handles environment-specific settings, feature flags, and service configurations.
 */

import { config } from 'dotenv';

config();

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  ssl: boolean;
}

export interface RedisConfig {
  url: string;
  maxRetries: number;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
}

export interface JWTConfig {
  secret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

export interface StorageConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'local';
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  local?: {
    uploadDir: string;
    maxFileSize: number;
  };
}

export interface AIServiceConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  replicate: {
    apiKey: string;
    defaultModel: string;
  };
  stabilityai: {
    apiKey: string;
    engineId: string;
  };
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsEndpoint: string;
  healthCheckInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class AppConfig {
  public readonly port: number;
  public readonly nodeEnv: string;
  public readonly allowedOrigins: string[];
  public readonly database: DatabaseConfig;
  public readonly redis: RedisConfig;
  public readonly jwt: JWTConfig;
  public readonly storage: StorageConfig;
  public readonly aiServices: AIServiceConfig;
  public readonly rateLimit: RateLimitConfig;
  public readonly monitoring: MonitoringConfig;

  constructor() {
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.allowedOrigins = this.parseAllowedOrigins();

    this.database = this.loadDatabaseConfig();
    this.redis = this.loadRedisConfig();
    this.jwt = this.loadJWTConfig();
    this.storage = this.loadStorageConfig();
    this.aiServices = this.loadAIServicesConfig();
    this.rateLimit = this.loadRateLimitConfig();
    this.monitoring = this.loadMonitoringConfig();

    this.validateConfig();
  }

  private parseAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:19006';
    return origins.split(',').map(origin => origin.trim());
  }

  private loadDatabaseConfig(): DatabaseConfig {
    return {
      url: process.env.DATABASE_URL!,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000', 10),
      ssl: process.env.DB_SSL === 'true'
    };
  }

  private loadRedisConfig(): RedisConfig {
    return {
      url: process.env.REDIS_URL!,
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
      enableReadyCheck: process.env.REDIS_READY_CHECK !== 'false',
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10)
    };
  }

  private loadJWTConfig(): JWTConfig {
    return {
      secret: process.env.JWT_SECRET!,
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: process.env.JWT_ISSUER || 'omnishot-backend',
      audience: process.env.JWT_AUDIENCE || 'omnishot-app'
    };
  }

  private loadStorageConfig(): StorageConfig {
    const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageConfig['provider'];

    const config: StorageConfig = { provider };

    switch (provider) {
      case 'aws':
        config.aws = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          region: process.env.AWS_REGION || 'us-east-1',
          bucket: process.env.AWS_S3_BUCKET!
        };
        break;
      case 'local':
      default:
        config.local = {
          uploadDir: process.env.UPLOAD_DIR || './uploads',
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10) // 50MB
        };
        break;
    }

    return config;
  }

  private loadAIServicesConfig(): AIServiceConfig {
    return {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'dall-e-3',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000', 10),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
      },
      replicate: {
        apiKey: process.env.REPLICATE_API_TOKEN || '',
        defaultModel: process.env.REPLICATE_DEFAULT_MODEL || 'stability-ai/stable-diffusion-xl-base-1.0'
      },
      stabilityai: {
        apiKey: process.env.STABILITY_API_KEY || '',
        engineId: process.env.STABILITY_ENGINE_ID || 'stable-diffusion-xl-1024-v1-0'
      }
    };
  }

  private loadRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
      skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
    };
  }

  private loadMonitoringConfig(): MonitoringConfig {
    return {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      metricsEndpoint: process.env.METRICS_ENDPOINT || '/metrics',
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
      logLevel: (process.env.LOG_LEVEL || 'info') as MonitoringConfig['logLevel']
    };
  }

  private validateConfig(): void {
    const requiredEnvVars = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate port range
    if (this.port < 1 || this.port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }

    // Validate storage configuration
    if (this.storage.provider === 'aws' && !this.storage.aws) {
      throw new Error('AWS storage configuration is required when using AWS provider');
    }

    // Validate JWT secret strength
    if (this.jwt.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }
  }

  /**
   * Get configuration for specific environment
   */
  public isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  public isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  /**
   * Get feature flags
   */
  public getFeatureFlags() {
    return {
      enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
      enableMetrics: process.env.ENABLE_METRICS !== 'false',
      enableCaching: process.env.ENABLE_CACHING !== 'false',
      enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
      enableCORS: process.env.ENABLE_CORS !== 'false',
      enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      enableHelmet: process.env.ENABLE_HELMET !== 'false',
      enableJobQueue: process.env.ENABLE_JOB_QUEUE !== 'false',
      enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
      enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      enableSlackNotifications: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
      enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true'
    };
  }

  /**
   * Get service-specific configurations
   */
  public getServiceConfig(serviceName: string): any {
    const configs = {
      optimization: {
        maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_OPTIMIZATION_JOBS || '5', 10),
        jobTimeout: parseInt(process.env.OPTIMIZATION_JOB_TIMEOUT || '300000', 10), // 5 minutes
        retryAttempts: parseInt(process.env.OPTIMIZATION_RETRY_ATTEMPTS || '3', 10),
        costThreshold: parseFloat(process.env.OPTIMIZATION_COST_THRESHOLD || '10.00'),
      },
      batch: {
        maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '10', 10),
        batchTimeout: parseInt(process.env.BATCH_TIMEOUT || '600000', 10), // 10 minutes
        concurrency: parseInt(process.env.BATCH_CONCURRENCY || '3', 10),
      },
      platform: {
        supportedPlatforms: (process.env.SUPPORTED_PLATFORMS || 'linkedin,instagram,facebook,twitter,tiktok,youtube,pinterest,snapchat,whatsapp').split(','),
        apiRateLimits: {
          linkedin: parseInt(process.env.LINKEDIN_RATE_LIMIT || '100', 10),
          instagram: parseInt(process.env.INSTAGRAM_RATE_LIMIT || '200', 10),
          facebook: parseInt(process.env.FACEBOOK_RATE_LIMIT || '200', 10),
        }
      },
      analytics: {
        retentionPeriod: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
        aggregationInterval: process.env.ANALYTICS_AGGREGATION_INTERVAL || '1h',
        enableDetailedTracking: process.env.ENABLE_DETAILED_ANALYTICS === 'true',
      }
    };

    return configs[serviceName] || {};
  }
}

export default AppConfig;