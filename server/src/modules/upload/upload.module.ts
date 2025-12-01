import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(), // Store in memory for validation before saving
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max (actual limit per field is enforced in service)
        files: 10, // Max files per request
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
