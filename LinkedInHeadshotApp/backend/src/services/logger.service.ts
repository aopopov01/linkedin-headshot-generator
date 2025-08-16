/**
 * Logger Service
 * 
 * Centralized logging service with structured logging, multiple transports,
 * and integration with monitoring systems.
 */

import winston from 'winston';
import path from 'path';

export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  operationId?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

export class LoggerService {
  private logger: winston.Logger;
  private serviceName: string;

  constructor(serviceName: string = 'OmnishotApp') {
    this.serviceName = serviceName;
    this.logger = this.createLogger();
  }

  /**
   * Create Winston logger instance
   */
  private createLogger(): winston.Logger {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    // Custom format for structured logging
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, context, stack, ...meta }) => {
        const logObject = {
          timestamp,
          level,
          service: service || this.serviceName,
          message,
          ...(context && { context }),
          ...(stack && { stack }),
          ...meta
        };

        if (isDevelopment) {
          // Pretty print for development
          return JSON.stringify(logObject, null, 2);
        }

        return JSON.stringify(logObject);
      })
    );

    // Console transport for development
    const consoleTransport = new winston.transports.Console({
      level: logLevel,
      format: isDevelopment 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, service }) => {
              return `[${timestamp}] ${level} [${service || this.serviceName}]: ${message}`;
            })
          )
        : customFormat
    });

    // File transport for persistent logging
    const fileTransport = new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      level: logLevel,
      format: customFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5
    });

    // Error file transport
    const errorTransport = new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5
    });

    const transports: winston.transport[] = [consoleTransport];

    // Add file transports in production
    if (isProduction) {
      transports.push(fileTransport, errorTransport);
    }

    return winston.createLogger({
      level: logLevel,
      format: customFormat,
      defaultMeta: { service: this.serviceName },
      transports,
      // Handle uncaught exceptions and rejections
      exceptionHandlers: isProduction ? [
        new winston.transports.File({ 
          filename: path.join(process.cwd(), 'logs', 'exceptions.log') 
        })
      ] : [],
      rejectionHandlers: isProduction ? [
        new winston.transports.File({ 
          filename: path.join(process.cwd(), 'logs', 'rejections.log') 
        })
      ] : []
    });
  }

  /**
   * Debug level logging
   */
  public debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { context });
  }

  /**
   * Info level logging
   */
  public info(message: string, context?: LogContext): void {
    this.logger.info(message, { context });
  }

  /**
   * Warning level logging
   */
  public warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { context });
  }

  /**
   * Error level logging
   */
  public error(message: string, error?: Error | any, context?: LogContext): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      });
    } else if (error) {
      this.logger.error(message, { error, context });
    } else {
      this.logger.error(message, { context });
    }
  }

  /**
   * Fatal level logging (maps to error in Winston)
   */
  public fatal(message: string, error?: Error | any, context?: LogContext): void {
    this.error(`FATAL: ${message}`, error, context);
  }

  /**
   * Log with custom level
   */
  public log(level: string, message: string, context?: LogContext): void {
    this.logger.log(level, message, { context });
  }

  /**
   * Performance logging
   */
  public performance(operation: string, duration: number, context?: LogContext): void {
    this.logger.info(`Performance: ${operation}`, {
      ...context,
      performance: {
        operation,
        duration,
        unit: 'ms'
      }
    });
  }

  /**
   * Security event logging
   */
  public security(event: string, context?: LogContext): void {
    this.logger.warn(`Security Event: ${event}`, {
      ...context,
      security: true,
      event
    });
  }

  /**
   * Audit logging
   */
  public audit(action: string, userId?: string, context?: LogContext): void {
    this.logger.info(`Audit: ${action}`, {
      ...context,
      audit: true,
      action,
      userId
    });
  }

  /**
   * Business logic logging
   */
  public business(event: string, context?: LogContext): void {
    this.logger.info(`Business Event: ${event}`, {
      ...context,
      business: true,
      event
    });
  }

  /**
   * HTTP request logging
   */
  public http(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    
    this.logger.log(level, `${method} ${url} ${statusCode}`, {
      ...context,
      http: {
        method,
        url,
        statusCode,
        responseTime
      }
    });
  }

  /**
   * Database operation logging
   */
  public database(operation: string, table?: string, duration?: number, context?: LogContext): void {
    this.logger.debug(`Database: ${operation}`, {
      ...context,
      database: {
        operation,
        table,
        duration
      }
    });
  }

  /**
   * External API logging
   */
  public external(service: string, operation: string, duration?: number, success?: boolean, context?: LogContext): void {
    const level = success === false ? 'warn' : 'info';
    
    this.logger.log(level, `External API: ${service} ${operation}`, {
      ...context,
      external: {
        service,
        operation,
        duration,
        success
      }
    });
  }

  /**
   * Job/Task logging
   */
  public job(jobType: string, jobId: string, status: string, duration?: number, context?: LogContext): void {
    const level = status === 'failed' ? 'error' : status === 'completed' ? 'info' : 'debug';
    
    this.logger.log(level, `Job: ${jobType} ${status}`, {
      ...context,
      job: {
        type: jobType,
        id: jobId,
        status,
        duration
      }
    });
  }

  /**
   * Create child logger with additional context
   */
  public child(additionalContext: LogContext): LoggerService {
    const childLogger = new LoggerService(this.serviceName);
    
    // Override logger methods to include additional context
    const originalMethods = ['debug', 'info', 'warn', 'error', 'fatal'];
    
    originalMethods.forEach(method => {
      const originalMethod = (childLogger as any)[method].bind(childLogger);
      (childLogger as any)[method] = (message: string, context?: LogContext) => {
        originalMethod(message, { ...additionalContext, ...context });
      };
    });

    return childLogger;
  }

  /**
   * Create timer for performance measurement
   */
  public timer(operation: string, context?: LogContext) {
    const startTime = Date.now();
    
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.performance(operation, duration, context);
        return duration;
      }
    };
  }

  /**
   * Log request/response for debugging
   */
  public trace(message: string, data: any, context?: LogContext): void {
    this.logger.debug(`Trace: ${message}`, {
      ...context,
      trace: data
    });
  }

  /**
   * Structured health check logging
   */
  public health(component: string, status: 'healthy' | 'unhealthy', details?: any, context?: LogContext): void {
    const level = status === 'unhealthy' ? 'warn' : 'info';
    
    this.logger.log(level, `Health Check: ${component} is ${status}`, {
      ...context,
      health: {
        component,
        status,
        details
      }
    });
  }

  /**
   * Get Winston logger instance (for direct access if needed)
   */
  public getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Set log level dynamically
   */
  public setLevel(level: string): void {
    this.logger.level = level;
  }

  /**
   * Get current log level
   */
  public getLevel(): string {
    return this.logger.level;
  }

  /**
   * Check if logging is enabled for a level
   */
  public isLevelEnabled(level: string): boolean {
    return this.logger.isLevelEnabled(level);
  }

  /**
   * Flush all logs (useful for testing)
   */
  public async flush(): Promise<void> {
    return new Promise((resolve) => {
      // Winston doesn't have a built-in flush, but we can end all transports
      const transports = this.logger.transports;
      let remaining = transports.length;
      
      if (remaining === 0) {
        resolve();
        return;
      }

      transports.forEach(transport => {
        if ('close' in transport && typeof transport.close === 'function') {
          transport.close(() => {
            remaining--;
            if (remaining === 0) resolve();
          });
        } else {
          remaining--;
          if (remaining === 0) resolve();
        }
      });
    });
  }

  /**
   * Cleanup logger resources
   */
  public async cleanup(): Promise<void> {
    await this.flush();
    this.logger.close();
  }
}

// Create default logger instance
export const logger = new LoggerService();

export default LoggerService;