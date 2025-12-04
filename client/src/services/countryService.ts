import { backendApi } from './api';
import type {
  Country,
  CreateCountryDto,
  UpdateCountryDto,
  TestConnectionDto,
  TestConnectionResult,
  ConnectionPoolStatus,
} from '../types/country';

const BASE_URL = '/countries';

export const countryService = {
  /**
   * Get all countries
   */
  async findAll(activeOnly = false): Promise<Country[]> {
    const response = await backendApi.get<Country[]>(BASE_URL, {
      params: { activeOnly: activeOnly ? 'true' : undefined },
    });
    return response.data;
  },

  /**
   * Get default country
   */
  async getDefault(): Promise<Country | null> {
    const response = await backendApi.get<Country | null>(`${BASE_URL}/default`);
    return response.data;
  },

  /**
   * Get a country by ID
   */
  async findOne(id: string): Promise<Country> {
    const response = await backendApi.get<Country>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get a country by code
   */
  async findByCode(code: string): Promise<Country> {
    const response = await backendApi.get<Country>(`${BASE_URL}/code/${code}`);
    return response.data;
  },

  /**
   * Create a new country
   */
  async create(dto: CreateCountryDto): Promise<Country> {
    const response = await backendApi.post<Country>(BASE_URL, dto);
    return response.data;
  },

  /**
   * Update a country
   */
  async update(id: string, dto: UpdateCountryDto): Promise<Country> {
    const response = await backendApi.put<Country>(`${BASE_URL}/${id}`, dto);
    return response.data;
  },

  /**
   * Delete a country
   */
  async remove(id: string): Promise<void> {
    await backendApi.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Toggle country active status
   */
  async toggleActive(id: string): Promise<Country> {
    const response = await backendApi.patch<Country>(`${BASE_URL}/${id}/toggle`);
    return response.data;
  },

  /**
   * Set a country as default
   */
  async setAsDefault(id: string): Promise<Country> {
    const response = await backendApi.patch<Country>(`${BASE_URL}/${id}/set-default`);
    return response.data;
  },

  /**
   * Test database connection (without saving)
   */
  async testConnection(dto: TestConnectionDto): Promise<TestConnectionResult> {
    const response = await backendApi.post<TestConnectionResult>(
      `${BASE_URL}/test-connection`,
      dto
    );
    return response.data;
  },

  /**
   * Test connection for an existing country
   */
  async testCountryConnection(id: string): Promise<TestConnectionResult> {
    const response = await backendApi.post<TestConnectionResult>(
      `${BASE_URL}/${id}/test-connection`
    );
    return response.data;
  },

  /**
   * Get connection pool status
   */
  async getPoolStatus(): Promise<ConnectionPoolStatus[]> {
    const response = await backendApi.get<ConnectionPoolStatus[]>(
      `${BASE_URL}/pool-status`
    );
    return response.data;
  },

  /**
   * Close connection for a country
   */
  async closeConnection(id: string): Promise<void> {
    await backendApi.post(`${BASE_URL}/${id}/close-connection`);
  },
};

export default countryService;
