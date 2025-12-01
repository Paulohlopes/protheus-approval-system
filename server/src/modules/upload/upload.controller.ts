import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Res,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';

// 100MB max for initial validation (actual limit per field is in attachmentConfig)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload a file for a registration field
   */
  @Post('registrations/:registrationId/fields/:fieldName')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('registrationId') registrationId: string,
    @Param('fieldName') fieldName: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    this.logger.log(
      `Upload request: ${file.originalname} (${file.size} bytes) for registration ${registrationId}, field ${fieldName}`,
    );

    // Get attachment config for the field
    const attachmentConfig = await this.uploadService.getAttachmentConfig(
      registrationId,
      fieldName,
    );

    return this.uploadService.uploadFile(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      registrationId,
      fieldName,
      req.user?.id || 'anonymous',
      attachmentConfig || undefined,
    );
  }

  /**
   * Delete a file
   */
  @Delete(':attachmentId')
  async deleteFile(
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
  ) {
    return this.uploadService.deleteFile(
      attachmentId,
      req.user?.id || 'anonymous',
    );
  }

  /**
   * Get attachments for a registration
   */
  @Get('registrations/:registrationId')
  async getAttachments(
    @Param('registrationId') registrationId: string,
    @Query('fieldName') fieldName?: string,
  ) {
    return this.uploadService.getAttachments(registrationId, fieldName);
  }

  /**
   * Download a file
   */
  @Get(':attachmentId/download')
  async downloadFile(
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { filePath, originalName, mimeType } =
      await this.uploadService.getAttachmentFilePath(attachmentId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(originalName)}"`,
    );

    res.download(filePath, originalName, (err) => {
      if (err) {
        this.logger.error(`Error downloading file: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erro ao baixar arquivo' });
        }
      }
    });
  }

  /**
   * Get file info without downloading
   */
  @Get(':attachmentId')
  async getAttachment(@Param('attachmentId') attachmentId: string) {
    const attachment = await this.uploadService.getAttachment(attachmentId);
    return {
      id: attachment.id,
      registrationId: attachment.registrationId,
      fieldName: attachment.fieldName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      uploadedAt: attachment.uploadedAt,
    };
  }
}
