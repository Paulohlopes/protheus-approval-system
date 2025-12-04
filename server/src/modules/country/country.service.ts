import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateCountryDto, UpdateCountryDto, TestConnectionDto } from './dto';
import { Country } from '@prisma/client';

@Injectable()
export class CountryService {
  private readonly logger = new Logger(CountryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get all countries
   */
  async findAll(activeOnly = false): Promise<Omit<Country, 'dbPassword' | 'apiPassword'>[]> {
    const countries = await this.prisma.country.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    // Remove sensitive data
    return countries.map(this.sanitizeCountry);
  }

  /**
   * Get a country by ID
   */
  async findOne(id: string): Promise<Omit<Country, 'dbPassword' | 'apiPassword'>> {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return this.sanitizeCountry(country);
  }

  /**
   * Get a country by code
   */
  async findByCode(code: string): Promise<Omit<Country, 'dbPassword' | 'apiPassword'>> {
    const country = await this.prisma.country.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!country) {
      throw new NotFoundException(`Country with code ${code} not found`);
    }

    return this.sanitizeCountry(country);
  }

  /**
   * Get the default country
   */
  async getDefault(): Promise<Omit<Country, 'dbPassword' | 'apiPassword'> | null> {
    const country = await this.prisma.country.findFirst({
      where: { isDefault: true, isActive: true },
    });

    return country ? this.sanitizeCountry(country) : null;
  }

  /**
   * Create a new country
   */
  async create(dto: CreateCountryDto): Promise<Omit<Country, 'dbPassword' | 'apiPassword'>> {
    // Check for duplicate code
    const existing = await this.prisma.country.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Country with code ${dto.code} already exists`);
    }

    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.country.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Encrypt sensitive data
    const encryptedDbPassword = this.settingsService.encryptValue(dto.dbPassword);
    const encryptedApiPassword = dto.apiPassword
      ? this.settingsService.encryptValue(dto.apiPassword)
      : null;

    const country = await this.prisma.country.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
        tableSuffix: dto.tableSuffix,
        dbHost: dto.dbHost,
        dbPort: dto.dbPort ?? 1433,
        dbDatabase: dto.dbDatabase,
        dbUsername: dto.dbUsername,
        dbPassword: encryptedDbPassword,
        dbOptions: dto.dbOptions || null,
        apiBaseUrl: dto.apiBaseUrl || null,
        apiUsername: dto.apiUsername || null,
        apiPassword: encryptedApiPassword,
        apiTimeout: dto.apiTimeout ?? 30000,
        oauthUrl: dto.oauthUrl || null,
        connectionStatus: 'untested',
      },
    });

    this.logger.log(`Country created: ${country.code} (${country.name})`);
    return this.sanitizeCountry(country);
  }

  /**
   * Update a country
   */
  async update(
    id: string,
    dto: UpdateCountryDto,
  ): Promise<Omit<Country, 'dbPassword' | 'apiPassword'>> {
    const existing = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // If this is set as default, unset other defaults
    if (dto.isDefault && !existing.isDefault) {
      await this.prisma.country.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Build update data
    const updateData: any = { ...dto };

    // Encrypt password only if provided (not empty string)
    if (dto.dbPassword && dto.dbPassword.trim() !== '') {
      updateData.dbPassword = this.settingsService.encryptValue(dto.dbPassword);
    } else {
      delete updateData.dbPassword; // Keep existing password
    }

    if (dto.apiPassword && dto.apiPassword.trim() !== '') {
      updateData.apiPassword = this.settingsService.encryptValue(dto.apiPassword);
    } else {
      delete updateData.apiPassword; // Keep existing password
    }

    // Reset connection status if connection params changed
    const connectionParamsChanged =
      dto.dbHost !== undefined ||
      dto.dbPort !== undefined ||
      dto.dbDatabase !== undefined ||
      dto.dbUsername !== undefined ||
      (dto.dbPassword && dto.dbPassword.trim() !== '');

    if (connectionParamsChanged) {
      updateData.connectionStatus = 'untested';
      updateData.connectionError = null;
      updateData.lastConnectionTest = null;
    }

    const country = await this.prisma.country.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Country updated: ${country.code}`);
    return this.sanitizeCountry(country);
  }

  /**
   * Delete a country
   */
  async remove(id: string): Promise<void> {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            requests: true,
            templates: true,
          },
        },
      },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    if (country._count.requests > 0) {
      throw new BadRequestException(
        `Cannot delete country ${country.code}: it has ${country._count.requests} registration requests`,
      );
    }

    if (country._count.templates > 0) {
      throw new BadRequestException(
        `Cannot delete country ${country.code}: it has ${country._count.templates} templates associated`,
      );
    }

    await this.prisma.country.delete({
      where: { id },
    });

    this.logger.log(`Country deleted: ${country.code}`);
  }

  /**
   * Toggle country active status
   */
  async toggleActive(id: string): Promise<Omit<Country, 'dbPassword' | 'apiPassword'>> {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    const updated = await this.prisma.country.update({
      where: { id },
      data: { isActive: !country.isActive },
    });

    this.logger.log(`Country ${updated.code} ${updated.isActive ? 'activated' : 'deactivated'}`);
    return this.sanitizeCountry(updated);
  }

  /**
   * Set a country as default
   */
  async setAsDefault(id: string): Promise<Omit<Country, 'dbPassword' | 'apiPassword'>> {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // Unset all defaults
    await this.prisma.country.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set this country as default
    const updated = await this.prisma.country.update({
      where: { id },
      data: { isDefault: true },
    });

    this.logger.log(`Country ${updated.code} set as default`);
    return this.sanitizeCountry(updated);
  }

  /**
   * Get connection credentials for a country (internal use only)
   */
  async getConnectionCredentials(id: string): Promise<{
    dbHost: string;
    dbPort: number;
    dbDatabase: string;
    dbUsername: string;
    dbPassword: string;
    dbOptions: Record<string, any> | null;
    tableSuffix: string;
  }> {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return {
      dbHost: country.dbHost,
      dbPort: country.dbPort,
      dbDatabase: country.dbDatabase,
      dbUsername: country.dbUsername,
      dbPassword: this.settingsService.decryptValue(country.dbPassword),
      dbOptions: country.dbOptions as Record<string, any> | null,
      tableSuffix: country.tableSuffix,
    };
  }

  /**
   * Get API credentials for a country (internal use only)
   */
  async getApiCredentials(id: string): Promise<{
    apiBaseUrl: string | null;
    apiUsername: string | null;
    apiPassword: string | null;
    apiTimeout: number;
    oauthUrl: string | null;
  }> {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return {
      apiBaseUrl: country.apiBaseUrl,
      apiUsername: country.apiUsername,
      apiPassword: country.apiPassword
        ? this.settingsService.decryptValue(country.apiPassword)
        : null,
      apiTimeout: country.apiTimeout,
      oauthUrl: country.oauthUrl,
    };
  }

  /**
   * Update connection test result
   */
  async updateConnectionStatus(
    id: string,
    status: 'connected' | 'failed',
    error?: string,
  ): Promise<void> {
    await this.prisma.country.update({
      where: { id },
      data: {
        connectionStatus: status,
        connectionError: error || null,
        lastConnectionTest: new Date(),
      },
    });
  }

  /**
   * Remove sensitive data from country object
   */
  private sanitizeCountry(country: Country): Omit<Country, 'dbPassword' | 'apiPassword'> {
    const { dbPassword, apiPassword, ...sanitized } = country;
    return {
      ...sanitized,
      // Indicate if passwords are set (without exposing them)
      dbPassword: dbPassword ? '********' : '',
      apiPassword: apiPassword ? '********' : '',
    } as any;
  }
}
