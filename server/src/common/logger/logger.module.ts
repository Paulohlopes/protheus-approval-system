/**
 * MAN-03: Logger Module
 * Provides structured logging throughout the application
 */

import { Global, Module } from '@nestjs/common';
import { StructuredLoggerService } from './structured-logger.service';

@Global()
@Module({
  providers: [StructuredLoggerService],
  exports: [StructuredLoggerService],
})
export class LoggerModule {}
