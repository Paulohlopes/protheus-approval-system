import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInfo } from '../auth/interfaces/auth.interface';

// ==========================================
// SEC-01: Settings Controller (Admin Only)
// ==========================================

@ApiTags('settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Verify admin access
   */
  private checkAdmin(user: UserInfo) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only administrators can manage system settings');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar configurações', description: 'Lista todas as configurações (secrets mascarados)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiResponse({ status: 200, description: 'Lista de configurações' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  async getAll(
    @Query('category') category: string | undefined,
    @CurrentUser() user: UserInfo,
  ) {
    this.checkAdmin(user);
    return this.settingsService.getAll(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias', description: 'Lista todas as categorias de configurações' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  async getCategories(@CurrentUser() user: UserInfo) {
    this.checkAdmin(user);
    return this.settingsService.getCategories();
  }

  /**
   * Get a specific setting
   */
  @Get(':key')
  async get(@Param('key') key: string, @CurrentUser() user: UserInfo) {
    this.checkAdmin(user);

    const setting = await this.settingsService.get(key);
    if (setting === null) {
      return { key, value: null, exists: false };
    }

    // For security, we don't return actual secret values via API
    // The service already masks them in getAll(), but for individual get
    // we return a flag indicating it's a secret
    const exists = await this.settingsService.exists(key);
    return { key, exists, message: 'Use getAll() to view masked values' };
  }

  /**
   * Create or update a setting
   */
  @Post()
  async set(
    @Body()
    dto: {
      key: string;
      value: string;
      description?: string;
      isSecret?: boolean;
      category?: string;
    },
    @CurrentUser() user: UserInfo,
  ) {
    this.checkAdmin(user);

    await this.settingsService.set(dto.key, dto.value, {
      description: dto.description,
      isSecret: dto.isSecret,
      category: dto.category,
      updatedById: user.id,
    });

    return { success: true, key: dto.key };
  }

  /**
   * Update a setting
   */
  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body()
    dto: {
      value: string;
      description?: string;
      isSecret?: boolean;
      category?: string;
    },
    @CurrentUser() user: UserInfo,
  ) {
    this.checkAdmin(user);

    await this.settingsService.set(key, dto.value, {
      description: dto.description,
      isSecret: dto.isSecret,
      category: dto.category,
      updatedById: user.id,
    });

    return { success: true, key };
  }

  /**
   * Delete a setting
   */
  @Delete(':key')
  async delete(@Param('key') key: string, @CurrentUser() user: UserInfo) {
    this.checkAdmin(user);

    await this.settingsService.delete(key);
    return { success: true, key };
  }

  /**
   * Bulk set settings
   */
  @Post('bulk')
  async bulkSet(
    @Body()
    dto: {
      settings: Array<{
        key: string;
        value: string;
        description?: string;
        isSecret?: boolean;
        category?: string;
      }>;
    },
    @CurrentUser() user: UserInfo,
  ) {
    this.checkAdmin(user);

    await this.settingsService.bulkSet(dto.settings, user.id);
    return { success: true, count: dto.settings.length };
  }

  /**
   * Test encryption (for debugging only - remove in production)
   */
  @Post('test-encryption')
  async testEncryption(
    @Body() dto: { value: string },
    @CurrentUser() user: UserInfo,
  ) {
    this.checkAdmin(user);

    // Create a temporary test setting
    const testKey = `__test_${Date.now()}`;
    await this.settingsService.set(testKey, dto.value, {
      isSecret: true,
      category: 'test',
      updatedById: user.id,
    });

    // Read it back
    const decrypted = await this.settingsService.get(testKey);

    // Delete test setting
    await this.settingsService.delete(testKey);

    return {
      success: decrypted === dto.value,
      message: decrypted === dto.value
        ? 'Encryption/decryption working correctly'
        : 'Encryption test failed',
    };
  }
}
