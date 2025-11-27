/**
 * MAN-03: Structured Logging Service
 * Provides consistent, structured logging across the application
 */

import { Injectable, LoggerService, Scope } from '@nestjs/common';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Service or module name */
  service?: string;
  /** Method or action name */
  action?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Entity type (e.g., 'Registration', 'Workflow') */
  entityType?: string;
  /** Entity ID */
  entityId?: string;
  /** Duration in milliseconds for performance logging */
  durationMs?: number;
  /** Additional metadata */
  [key: string]: unknown;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService implements LoggerService {
  private context?: string;
  private requestId?: string;
  private userId?: string;

  /**
   * Set the context (service/module name)
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Set request ID for tracing
   */
  setRequestId(requestId: string): this {
    this.requestId = requestId;
    return this;
  }

  /**
   * Set user ID for audit trail
   */
  setUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  /**
   * Create child logger with inherited context
   */
  child(additionalContext: Partial<LogContext>): StructuredLoggerService {
    const child = new StructuredLoggerService();
    child.context = additionalContext.service || this.context;
    child.requestId = this.requestId;
    child.userId = additionalContext.userId || this.userId;
    return child;
  }

  /**
   * Format and output a structured log
   */
  private formatLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    const structuredLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: context?.service || this.context,
        requestId: context?.requestId || this.requestId,
        userId: context?.userId || this.userId,
        ...context,
      },
    };

    if (error) {
      structuredLog.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      };
    }

    // Remove undefined values for cleaner output
    Object.keys(structuredLog.context).forEach((key) => {
      if (structuredLog.context[key] === undefined) {
        delete structuredLog.context[key];
      }
    });

    // Output as JSON in production, formatted in development
    const output =
      process.env.NODE_ENV === 'production'
        ? JSON.stringify(structuredLog)
        : this.formatForDevelopment(structuredLog);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (process.env.LOG_LEVEL === 'debug') {
          console.debug(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  /**
   * Format log for development (human-readable)
   */
  private formatForDevelopment(log: StructuredLog): string {
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const dim = '\x1b[2m';

    const levelStr = `${levelColors[log.level]}[${log.level.toUpperCase()}]${reset}`;
    const timeStr = `${dim}${log.timestamp}${reset}`;
    const serviceStr = log.context.service ? `[${log.context.service}]` : '';
    const requestStr = log.context.requestId ? `${dim}(${log.context.requestId})${reset}` : '';

    let output = `${timeStr} ${levelStr} ${serviceStr} ${log.message} ${requestStr}`;

    // Add relevant context
    const contextKeys = Object.keys(log.context).filter(
      (k) => !['service', 'requestId'].includes(k) && log.context[k] !== undefined,
    );
    if (contextKeys.length > 0) {
      const contextStr = contextKeys
        .map((k) => `${k}=${JSON.stringify(log.context[k])}`)
        .join(' ');
      output += `\n  ${dim}${contextStr}${reset}`;
    }

    // Add error details
    if (log.error) {
      output += `\n  ${levelColors.error}Error: ${log.error.message}${reset}`;
      if (log.error.stack) {
        output += `\n  ${dim}${log.error.stack}${reset}`;
      }
    }

    return output;
  }

  // ==========================================
  // NestJS LoggerService Interface
  // ==========================================

  log(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.formatLog('info', message, { service: context });
    } else {
      this.formatLog('info', message, context);
    }
  }

  error(message: string, trace?: string, context?: string): void;
  error(message: string, error?: Error, context?: LogContext): void;
  error(
    message: string,
    traceOrError?: string | Error,
    context?: string | LogContext,
  ): void {
    const error =
      traceOrError instanceof Error
        ? traceOrError
        : traceOrError
          ? new Error(traceOrError)
          : undefined;
    const ctx =
      typeof context === 'string' ? { service: context } : context || {};
    this.formatLog('error', message, ctx, error);
  }

  warn(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.formatLog('warn', message, { service: context });
    } else {
      this.formatLog('warn', message, context);
    }
  }

  debug(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.formatLog('debug', message, { service: context });
    } else {
      this.formatLog('debug', message, context);
    }
  }

  verbose(message: string, context?: string | LogContext): void {
    // Map verbose to debug
    this.debug(message, context);
  }

  // ==========================================
  // Enhanced Logging Methods
  // ==========================================

  /**
   * Log an action with entity information
   */
  logAction(
    action: string,
    entityType: string,
    entityId: string,
    context?: Partial<LogContext>,
  ): void {
    this.formatLog('info', `${action} ${entityType}`, {
      action,
      entityType,
      entityId,
      ...context,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    action: string,
    durationMs: number,
    context?: Partial<LogContext>,
  ): void {
    const level: LogLevel = durationMs > 5000 ? 'warn' : 'info';
    this.formatLog(level, `${action} completed`, {
      action,
      durationMs,
      ...context,
    });
  }

  /**
   * Log security-related events
   */
  logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: Partial<LogContext>,
  ): void {
    const level: LogLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.formatLog(level, `Security Event: ${event}`, {
      securityEvent: event,
      severity,
      ...context,
    });
  }

  /**
   * Log workflow events
   */
  logWorkflow(
    event: string,
    registrationId: string,
    details?: Record<string, unknown>,
  ): void {
    this.formatLog('info', `Workflow: ${event}`, {
      action: 'workflow',
      entityType: 'Registration',
      entityId: registrationId,
      ...details,
    });
  }

  /**
   * Log API request/response
   */
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: Partial<LogContext>,
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.formatLog(level, `${method} ${path} ${statusCode}`, {
      httpMethod: method,
      httpPath: path,
      httpStatus: statusCode,
      durationMs,
      ...context,
    });
  }

  /**
   * Log database operations
   */
  logDatabase(
    operation: string,
    table: string,
    durationMs?: number,
    context?: Partial<LogContext>,
  ): void {
    this.formatLog('debug', `DB: ${operation} on ${table}`, {
      dbOperation: operation,
      dbTable: table,
      durationMs,
      ...context,
    });
  }

  /**
   * Log integration events (Protheus, etc.)
   */
  logIntegration(
    system: string,
    event: string,
    success: boolean,
    context?: Partial<LogContext>,
  ): void {
    const level: LogLevel = success ? 'info' : 'error';
    this.formatLog(level, `Integration [${system}]: ${event}`, {
      integrationSystem: system,
      integrationEvent: event,
      success,
      ...context,
    });
  }
}

/**
 * Factory function to create a logger for a specific service
 */
export function createLogger(serviceName: string): StructuredLoggerService {
  return new StructuredLoggerService().setContext(serviceName);
}
