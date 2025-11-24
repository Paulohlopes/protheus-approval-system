import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sx3Controller } from './sx3.controller';
import { Sx3Service } from './sx3.service';
import { Sx3 } from './entities/sx3.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sx3], 'protheusConnection'),
  ],
  controllers: [Sx3Controller],
  providers: [Sx3Service],
  exports: [Sx3Service], // Export to be used by other modules
})
export class Sx3Module {}
