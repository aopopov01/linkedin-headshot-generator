/**
 * Error Handler Middleware
 * 
 * Centralized error handling middleware for the OmniShot backend.
 * Handles all types of errors, formats responses, and provides debugging information.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { LoggerService } from '../services/logger.service';
import { MonitoringService } from '../services/monitoring.service';
import { APIError, DatabaseError, AuthenticationError, ValidationError as CustomValidationError } from '../utils/errors';

interface ErrorContext {
  requestId?: string;
  userId?: string;
  path: string;
  method: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: string;
}

export class ErrorHandler {
  private static logger = new LoggerService('ErrorHandler');

  /**
   * Main error handling middleware
   */
  public static handle(error: any, req: Request, res: Response, next: NextFunction): void {
    const context: ErrorContext = {
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.id,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    };

    // Log error with context
    ErrorHandler.logError(error, context);

    // Track error in monitoring
    ErrorHandler.trackError(error, context);

    // Handle different error types
    if (error instanceof APIError) {
      ErrorHandler.handleAPIError(error, res);
    } else if (error instanceof DatabaseError) {
      ErrorHandler.handleDatabaseError(error, res);
    } else if (error instanceof AuthenticationError) {
      ErrorHandler.handleAuthenticationError(error, res);
    } else if (error instanceof CustomValidationError) {
      ErrorHandler.handleValidationError(error, res);
    } else if (error.name === 'ValidationError') {
      ErrorHandler.handleMongooseValidationError(error, res);
    } else if (error.name === 'CastError') {
      ErrorHandler.handleCastError(error, res);
    } else if (error.name === 'JsonWebTokenError') {
      ErrorHandler.handleJWTError(error, res);
    } else if (error.name === 'TokenExpiredError') {
      ErrorHandler.handleTokenExpiredError(error, res);
    } else if (error.name === 'MulterError') {
      ErrorHandler.handleMulterError(error, res);
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      ErrorHandler.handleFileSizeError(error, res);
    } else if (error.code === 'ECONNREFUSED') {
      ErrorHandler.handleConnectionError(error, res);
    } else if (error.code === 'ENOTFOUND') {
      ErrorHandler.handleNotFoundError(error, res);
    } else {
      ErrorHandler.handleGenericError(error, res);
    }
  }

  /**
   * Handle API errors
   */
  private static handleAPIError(error: APIError, res: Response): void {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  /**
   * Handle database errors
   */
  private static handleDatabaseError(error: DatabaseError, res: Response): void {
    let statusCode = 500;
    let message = 'Database operation failed';

    // Handle specific database error types
    if (error.message.includes('unique constraint')) {
      statusCode = 409;
      message = 'Resource already exists';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      message = 'Resource not found';
    } else if (error.message.includes('foreign key constraint')) {
      statusCode = 400;
      message = 'Invalid reference to related resource';
    }

    res.status(statusCode).json({
      success: false,
      error: message,
      code: 'DATABASE_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        originalError: error.message,
        stack: error.stack 
      })
    });
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthenticationError(error: AuthenticationError, res: Response): void {
    res.status(401).json({
      success: false,
      error: error.message,
      code: 'AUTHENTICATION_ERROR'
    });
  }

  /**
   * Handle validation errors
   */
  private static handleValidationError(error: CustomValidationError, res: Response): void {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.details
    });
  }

  /**
   * Handle Mongoose validation errors
   */
  private static handleMongooseValidationError(error: any, res: Response): void {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors
    });
  }

  /**
   * Handle cast errors (invalid ObjectId, etc.)
   */
  private static handleCastError(error: any, res: Response): void {
    res.status(400).json({
      success: false,
      error: `Invalid ${error.path}: ${error.value}`,
      code: 'CAST_ERROR'
    });
  }

  /**
   * Handle JWT errors
   */
  private static handleJWTError(error: any, res: Response): void {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  /**
   * Handle JWT token expired errors
   */
  private static handleTokenExpiredError(error: any, res: Response): void {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  /**
   * Handle Multer errors (file upload)
   */
  private static handleMulterError(error: any, res: Response): void {
    let message = 'File upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
    }

    res.status(statusCode).json({
      success: false,
      error: message,
      code: 'UPLOAD_ERROR'
    });
  }

  /**
   * Handle file size errors
   */
  private static handleFileSizeError(error: any, res: Response): void {
    res.status(413).json({
      success: false,
      error: 'File too large',
      code: 'FILE_TOO_LARGE'
    });
  }

  /**
   * Handle connection errors
   */
  private static handleConnectionError(error: any, res: Response): void {
    res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  /**
   * Handle not found errors
   */
  private static handleNotFoundError(error: any, res: Response): void {
    res.status(502).json({
      success: false,
      error: 'External service not found',
      code: 'EXTERNAL_SERVICE_ERROR'
    });
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(error: any, res: Response): void {
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && { 
        type: error.name,
        stack: error.stack 
      })
    });
  }

  /**
   * Log error with context
   */
  private static logError(error: any, context: ErrorContext): void {
    const logLevel = ErrorHandler.getLogLevel(error);
    const message = `${error.name || 'Error'}: ${error.message}`;

    ErrorHandler.logger.log(logLevel, message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode || 500
      },
      context
    });
  }

  /**
   * Track error in monitoring system
   */
  private static trackError(error: any, context: ErrorContext): void {
    try {
      MonitoringService.getInstance().trackError({
        type: error.name || 'UnknownError',
        message: error.message,
        statusCode: error.statusCode || 500,
        path: context.path,
        method: context.method,
        userId: context.userId,
        timestamp: context.timestamp,
        stack: error.stack
      });
    } catch (monitoringError) {
      ErrorHandler.logger.error('Failed to track error in monitoring system:', monitoringError);
    }
  }

  /**
   * Determine appropriate log level for error
   */
  private static getLogLevel(error: any): string {
    if (error.statusCode && error.statusCode < 500) {
      return 'warn';
    }

    if (error.name === 'ValidationError' || error.statusCode === 400) {
      return 'warn';
    }

    if (error.name === 'UnauthorizedError' || error.statusCode === 401) {
      return 'warn';
    }

    return 'error';
  }

  /**
   * Handle async route errors
   */
  public static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handle uncaught exceptions
   */
  public static handleUncaughtException(error: Error): void {
    ErrorHandler.logger.fatal('Uncaught Exception:', error, {
      process: 'main',
      pid: process.pid
    });

    // Perform graceful shutdown
    process.exit(1);
  }

  /**
   * Handle unhandled promise rejections
   */
  public static handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    ErrorHandler.logger.fatal('Unhandled Rejection:', reason, {
      promise: promise.toString(),
      process: 'main',
      pid: process.pid
    });

    // Perform graceful shutdown
    process.exit(1);
  }

  /**
   * Create error response for specific scenarios
   */
  public static createErrorResponse(
    statusCode: number,
    message: string,
    code?: string,
    details?: any
  ): object {
    return {
      success: false,
      error: message,
      ...(code && { code }),
      ...(details && { details })
    };
  }

  /**
   * Sanitize error for logging (remove sensitive data)
   */
  public static sanitizeError(error: any): any {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    const sanitizedError = { ...error };

    // Remove sensitive fields from error data
    sensitiveFields.forEach(field => {
      if (sanitizedError[field]) {
        sanitizedError[field] = '[REDACTED]';
      }
    });

    // Sanitize nested objects
    if (sanitizedError.data && typeof sanitizedError.data === 'object') {
      sensitiveFields.forEach(field => {
        if (sanitizedError.data[field]) {
          sanitizedError.data[field] = '[REDACTED]';
        }
      });
    }

    return sanitizedError;
  }

  /**
   * Format validation errors from express-validator
   */
  public static formatValidationErrors(errors: ValidationError[]): object {
    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }))
    };
  }

  /**
   * Check if error should trigger alert
   */
  public static shouldAlert(error: any): boolean {
    // Alert for server errors, database connection issues, etc.
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }

    if (error.name === 'DatabaseConnectionError') {
      return true;
    }

    if (error.name === 'RedisConnectionError') {
      return true;
    }

    return false;
  }
}

// Export as middleware function
export const errorHandler = ErrorHandler.handle;

// Export utility methods
export const asyncHandler = ErrorHandler.asyncHandler;
export const createErrorResponse = ErrorHandler.createErrorResponse;
export const formatValidationErrors = ErrorHandler.formatValidationErrors;

export default ErrorHandler;