import { Module } from '@nestjs/common';
import { ProtheusDataController } from './protheus-data.controller';
import { ProtheusDataService } from './protheus-data.service';
import { Sx3Module } from '../sx3/sx3.module';

@Module({
  imports: [Sx3Module],
  controllers: [ProtheusDataController],
  providers: [ProtheusDataService],
  exports: [ProtheusDataService],
})
export class ProtheusDataModule {}
