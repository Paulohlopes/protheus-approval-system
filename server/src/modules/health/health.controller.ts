/**
 * MAN-04: Health Check Controller
 * Provides endpoints for monitoring application health
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check simples', description: 'Retorna 200 se o servidor está rodando' })
  @ApiResponse({ status: 200, description: 'Servidor funcionando' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('detailed')
  @Public()
  @ApiOperation({ summary: 'Health check detalhado', description: 'Verifica todas as dependências (DB, memória)' })
  @ApiResponse({ status: 200, description: 'Status detalhado de saúde' })
  async checkDetailed() {
    return this.healthService.getDetailedHealth();
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe', description: 'Verifica se a aplicação está viva (para Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Aplicação está viva' })
  live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe', description: 'Verifica se a aplicação está pronta para receber tráfego' })
  @ApiResponse({ status: 200, description: 'Aplicação está pronta' })
  async ready() {
    return this.healthService.getReadinessStatus();
  }
}
