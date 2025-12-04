import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProtheusIntegrationController } from './protheus-integration.controller';
import { ProtheusIntegrationService } from './protheus-integration.service';
import { CountryModule } from '../country/country.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => CountryModule), // For SQL-based record checks
  ],
  controllers: [ProtheusIntegrationController],
  providers: [ProtheusIntegrationService],
  exports: [ProtheusIntegrationService], // Export to be used by Registration module
})
export class ProtheusIntegrationModule {}
