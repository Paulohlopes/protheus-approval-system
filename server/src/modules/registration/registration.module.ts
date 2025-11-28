import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { ProtheusIntegrationModule } from '../protheus-integration/protheus-integration.module';
import { ApprovalGroupsModule } from '../approval-groups/approval-groups.module';
import { ProtheusDataModule } from '../protheus-data/protheus-data.module';

@Module({
  imports: [ProtheusIntegrationModule, ApprovalGroupsModule, ProtheusDataModule],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService], // Export to be used by other modules
})
export class RegistrationModule {}
