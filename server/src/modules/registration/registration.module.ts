import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { BulkImportService } from './services/bulk-import.service';
import { ProtheusIntegrationModule } from '../protheus-integration/protheus-integration.module';
import { ApprovalGroupsModule } from '../approval-groups/approval-groups.module';
import { ProtheusDataModule } from '../protheus-data/protheus-data.module';
import { CountryModule } from '../country/country.module';

@Module({
  imports: [ProtheusIntegrationModule, ApprovalGroupsModule, ProtheusDataModule, CountryModule],
  controllers: [RegistrationController],
  providers: [RegistrationService, BulkImportService],
  exports: [RegistrationService, BulkImportService],
})
export class RegistrationModule {}
