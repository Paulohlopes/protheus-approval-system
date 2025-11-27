/**
 * MAN-04: Health Check Service
 * Performs health checks on application dependencies
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HEALTH_CHECK_CONFIG } from '../../config/constants';
import {
  HealthStatus,
  HealthCheckResult,
  DatabaseHealthCheck,
  MemoryHealthCheck,
} from '../../types';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get detailed health status of all dependencies
   */
  async getDetailedHealth(): Promise<HealthCheckResult> {
    const [database, memory] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    // Determine overall status
    const statuses = [database.status, memory.status];
    let overallStatus: HealthStatus = 'healthy';

    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database,
        memory,
      },
    };
  }

  /**
   * Get readiness status for Kubernetes/load balancer probes
   */
  async getReadinessStatus(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    const database = await this.checkDatabase();

    const checks = {
      database: database.status !== 'unhealthy',
    };

    return {
      ready: Object.values(checks).every(Boolean),
      checks,
    };
  }

  /**
   * Check database connectivity and response time
   */
  private async checkDatabase(): Promise<DatabaseHealthCheck> {
    const start = Date.now();

    try {
      // Simple query to check connectivity
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      const responseTime = Date.now() - start;

      let status: HealthStatus = 'healthy';
      let message: string | undefined;

      if (responseTime > HEALTH_CHECK_CONFIG.DB_RESPONSE_CRITICAL) {
        status = 'unhealthy';
        message = `Database response time critical: ${responseTime}ms`;
        this.logger.error(message);
      } else if (responseTime > HEALTH_CHECK_CONFIG.DB_RESPONSE_WARNING) {
        status = 'degraded';
        message = `Database response time slow: ${responseTime}ms`;
        this.logger.warn(message);
      }

      return {
        status,
        responseTime,
        message,
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      this.logger.error('Database health check failed', error);

      return {
        status: 'unhealthy',
        responseTime,
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): MemoryHealthCheck {
    const used = process.memoryUsage();
    const totalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usedMB = Math.round(used.heapUsed / 1024 / 1024);
    const percentUsed = Math.round((usedMB / totalMB) * 100);

    let status: HealthStatus = 'healthy';

    if (percentUsed >= HEALTH_CHECK_CONFIG.MEMORY_THRESHOLD_CRITICAL) {
      status = 'unhealthy';
      this.logger.error(`Memory usage critical: ${percentUsed}%`);
    } else if (percentUsed >= HEALTH_CHECK_CONFIG.MEMORY_THRESHOLD_WARNING) {
      status = 'degraded';
      this.logger.warn(`Memory usage high: ${percentUsed}%`);
    }

    return {
      status,
      usedMB,
      totalMB,
      percentUsed,
    };
  }
}
