import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormTemplateController } from './form-template.controller';
import { FormTemplateService } from './form-template.service';
import { DataSourceService } from './services/data-source.service';
import { Sx3Module } from '../sx3/sx3.module';

@Module({
  imports: [
    Sx3Module, // Import Sx3Module to use Sx3Service
  ],
  controllers: [FormTemplateController],
  providers: [FormTemplateService, DataSourceService],
  exports: [FormTemplateService, DataSourceService], // Export to be used by other modules
})
export class FormTemplateModule {}
