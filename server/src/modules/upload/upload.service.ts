import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  AttachmentConfigDto,
  getAttachmentConfigWithDefaults,
} from '../form-template/dto/attachment-config.dto';

// File signature validation (magic bytes)
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])], // GIF8
  'application/msword': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0])], // DOC (OLE)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    Buffer.from([0x50, 0x4b, 0x03, 0x04]), // DOCX (ZIP)
  ],
  'application/vnd.ms-excel': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0])], // XLS (OLE)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    Buffer.from([0x50, 0x4b, 0x03, 0x04]), // XLSX (ZIP)
  ],
};

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadPath: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadPath =
      this.configService.get('UPLOAD_PATH') || path.join(process.cwd(), 'uploads');

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  /**
   * Upload a file for a registration field
   */
  async uploadFile(
    file: UploadedFile,
    registrationId: string,
    fieldName: string,
    userId: string,
    attachmentConfig?: AttachmentConfigDto,
  ) {
    this.logger.log(
      `Uploading file ${file.originalname} for registration ${registrationId}, field ${fieldName}`,
    );

    const config = getAttachmentConfigWithDefaults(attachmentConfig);

    // Validate file type
    if (!config.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido: ${file.mimetype}. Tipos aceitos: ${config.allowedTypes.join(', ')}`,
      );
    }

    // Validate file signature (magic bytes)
    if (!this.validateFileSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        'O conteúdo do arquivo não corresponde ao tipo declarado',
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
      );
    }

    // Check existing attachments count
    const existingCount = await this.prisma.fieldAttachment.count({
      where: {
        registrationId,
        fieldName,
        deletedAt: null,
      },
    });

    if (existingCount >= config.maxFiles) {
      throw new BadRequestException(
        `Limite de ${config.maxFiles} arquivos atingido para este campo`,
      );
    }

    // Generate unique file name
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const sanitizedExt = this.sanitizeExtension(ext);
    const fileName = `${hash}${sanitizedExt}`;

    // Create directory structure: uploads/{registrationId}/{fieldName}/
    const fileDir = path.join(this.uploadPath, registrationId, fieldName);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    const fullPath = path.join(fileDir, fileName);

    // Save file to disk
    try {
      fs.writeFileSync(fullPath, file.buffer);
    } catch (error) {
      this.logger.error(`Error saving file: ${error.message}`);
      throw new BadRequestException('Erro ao salvar arquivo');
    }

    // Create database record
    const attachment = await this.prisma.fieldAttachment.create({
      data: {
        registrationId,
        fieldName,
        fileName,
        originalName: this.sanitizeFileName(file.originalname),
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: fullPath,
        uploadedById: userId,
      },
    });

    this.logger.log(`File uploaded successfully: ${attachment.id}`);

    return {
      id: attachment.id,
      registrationId: attachment.registrationId,
      fieldName: attachment.fieldName,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      uploadedAt: attachment.uploadedAt,
    };
  }

  /**
   * Delete a file (soft delete)
   */
  async deleteFile(attachmentId: string, userId: string) {
    this.logger.log(`Deleting file ${attachmentId} by user ${userId}`);

    const attachment = await this.prisma.fieldAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    if (attachment.deletedAt) {
      throw new BadRequestException('Arquivo já foi deletado');
    }

    // Soft delete - keep file for audit
    await this.prisma.fieldAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`File ${attachmentId} soft deleted`);

    return { success: true, message: 'Arquivo deletado com sucesso' };
  }

  /**
   * Get attachments for a registration
   */
  async getAttachments(registrationId: string, fieldName?: string) {
    const where: any = {
      registrationId,
      deletedAt: null,
    };

    if (fieldName) {
      where.fieldName = fieldName;
    }

    const attachments = await this.prisma.fieldAttachment.findMany({
      where,
      orderBy: { uploadedAt: 'asc' },
      select: {
        id: true,
        registrationId: true,
        fieldName: true,
        fileName: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        uploadedById: true,
        uploadedAt: true,
      },
    });

    return attachments;
  }

  /**
   * Get a single attachment by ID
   */
  async getAttachment(attachmentId: string) {
    const attachment = await this.prisma.fieldAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    if (attachment.deletedAt) {
      throw new NotFoundException('Arquivo foi deletado');
    }

    return attachment;
  }

  /**
   * Get attachment file path for download
   */
  async getAttachmentFilePath(attachmentId: string): Promise<{
    filePath: string;
    originalName: string;
    mimeType: string;
  }> {
    const attachment = await this.getAttachment(attachmentId);

    // Verify file exists
    if (!fs.existsSync(attachment.filePath)) {
      this.logger.error(`File not found on disk: ${attachment.filePath}`);
      throw new NotFoundException('Arquivo não encontrado no servidor');
    }

    return {
      filePath: attachment.filePath,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }

  /**
   * Get attachment config for a field
   */
  async getAttachmentConfig(
    registrationId: string,
    fieldName: string,
  ): Promise<AttachmentConfigDto | null> {
    // Get registration to find template
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: {
        template: {
          include: {
            fields: {
              where: {
                OR: [{ fieldName }, { sx3FieldName: fieldName }],
              },
            },
          },
        },
      },
    });

    if (!registration?.template?.fields?.[0]) {
      return null;
    }

    const field = registration.template.fields[0];
    return field.attachmentConfig as unknown as AttachmentConfigDto | null;
  }

  /**
   * Validate file signature (magic bytes)
   */
  private validateFileSignature(buffer: Buffer, mimeType: string): boolean {
    const signatures = FILE_SIGNATURES[mimeType];

    // If no signature defined, allow (but log warning)
    if (!signatures) {
      this.logger.warn(`No signature defined for MIME type: ${mimeType}`);
      return true;
    }

    // Check if any signature matches
    return signatures.some((sig) => {
      if (buffer.length < sig.length) return false;
      return sig.every((byte, i) => buffer[i] === byte);
    });
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Remove invalid chars
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize file extension
   */
  private sanitizeExtension(ext: string): string {
    // Only allow alphanumeric extensions
    const clean = ext.replace(/[^a-zA-Z0-9.]/g, '');
    return clean.startsWith('.') ? clean : `.${clean}`;
  }

  /**
   * Clean up deleted files older than specified days
   * Should be called by a scheduled job
   */
  async cleanupDeletedFiles(olderThanDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deletedFiles = await this.prisma.fieldAttachment.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
    });

    let cleaned = 0;

    for (const file of deletedFiles) {
      try {
        // Delete physical file
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }

        // Delete database record
        await this.prisma.fieldAttachment.delete({
          where: { id: file.id },
        });

        cleaned++;
      } catch (error) {
        this.logger.error(`Error cleaning up file ${file.id}: ${error.message}`);
      }
    }

    this.logger.log(`Cleaned up ${cleaned} deleted files older than ${olderThanDays} days`);
    return { cleaned };
  }
}
