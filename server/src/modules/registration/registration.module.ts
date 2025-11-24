import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { ProtheusIntegrationModule } from '../protheus-integration/protheus-integration.module';

@Module({
  imports: [ProtheusIntegrationModule],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService], // Export to be used by other modules
})
export class RegistrationModule {}
