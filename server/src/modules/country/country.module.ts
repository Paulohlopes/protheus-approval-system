import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CountryController } from './country.controller';
import { CountryService } from './country.service';
import { ConnectionManagerService } from './connection-manager.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [CountryController],
  providers: [CountryService, ConnectionManagerService],
  exports: [CountryService, ConnectionManagerService],
})
export class CountryModule {}
