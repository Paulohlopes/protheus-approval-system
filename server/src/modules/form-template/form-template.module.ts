import { Module } from '@nestjs/common';
import { FormTemplateController } from './form-template.controller';
import { FormTemplateService } from './form-template.service';
import { Sx3Module } from '../sx3/sx3.module';

@Module({
  imports: [Sx3Module], // Import Sx3Module to use Sx3Service
  controllers: [FormTemplateController],
  providers: [FormTemplateService],
  exports: [FormTemplateService], // Export to be used by other modules
})
export class FormTemplateModule {}
