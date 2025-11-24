import { Controller, Get, Post, Param } from '@nestjs/common';
import { ProtheusIntegrationService } from './protheus-integration.service';

@Controller('protheus-integration')
export class ProtheusIntegrationController {
  constructor(
    private readonly protheusIntegrationService: ProtheusIntegrationService,
  ) {}

  /**
   * Test connection to Protheus
   */
  @Get('test-connection')
  testConnection() {
    return this.protheusIntegrationService.testConnection();
  }

  /**
   * Manually trigger sync for a registration
   */
  @Post('sync/:registrationId')
  syncRegistration(@Param('registrationId') registrationId: string) {
    return this.protheusIntegrationService.syncToProtheus(registrationId);
  }
}
