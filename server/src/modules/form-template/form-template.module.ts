import { Module } from '@nestjs/common';
import { FormTemplateController } from './form-template.controller';
import { FormTemplateService } from './form-template.service';
import { DataSourceService } from './services/data-source.service';
import { LookupService } from './services/lookup.service';
import { AllowedTablesService } from './services/allowed-tables.service';
import { Sx3Module } from '../sx3/sx3.module';
import { CountryModule } from '../country/country.module';

@Module({
  imports: [
    Sx3Module,      // Import Sx3Module to use Sx3Service
    CountryModule,  // For ConnectionManager and CountryService
  ],
  controllers: [FormTemplateController],
  providers: [FormTemplateService, DataSourceService, LookupService, AllowedTablesService],
  exports: [FormTemplateService, DataSourceService, LookupService, AllowedTablesService],
})
export class FormTemplateModule {}
