import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

// ==========================================
// SEC-01: Secure Settings Service with AES-256-GCM Encryption
// ==========================================

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits for GCM
  private readonly authTagLength = 16; // 128 bits

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the encryption key from environment variable
   * This is the ONLY secret that should remain in .env
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new BadRequestException(
        'ENCRYPTION_KEY environment variable is not set. ' +
        'Please generate a secure key using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }

    // Key should be 64 hex characters (32 bytes)
    if (key.length !== 64) {
      throw new BadRequestException(
        'ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)'
      );
    }

    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt a value using AES-256-GCM
   */
  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a value using AES-256-GCM
   */
  private decrypt(encryptedValue: string): string {
    const key = this.getEncryptionKey();

    const parts = encryptedValue.split(':');
    if (parts.length !== 3) {
      throw new BadRequestException('Invalid encrypted value format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Get a setting value by key
   * Automatically decrypts if isSecret is true
   */
  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return null;
    }

    if (setting.isSecret) {
      try {
        return this.decrypt(setting.value);
      } catch (error) {
        this.logger.error(`Failed to decrypt setting ${key}`, error);
        throw new BadRequestException(`Failed to decrypt setting: ${key}`);
      }
    }

    return setting.value;
  }

  /**
   * Get a setting value or throw if not found
   */
  async getOrThrow(key: string): Promise<string> {
    const value = await this.get(key);
    if (value === null) {
      throw new NotFoundException(`Setting not found: ${key}`);
    }
    return value;
  }

  /**
   * Get a setting with fallback to environment variable
   * Useful during migration period
   */
  async getWithEnvFallback(key: string, envKey?: string): Promise<string | null> {
    const dbValue = await this.get(key);
    if (dbValue !== null) {
      return dbValue;
    }

    // Fallback to environment variable
    const envValue = process.env[envKey || key];
    return envValue || null;
  }

  /**
   * Set a setting value
   * Automatically encrypts if isSecret is true
   */
  async set(
    key: string,
    value: string,
    options: {
      description?: string;
      isSecret?: boolean;
      category?: string;
      updatedById?: string;
    } = {},
  ): Promise<void> {
    const { description, isSecret = false, category, updatedById } = options;

    const storedValue = isSecret ? this.encrypt(value) : value;

    await this.prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: storedValue,
        description,
        isSecret,
        category,
        updatedById,
      },
      update: {
        value: storedValue,
        description: description !== undefined ? description : undefined,
        isSecret,
        category: category !== undefined ? category : undefined,
        updatedById,
      },
    });

    this.logger.log(`Setting ${key} ${isSecret ? '(encrypted)' : ''} saved`);
  }

  /**
   * Delete a setting
   */
  async delete(key: string): Promise<void> {
    await this.prisma.systemSetting.delete({
      where: { key },
    });
    this.logger.log(`Setting ${key} deleted`);
  }

  /**
   * Get all settings (for admin view)
   * Secret values are masked
   */
  async getAll(category?: string): Promise<Array<{
    id: string;
    key: string;
    value: string;
    description: string | null;
    isSecret: boolean;
    category: string | null;
    updatedAt: Date;
  }>> {
    const settings = await this.prisma.systemSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return settings.map((setting) => ({
      ...setting,
      // Mask secret values - never expose encrypted values to frontend
      value: setting.isSecret ? '********' : setting.value,
    }));
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const settings = await this.prisma.systemSetting.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return settings
      .map((s) => s.category)
      .filter((c): c is string => c !== null)
      .sort();
  }

  /**
   * Check if a setting exists
   */
  async exists(key: string): Promise<boolean> {
    const count = await this.prisma.systemSetting.count({
      where: { key },
    });
    return count > 0;
  }

  /**
   * Bulk set settings (useful for initial setup)
   */
  async bulkSet(
    settings: Array<{
      key: string;
      value: string;
      description?: string;
      isSecret?: boolean;
      category?: string;
    }>,
    updatedById?: string,
  ): Promise<void> {
    for (const setting of settings) {
      await this.set(setting.key, setting.value, {
        description: setting.description,
        isSecret: setting.isSecret,
        category: setting.category,
        updatedById,
      });
    }
    this.logger.log(`Bulk saved ${settings.length} settings`);
  }

  /**
   * Get multiple settings by keys
   */
  async getMany(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};

    for (const key of keys) {
      result[key] = await this.get(key);
    }

    return result;
  }
}
