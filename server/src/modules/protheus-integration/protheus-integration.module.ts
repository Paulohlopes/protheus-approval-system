import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProtheusIntegrationController } from './protheus-integration.controller';
import { ProtheusIntegrationService } from './protheus-integration.service';

@Module({
  imports: [HttpModule],
  controllers: [ProtheusIntegrationController],
  providers: [ProtheusIntegrationService],
  exports: [ProtheusIntegrationService], // Export to be used by Registration module
})
export class ProtheusIntegrationModule {}
