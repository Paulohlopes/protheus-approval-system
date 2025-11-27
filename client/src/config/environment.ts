/**
 * Environment Configuration
 * Centralized configuration management for the application
 */

import { getApiConfig, getActiveCountry, getActiveCountries, getActiveERP } from './api-endpoints';

interface AppConfig {
  // Protheus ERP Configuration
  protheus: {
    baseUrl: string;
    oauth2TokenUrl: string;
    oauth2RefreshUrl: string;
    apiTimeout: number;
  };

  // API Endpoints
  api: {
    genericQuery: string;
    purchaseRequests: string;
    purchaseOrders: string;
    documents: string;
    dashboardStats: string;
    users: string;
    docAprov: string;
    aprovaDocumento: string;
  };

  // Active Configuration
  active: {
    country: string; // Primary country (first in the list)
    countries: string[]; // All active countries
    erp: string;
  };

  // Application Configuration
  app: {
    name: string;
    version: string;
    debugMode: boolean;
  };

  // Security Configuration
  security: {
    sessionTimeout: number;
    tokenRefreshThreshold: number;
    maxLoginAttempts: number;
  };

  // API Authentication (per country/ERP)
  auth: {
    username: string;
    password: string;
  };

  // Pagination Configuration
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
    maxPageNumber: number;
  };

  // UI Configuration
  ui: {
    enableDarkMode: boolean;
    enableAnimations: boolean;
    drawerWidth: number;
  };

  // Development Configuration
  dev: {
    mockApi: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Get environment variable with type checking and default values
 */
function getEnvVar(key: string, defaultValue: string): string;
function getEnvVar(key: string, defaultValue: number): number;
function getEnvVar(key: string, defaultValue: boolean): boolean;
function getEnvVar(key: string, defaultValue: string | number | boolean): string | number | boolean {
  const value = import.meta.env[key];
  
  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (typeof defaultValue === 'boolean') {
    return value.toLowerCase() === 'true';
  }

  if (typeof defaultValue === 'number') {
    const numValue = Number(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }

  return value;
}

/**
 * Get API configuration based on active country and ERP
 */
const apiConfig = getApiConfig();

/**
 * Application configuration object
 */
export const config: AppConfig = {
  protheus: {
    baseUrl: apiConfig.baseUrl,
    oauth2TokenUrl: apiConfig.oauth2TokenUrl,
    oauth2RefreshUrl: apiConfig.oauth2RefreshUrl,
    apiTimeout: apiConfig.apiTimeout,
  },

  api: {
    genericQuery: apiConfig.endpoints.genericQuery,
    purchaseRequests: apiConfig.endpoints.purchaseRequests,
    purchaseOrders: apiConfig.endpoints.purchaseOrders,
    documents: apiConfig.endpoints.documents,
    dashboardStats: apiConfig.endpoints.dashboardStats,
    users: apiConfig.endpoints.users,
    docAprov: apiConfig.endpoints.docAprov,
    aprovaDocumento: apiConfig.endpoints.aprovaDocumento,
  },

  active: {
    country: getActiveCountry(),
    countries: getActiveCountries(),
    erp: getActiveERP(),
  },

  app: {
    name: getEnvVar('VITE_APP_NAME', 'Protheus Approval System'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    debugMode: getEnvVar('VITE_DEBUG_MODE', false),
  },

  security: {
    sessionTimeout: getEnvVar('VITE_SESSION_TIMEOUT', 86400000), // 24 hours (default, should use server's expires_in)
    tokenRefreshThreshold: getEnvVar('VITE_TOKEN_REFRESH_THRESHOLD', 300000), // 5 minutes
    maxLoginAttempts: getEnvVar('VITE_MAX_LOGIN_ATTEMPTS', 3),
    inactivityTimeout: getEnvVar('VITE_INACTIVITY_TIMEOUT', 1800000), // 30 minutes
  },

  auth: {
    username: apiConfig.auth.username,
    password: apiConfig.auth.password,
  },

  pagination: {
    defaultPageSize: getEnvVar('VITE_DEFAULT_PAGE_SIZE', 10),
    maxPageSize: getEnvVar('VITE_MAX_PAGE_SIZE', 1000),
    maxPageNumber: getEnvVar('VITE_MAX_PAGE_NUMBER', 10000),
  },

  ui: {
    enableDarkMode: getEnvVar('VITE_ENABLE_DARK_MODE', true),
    enableAnimations: getEnvVar('VITE_ENABLE_ANIMATIONS', true),
    drawerWidth: getEnvVar('VITE_DRAWER_WIDTH', 240),
  },

  dev: {
    mockApi: getEnvVar('VITE_MOCK_API', false),
    logLevel: getEnvVar('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
  },
};

/**
 * Environment validation
 */
export function validateEnvironment(): string[] {
  const errors: string[] = [];

  // Check if active country and ERP are set
  if (!import.meta.env.VITE_ACTIVE_COUNTRY) {
    errors.push('Missing VITE_ACTIVE_COUNTRY environment variable');
  }

  if (!import.meta.env.VITE_ACTIVE_ERP) {
    errors.push('Missing VITE_ACTIVE_ERP environment variable');
  }

  // Validate base URL for primary country
  if (!config.protheus.baseUrl) {
    errors.push(`Missing base URL for country: ${config.active.country}, ERP: ${config.active.erp}`);
  }

  // Validate URLs for primary country
  try {
    new URL(config.protheus.baseUrl);
  } catch {
    errors.push(`Invalid base URL format: ${config.protheus.baseUrl}`);
  }

  // Validate all active countries have configuration
  config.active.countries.forEach(country => {
    const countryEnvPrefix = `VITE_${country}_${config.active.erp}`;
    const baseUrlVar = `${countryEnvPrefix}_BASE_URL`;
    const usernameVar = `${countryEnvPrefix}_USERNAME`;
    const passwordVar = `${countryEnvPrefix}_PASSWORD`;

    if (!import.meta.env[baseUrlVar]) {
      errors.push(`Missing ${baseUrlVar} for active country: ${country}`);
    }

    if (!import.meta.env[usernameVar]) {
      errors.push(`Missing ${usernameVar} for active country: ${country}`);
    }

    if (!import.meta.env[passwordVar]) {
      errors.push(`Missing ${passwordVar} for active country: ${country}`);
    }
  });

  // Validate numeric ranges
  if (config.pagination.defaultPageSize <= 0 || config.pagination.defaultPageSize > config.pagination.maxPageSize) {
    errors.push('Invalid pagination configuration');
  }

  if (config.security.sessionTimeout <= 0) {
    errors.push('Invalid session timeout configuration');
  }

  return errors;
}

/**
 * Check if running in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Check if running in production mode
 */
export const isProduction = import.meta.env.PROD;

/**
 * Get base API URL
 */
export const getApiBaseUrl = () => config.protheus.baseUrl;

/**
 * Logger utility
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (config.dev.logLevel === 'debug' || isDevelopment) {
      console.debug(`[${new Date().toISOString()}] DEBUG:`, message, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (['debug', 'info'].includes(config.dev.logLevel) || isDevelopment) {
      console.info(`[${new Date().toISOString()}] INFO:`, message, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (['debug', 'info', 'warn'].includes(config.dev.logLevel)) {
      console.warn(`[${new Date().toISOString()}] WARN:`, message, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, message, ...args);
  }
};

// Validate environment on startup
const envErrors = validateEnvironment();
if (envErrors.length > 0 && isProduction) {
  logger.error('Environment validation failed:', envErrors);
  throw new Error(`Environment configuration errors: ${envErrors.join(', ')}`);
} else if (envErrors.length > 0) {
  logger.warn('Environment validation warnings:', envErrors);
}

export default config;