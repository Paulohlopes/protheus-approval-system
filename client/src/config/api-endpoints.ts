/**
 * API Endpoints Configuration
 * Multi-country and multi-ERP support
 */

export type Country = 'BR' | 'AR' | 'MX' | 'CL';
export type ERP = 'PROTHEUS' | 'SAP' | 'ORACLE';

export interface ERPEndpoints {
  baseUrl: string;
  oauth2TokenUrl: string;
  oauth2RefreshUrl: string;
  apiTimeout: number;
  endpoints: {
    genericQuery: string;
    purchaseRequests: string;
    purchaseOrders: string;
    documents: string;
    dashboardStats: string;
    users: string;
    docAprov: string;
    aprovaDocumento: string;
  };
}

export interface APIConfig {
  [country: string]: {
    [erp: string]: ERPEndpoints;
  };
}

/**
 * Configuration for all countries and ERPs
 */
const API_CONFIGS: APIConfig = {
  BR: {
    PROTHEUS: {
      baseUrl: import.meta.env.VITE_BR_PROTHEUS_BASE_URL || 'http://brsvawssaa06069:8029/rest',
      oauth2TokenUrl: import.meta.env.VITE_BR_PROTHEUS_OAUTH2_TOKEN_URL || '/tlpp/oauth2/token',
      oauth2RefreshUrl: import.meta.env.VITE_BR_PROTHEUS_OAUTH2_REFRESH_URL || '/tlpp/oauth2/token',
      apiTimeout: Number(import.meta.env.VITE_BR_PROTHEUS_API_TIMEOUT) || 30000,
      endpoints: {
        genericQuery: '/api/framework/v1/genericQuery',
        purchaseRequests: '/api/framework/v1/genericQuery',
        purchaseOrders: '/api/framework/v1/genericQuery',
        documents: '/api/documents',
        dashboardStats: '/api/dashboard/stats',
        users: '/api/framework/v1/users',
        docAprov: '/DocAprov/documentos',
        aprovaDocumento: '/aprova_documento',
      },
    },
  },
  AR: {
    PROTHEUS: {
      baseUrl: import.meta.env.VITE_AR_PROTHEUS_BASE_URL || '',
      oauth2TokenUrl: import.meta.env.VITE_AR_PROTHEUS_OAUTH2_TOKEN_URL || '/tlpp/oauth2/token',
      oauth2RefreshUrl: import.meta.env.VITE_AR_PROTHEUS_OAUTH2_REFRESH_URL || '/tlpp/oauth2/token',
      apiTimeout: Number(import.meta.env.VITE_AR_PROTHEUS_API_TIMEOUT) || 30000,
      endpoints: {
        genericQuery: '/api/framework/v1/genericQuery',
        purchaseRequests: '/api/framework/v1/genericQuery',
        purchaseOrders: '/api/framework/v1/genericQuery',
        documents: '/api/documents',
        dashboardStats: '/api/dashboard/stats',
        users: '/api/framework/v1/users',
        docAprov: '/DocAprov/documentos',
        aprovaDocumento: '/aprova_documento',
      },
    },
  },
  MX: {
    PROTHEUS: {
      baseUrl: import.meta.env.VITE_MX_PROTHEUS_BASE_URL || '',
      oauth2TokenUrl: import.meta.env.VITE_MX_PROTHEUS_OAUTH2_TOKEN_URL || '/tlpp/oauth2/token',
      oauth2RefreshUrl: import.meta.env.VITE_MX_PROTHEUS_OAUTH2_REFRESH_URL || '/tlpp/oauth2/token',
      apiTimeout: Number(import.meta.env.VITE_MX_PROTHEUS_API_TIMEOUT) || 30000,
      endpoints: {
        genericQuery: '/api/framework/v1/genericQuery',
        purchaseRequests: '/api/framework/v1/genericQuery',
        purchaseOrders: '/api/framework/v1/genericQuery',
        documents: '/api/documents',
        dashboardStats: '/api/dashboard/stats',
        users: '/api/framework/v1/users',
        docAprov: '/DocAprov/documentos',
        aprovaDocumento: '/aprova_documento',
      },
    },
  },
  CL: {
    PROTHEUS: {
      baseUrl: import.meta.env.VITE_CL_PROTHEUS_BASE_URL || '',
      oauth2TokenUrl: import.meta.env.VITE_CL_PROTHEUS_OAUTH2_TOKEN_URL || '/tlpp/oauth2/token',
      oauth2RefreshUrl: import.meta.env.VITE_CL_PROTHEUS_OAUTH2_REFRESH_URL || '/tlpp/oauth2/token',
      apiTimeout: Number(import.meta.env.VITE_CL_PROTHEUS_API_TIMEOUT) || 30000,
      endpoints: {
        genericQuery: '/api/framework/v1/genericQuery',
        purchaseRequests: '/api/framework/v1/genericQuery',
        purchaseOrders: '/api/framework/v1/genericQuery',
        documents: '/api/documents',
        dashboardStats: '/api/dashboard/stats',
        users: '/api/framework/v1/users',
        docAprov: '/DocAprov/documentos',
        aprovaDocumento: '/aprova_documento',
      },
    },
  },
};

/**
 * Get current active country from environment
 */
export const getActiveCountry = (): Country => {
  const country = import.meta.env.VITE_ACTIVE_COUNTRY as Country;
  if (!country || !API_CONFIGS[country]) {
    console.warn(`Invalid country: ${country}, defaulting to BR`);
    return 'BR';
  }
  return country;
};

/**
 * Get current active ERP from environment
 */
export const getActiveERP = (): ERP => {
  const erp = import.meta.env.VITE_ACTIVE_ERP as ERP;
  if (!erp || !API_CONFIGS[getActiveCountry()][erp]) {
    console.warn(`Invalid ERP: ${erp}, defaulting to PROTHEUS`);
    return 'PROTHEUS';
  }
  return erp;
};

/**
 * Get API configuration for active country and ERP
 */
export const getApiConfig = (): ERPEndpoints => {
  const country = getActiveCountry();
  const erp = getActiveERP();

  const config = API_CONFIGS[country]?.[erp];

  if (!config) {
    throw new Error(
      `No API configuration found for country: ${country}, ERP: ${erp}`
    );
  }

  return config;
};

/**
 * Get API configuration for specific country and ERP
 */
export const getApiConfigFor = (country: Country, erp: ERP): ERPEndpoints => {
  const config = API_CONFIGS[country]?.[erp];

  if (!config) {
    throw new Error(
      `No API configuration found for country: ${country}, ERP: ${erp}`
    );
  }

  return config;
};

/**
 * Check if a country/ERP combination is configured
 */
export const isConfigured = (country: Country, erp: ERP): boolean => {
  return !!API_CONFIGS[country]?.[erp]?.baseUrl;
};

/**
 * Get list of available countries
 */
export const getAvailableCountries = (): Country[] => {
  return Object.keys(API_CONFIGS).filter((country) =>
    Object.values(API_CONFIGS[country]).some((erpConfig) => erpConfig.baseUrl)
  ) as Country[];
};

/**
 * Get list of available ERPs for a country
 */
export const getAvailableERPsForCountry = (country: Country): ERP[] => {
  return Object.keys(API_CONFIGS[country] || {}).filter(
    (erp) => API_CONFIGS[country][erp].baseUrl
  ) as ERP[];
};

export default getApiConfig;
