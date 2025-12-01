import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { Sx3Module } from './modules/sx3/sx3.module';
import { FormTemplateModule } from './modules/form-template/form-template.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { ProtheusIntegrationModule } from './modules/protheus-integration/protheus-integration.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApprovalGroupsModule } from './modules/approval-groups/approval-groups.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';
import { ProtheusDataModule } from './modules/protheus-data/protheus-data.module';
import { UploadModule } from './modules/upload/upload.module';
import { LoggerModule } from './common/logger';
import { ProtheusJwtAuthGuard } from './modules/auth/guards/protheus-jwt-auth.guard';
import { Sx3 } from './modules/sx3/entities/sx3.entity';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Schedule (for cron jobs)
    ScheduleModule.forRoot(),

    // SEC-04: Rate limiting (100 requests per minute per IP)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Prisma (PostgreSQL - Application Database)
    PrismaModule,

    // TypeORM (SQL Server - Protheus Database Read-Only)
    TypeOrmModule.forRootAsync({
      name: 'protheusConnection',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get('PROTHEUS_DB_HOST'),
        port: parseInt(configService.get('PROTHEUS_DB_PORT') || '1433'),
        username: configService.get('PROTHEUS_DB_USERNAME'),
        password: configService.get('PROTHEUS_DB_PASSWORD'),
        database: configService.get('PROTHEUS_DB_DATABASE'),
        entities: [Sx3], // Explicitly list entities instead of using glob pattern
        synchronize: false, // NEVER sync with Protheus database!
        logging: configService.get('NODE_ENV') === 'development',
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        extra: {
          validateConnection: false,
        },
      }),
      inject: [ConfigService],
    }),

    // Application Modules
    AuthModule,
    SettingsModule, // SEC-01: Global settings with encryption
    HealthModule,   // MAN-04: Health check endpoints
    LoggerModule,   // MAN-03: Structured logging
    Sx3Module,
    FormTemplateModule,
    ProtheusIntegrationModule,
    ProtheusDataModule,
    UploadModule,        // File upload handling
    RegistrationModule,
    ApprovalGroupsModule,
  ],
  controllers: [],
  providers: [
    // SEC-04: Rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Authentication guard
    {
      provide: APP_GUARD,
      useClass: ProtheusJwtAuthGuard,
    },
  ],
})
export class AppModule {}
