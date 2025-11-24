import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProtheusTokenStrategy } from './strategies/protheus-token.strategy';
import { ProtheusJwtAuthGuard } from './guards/protheus-jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'protheus-token' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ProtheusTokenStrategy, ProtheusJwtAuthGuard],
  exports: [AuthService, ProtheusJwtAuthGuard],
})
export class AuthModule {}
