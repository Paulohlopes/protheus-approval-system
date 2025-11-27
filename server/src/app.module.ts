import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { Sx3Module } from './modules/sx3/sx3.module';
import { FormTemplateModule } from './modules/form-template/form-template.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { ProtheusIntegrationModule } from './modules/protheus-integration/protheus-integration.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApprovalGroupsModule } from './modules/approval-groups/approval-groups.module';
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
    Sx3Module,
    FormTemplateModule,
    ProtheusIntegrationModule,
    RegistrationModule,
    ApprovalGroupsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ProtheusJwtAuthGuard,
    },
  ],
})
export class AppModule {}
