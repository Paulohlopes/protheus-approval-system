import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { CountryService } from './country.service';
import { ConnectionManagerService } from './connection-manager.service';
import { CreateCountryDto, UpdateCountryDto, TestConnectionDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('countries')
export class CountryController {
  constructor(
    private readonly countryService: CountryService,
    private readonly connectionManager: ConnectionManagerService,
  ) {}

  /**
   * Get all countries (public endpoint for country selector)
   */
  @Public()
  @Get()
  findAll(
    @Query('activeOnly', new ParseBoolPipe({ optional: true })) activeOnly?: boolean,
  ) {
    return this.countryService.findAll(activeOnly);
  }

  /**
   * Get connection pool status (admin only)
   */
  @Get('pool-status')
  getPoolStatus() {
    return this.connectionManager.getPoolStatus();
  }

  /**
   * Get default country (public endpoint)
   */
  @Public()
  @Get('default')
  getDefault() {
    return this.countryService.getDefault();
  }

  /**
   * Get a country by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.countryService.findOne(id);
  }

  /**
   * Get a country by code
   */
  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.countryService.findByCode(code);
  }

  /**
   * Create a new country
   */
  @Post()
  create(@Body() dto: CreateCountryDto) {
    return this.countryService.create(dto);
  }

  /**
   * Test database connection (without saving)
   */
  @Post('test-connection')
  testConnection(@Body() dto: TestConnectionDto) {
    return this.connectionManager.testConnection(dto);
  }

  /**
   * Update a country
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countryService.update(id, dto);
  }

  /**
   * Delete a country
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.countryService.remove(id);
  }

  /**
   * Toggle country active status
   */
  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.countryService.toggleActive(id);
  }

  /**
   * Set a country as default
   */
  @Patch(':id/set-default')
  setAsDefault(@Param('id') id: string) {
    return this.countryService.setAsDefault(id);
  }

  /**
   * Test connection for existing country
   */
  @Post(':id/test-connection')
  testCountryConnection(@Param('id') id: string) {
    return this.connectionManager.testCountryConnection(id);
  }

  /**
   * Close connection for a country (admin only)
   */
  @Post(':id/close-connection')
  closeConnection(@Param('id') id: string) {
    return this.connectionManager.closeConnection(id);
  }
}
