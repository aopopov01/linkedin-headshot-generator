/**
 * Service Registry
 * 
 * Centralized service registry and dependency injection container for the OmniShot backend.
 * Manages service lifecycles, dependencies, and provides a unified interface for service access.
 */

import { LoggerService } from './logger.service';
import { DatabaseService } from './database.service';
import { RedisService } from './redis.service';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { JobQueueService } from './jobQueue.service';
import { MonitoringService } from './monitoring.service';

// Import existing OmniShot services
import OmnishotIntegrationService from '../../src/services/omnishotIntegrationService';
import { MultiPlatformOptimizationEngine } from '../../src/services/multiPlatformOptimizationEngine';
import { PlatformSpecificationEngine } from '../../src/services/platformSpecificationEngine';
import { IntelligentImageProcessor } from '../../src/services/intelligentImageProcessor';
import { CostOptimizationService } from '../../src/services/costOptimizationService';
import { BatchProcessingService } from '../../src/services/batchProcessingService';
import { CustomDimensionHandler } from '../../src/services/customDimensionHandler';
import { PromptEngineeringService } from '../../src/services/promptEngineeringService';
import { APIIntegrationLayer } from '../../src/services/apiIntegrationLayer';

export interface ServiceDefinition {
  name: string;
  instance?: any;
  factory?: () => any;
  singleton?: boolean;
  initialized?: boolean;
  dependencies?: string[];
  healthCheck?: () => Promise<boolean>;
  cleanup?: () => Promise<void>;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  error?: string;
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceDefinition> = new Map();
  private logger: LoggerService;
  private initializationOrder: string[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.logger = new LoggerService('ServiceRegistry');
    this.registerCoreServices();
    this.registerOmnishotServices();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Initialize service registry
   */
  public static async initialize(): Promise<void> {
    const registry = ServiceRegistry.getInstance();
    await registry.initializeServices();
    registry.startHealthChecks();
  }

  /**
   * Register core backend services
   */
  private registerCoreServices(): void {
    // Core infrastructure services
    this.register('logger', {
      factory: () => new LoggerService('App'),
      singleton: true,
      dependencies: []
    });

    this.register('database', {
      factory: () => DatabaseService.getInstance(),
      singleton: true,
      dependencies: [],
      healthCheck: async () => {
        const health = await DatabaseService.healthCheck();
        return health.connection;
      }
    });

    this.register('redis', {
      factory: () => RedisService.getInstance(),
      singleton: true,
      dependencies: [],
      healthCheck: async () => {
        const health = await RedisService.healthCheck();
        return health.connection;
      }
    });

    this.register('auth', {
      factory: () => new AuthService(),
      singleton: true,
      dependencies: ['database', 'redis', 'email']
    });

    this.register('email', {
      factory: () => new EmailService(),
      singleton: true,
      dependencies: []
    });

    this.register('storage', {
      factory: () => new StorageService(),
      singleton: true,
      dependencies: []
    });

    this.register('notification', {
      factory: () => new NotificationService(),
      singleton: true,
      dependencies: ['database', 'redis', 'email']
    });

    this.register('jobQueue', {
      factory: () => JobQueueService.getInstance(),
      singleton: true,
      dependencies: ['redis'],
      healthCheck: async () => {
        const health = await JobQueueService.healthCheck();
        return health.connection;
      }
    });

    this.register('monitoring', {
      factory: () => MonitoringService.getInstance(),
      singleton: true,
      dependencies: ['database', 'redis']
    });
  }

  /**
   * Register existing OmniShot services
   */
  private registerOmnishotServices(): void {
    // Master integration service
    this.register('omnishotIntegration', {
      instance: OmnishotIntegrationService,
      singleton: true,
      dependencies: []
    });

    // Core optimization engines
    this.register('multiPlatformOptimization', {
      factory: () => new MultiPlatformOptimizationEngine(),
      singleton: true,
      dependencies: []
    });

    this.register('platformSpecification', {
      factory: () => new PlatformSpecificationEngine(),
      singleton: true,
      dependencies: []
    });

    this.register('intelligentImageProcessor', {
      factory: () => new IntelligentImageProcessor(),
      singleton: true,
      dependencies: []
    });

    this.register('costOptimization', {
      factory: () => new CostOptimizationService(),
      singleton: true,
      dependencies: ['database', 'redis']
    });

    this.register('batchProcessing', {
      factory: () => new BatchProcessingService(),
      singleton: true,
      dependencies: ['jobQueue', 'database']
    });

    this.register('customDimensionHandler', {
      factory: () => new CustomDimensionHandler(),
      singleton: true,
      dependencies: ['intelligentImageProcessor']
    });

    this.register('promptEngineering', {
      factory: () => new PromptEngineeringService(),
      singleton: true,
      dependencies: ['platformSpecification']
    });

    this.register('apiIntegration', {
      factory: () => new APIIntegrationLayer(),
      singleton: true,
      dependencies: ['storage', 'database']
    });

    // Define initialization order
    this.initializationOrder = [
      'logger',
      'database',
      'redis',
      'storage',
      'email',
      'notification',
      'jobQueue',
      'monitoring',
      'auth',
      'platformSpecification',
      'intelligentImageProcessor',
      'costOptimization',
      'customDimensionHandler',
      'promptEngineering',
      'apiIntegration',
      'batchProcessing',
      'multiPlatformOptimization',
      'omnishotIntegration'
    ];
  }

  /**
   * Register a service
   */
  public register(name: string, definition: Omit<ServiceDefinition, 'name'>): void {
    this.services.set(name, {
      name,
      singleton: true,
      ...definition
    });
  }

  /**
   * Get a service instance
   */
  public get<T = any>(serviceName: string): T {
    const serviceDefinition = this.services.get(serviceName);

    if (!serviceDefinition) {
      throw new Error(`Service '${serviceName}' not found in registry`);
    }

    // Return existing instance if singleton and already created
    if (serviceDefinition.singleton && serviceDefinition.instance) {
      return serviceDefinition.instance;
    }

    // Check dependencies
    if (serviceDefinition.dependencies && serviceDefinition.dependencies.length > 0) {
      this.ensureDependencies(serviceDefinition.dependencies);
    }

    // Create new instance
    let instance: T;

    if (serviceDefinition.instance) {
      instance = serviceDefinition.instance;
    } else if (serviceDefinition.factory) {
      instance = serviceDefinition.factory();
    } else {
      throw new Error(`Service '${serviceName}' has no instance or factory method`);
    }

    // Store instance if singleton
    if (serviceDefinition.singleton) {
      serviceDefinition.instance = instance;
      serviceDefinition.initialized = true;
    }

    return instance;
  }

  /**
   * Check if service exists
   */
  public has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * Get all registered service names
   */
  public getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service definition
   */
  public getServiceDefinition(serviceName: string): ServiceDefinition | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Initialize all services in dependency order
   */
  public async initializeServices(): Promise<void> {
    this.logger.info('Initializing services in dependency order...');

    const initializationResults: { [key: string]: boolean } = {};

    for (const serviceName of this.initializationOrder) {
      try {
        this.logger.info(`Initializing service: ${serviceName}`);
        
        // Get service instance (this will create it if needed)
        const service = this.get(serviceName);
        
        // Call initialization method if it exists
        if (service && typeof service.initialize === 'function') {
          await service.initialize();
        }

        initializationResults[serviceName] = true;
        this.logger.info(`✅ Service initialized: ${serviceName}`);

      } catch (error) {
        this.logger.error(`❌ Failed to initialize service ${serviceName}:`, error);
        initializationResults[serviceName] = false;
        
        // Decide whether to continue or stop based on service criticality
        if (this.isCriticalService(serviceName)) {
          throw new Error(`Critical service ${serviceName} failed to initialize: ${error.message}`);
        }
      }
    }

    // Log initialization summary
    const totalServices = this.initializationOrder.length;
    const successfulServices = Object.values(initializationResults).filter(Boolean).length;
    const failedServices = totalServices - successfulServices;

    this.logger.info(`Service initialization complete: ${successfulServices}/${totalServices} successful`);
    
    if (failedServices > 0) {
      this.logger.warn(`${failedServices} services failed to initialize`);
    }
  }

  /**
   * Ensure dependencies are available
   */
  private ensureDependencies(dependencies: string[]): void {
    for (const dependency of dependencies) {
      if (!this.services.has(dependency)) {
        throw new Error(`Dependency '${dependency}' not found in service registry`);
      }

      const depService = this.services.get(dependency)!;
      if (depService.singleton && !depService.initialized) {
        // Initialize dependency
        this.get(dependency);
      }
    }
  }

  /**
   * Check if service is critical for system operation
   */
  private isCriticalService(serviceName: string): boolean {
    const criticalServices = ['database', 'redis', 'logger', 'auth'];
    return criticalServices.includes(serviceName);
  }

  /**
   * Start health checks for all services
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Check every minute

    this.logger.info('Service health checks started');
  }

  /**
   * Perform health checks on all services
   */
  public async performHealthChecks(): Promise<ServiceHealth[]> {
    const healthResults: ServiceHealth[] = [];

    for (const [serviceName, serviceDefinition] of this.services.entries()) {
      if (serviceDefinition.healthCheck && serviceDefinition.initialized) {
        try {
          const isHealthy = await serviceDefinition.healthCheck();
          healthResults.push({
            name: serviceName,
            status: isHealthy ? 'healthy' : 'unhealthy',
            lastCheck: new Date()
          });
        } catch (error) {
          healthResults.push({
            name: serviceName,
            status: 'unhealthy',
            lastCheck: new Date(),
            error: error.message
          });
        }
      } else {
        healthResults.push({
          name: serviceName,
          status: serviceDefinition.initialized ? 'healthy' : 'unknown',
          lastCheck: new Date()
        });
      }
    }

    // Log unhealthy services
    const unhealthyServices = healthResults.filter(result => result.status === 'unhealthy');
    if (unhealthyServices.length > 0) {
      this.logger.warn('Unhealthy services detected:', unhealthyServices.map(s => s.name).join(', '));
    }

    return healthResults;
  }

  /**
   * Get system health summary
   */
  public async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceHealth[];
    summary: {
      total: number;
      healthy: number;
      unhealthy: number;
      unknown: number;
    };
  }> {
    const serviceHealth = await this.performHealthChecks();
    
    const summary = {
      total: serviceHealth.length,
      healthy: serviceHealth.filter(s => s.status === 'healthy').length,
      unhealthy: serviceHealth.filter(s => s.status === 'unhealthy').length,
      unknown: serviceHealth.filter(s => s.status === 'unknown').length
    };

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (summary.unhealthy > 0) {
      const unhealthyCritical = serviceHealth
        .filter(s => s.status === 'unhealthy')
        .some(s => this.isCriticalService(s.name));
      
      overall = unhealthyCritical ? 'unhealthy' : 'degraded';
    }

    return {
      overall,
      services: serviceHealth,
      summary
    };
  }

  /**
   * Stop all services gracefully
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Starting service registry shutdown...');

    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Shutdown services in reverse order
    const shutdownOrder = [...this.initializationOrder].reverse();

    for (const serviceName of shutdownOrder) {
      try {
        const serviceDefinition = this.services.get(serviceName);
        
        if (serviceDefinition && serviceDefinition.instance) {
          // Call cleanup method if it exists
          if (typeof serviceDefinition.instance.cleanup === 'function') {
            await serviceDefinition.instance.cleanup();
            this.logger.info(`✅ Service cleaned up: ${serviceName}`);
          }

          // Call specific shutdown methods if they exist
          if (typeof serviceDefinition.instance.shutdown === 'function') {
            await serviceDefinition.instance.shutdown();
          } else if (typeof serviceDefinition.instance.close === 'function') {
            await serviceDefinition.instance.close();
          }
        }

      } catch (error) {
        this.logger.error(`❌ Error shutting down service ${serviceName}:`, error);
      }
    }

    this.logger.info('Service registry shutdown complete');
  }

  /**
   * Create service proxy for enhanced functionality
   */
  public createProxy<T = any>(serviceName: string): T {
    return new Proxy({} as T, {
      get: (target, prop) => {
        const service = this.get<T>(serviceName);
        const value = (service as any)[prop];

        if (typeof value === 'function') {
          return (...args: any[]) => {
            // Add instrumentation, logging, etc.
            this.logger.debug(`Calling ${serviceName}.${String(prop)}`);
            return value.apply(service, args);
          };
        }

        return value;
      }
    });
  }

  /**
   * Service dependency graph analysis
   */
  public getDependencyGraph(): { [serviceName: string]: string[] } {
    const graph: { [serviceName: string]: string[] } = {};

    for (const [serviceName, serviceDefinition] of this.services.entries()) {
      graph[serviceName] = serviceDefinition.dependencies || [];
    }

    return graph;
  }

  /**
   * Validate service dependencies
   */
  public validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const graph = this.getDependencyGraph();

    for (const [serviceName, dependencies] of Object.entries(graph)) {
      for (const dependency of dependencies) {
        if (!this.services.has(dependency)) {
          errors.push(`Service '${serviceName}' depends on '${dependency}' which is not registered`);
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCircularDependency = (serviceName: string): boolean => {
      if (recursionStack.has(serviceName)) {
        return true;
      }

      if (visited.has(serviceName)) {
        return false;
      }

      visited.add(serviceName);
      recursionStack.add(serviceName);

      const dependencies = graph[serviceName] || [];
      for (const dependency of dependencies) {
        if (hasCircularDependency(dependency)) {
          errors.push(`Circular dependency detected involving service '${serviceName}'`);
          return true;
        }
      }

      recursionStack.delete(serviceName);
      return false;
    };

    for (const serviceName of Object.keys(graph)) {
      hasCircularDependency(serviceName);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance and static methods
export const serviceRegistry = ServiceRegistry.getInstance();
export default serviceRegistry;