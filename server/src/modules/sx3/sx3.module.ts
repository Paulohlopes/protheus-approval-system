import { Module } from '@nestjs/common';
import { Sx3Controller } from './sx3.controller';
import { Sx3Service } from './sx3.service';
import { CountryModule } from '../country/country.module';

@Module({
  imports: [
    CountryModule, // For ConnectionManager and CountryService
  ],
  controllers: [Sx3Controller],
  providers: [Sx3Service],
  exports: [Sx3Service], // Export to be used by other modules
})
export class Sx3Module {}
