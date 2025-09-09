/**
 * Environment Configuration
 * Centralized configuration management for the application
 */

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
    documents: string;
    dashboardStats: string;
    users: string;
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

  // API Authentication
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
 * Application configuration object
 */
export const config: AppConfig = {
  protheus: {
    baseUrl: getEnvVar('VITE_PROTHEUS_BASE_URL', 'http://localhost:8029/rest'),
    oauth2TokenUrl: getEnvVar('VITE_OAUTH2_TOKEN_URL', '/tlpp/oauth2/token'),
    oauth2RefreshUrl: getEnvVar('VITE_OAUTH2_REFRESH_URL', '/tlpp/oauth2/token'),
    apiTimeout: getEnvVar('VITE_API_TIMEOUT', 30000),
  },

  api: {
    genericQuery: getEnvVar('VITE_API_GENERIC_QUERY', '/api/framework/v1/genericQuery'),
    purchaseRequests: getEnvVar('VITE_API_PURCHASE_REQUESTS', '/api/framework/v1/genericQuery'),
    documents: getEnvVar('VITE_API_DOCUMENTS', '/api/documents'),
    dashboardStats: getEnvVar('VITE_API_DASHBOARD_STATS', '/api/dashboard/stats'),
    users: getEnvVar('VITE_API_USERS', '/api/framework/v1/users'),
  },

  app: {
    name: getEnvVar('VITE_APP_NAME', 'Protheus Approval System'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    debugMode: getEnvVar('VITE_DEBUG_MODE', false),
  },

  security: {
    sessionTimeout: getEnvVar('VITE_SESSION_TIMEOUT', 86400000), // 24 hours
    tokenRefreshThreshold: getEnvVar('VITE_TOKEN_REFRESH_THRESHOLD', 300000), // 5 minutes
    maxLoginAttempts: getEnvVar('VITE_MAX_LOGIN_ATTEMPTS', 3),
  },

  auth: {
    username: getEnvVar('VITE_API_USERNAME', ''),
    password: getEnvVar('VITE_API_PASSWORD', ''),
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

  // Required environment variables
  const requiredVars = [
    'VITE_PROTHEUS_BASE_URL',
  ];

  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate URLs
  try {
    new URL(config.protheus.baseUrl);
  } catch {
    errors.push('Invalid VITE_PROTHEUS_BASE_URL format');
  }

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