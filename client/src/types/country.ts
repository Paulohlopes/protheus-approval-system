export interface Country {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  tableSuffix: string;

  // Connection info (passwords are masked)
  dbHost: string;
  dbPort: number;
  dbDatabase: string;
  dbUsername: string;
  dbPassword: string; // Always "********" when set
  dbOptions?: Record<string, any>;

  // API Configuration
  apiBaseUrl?: string;
  apiUsername?: string;
  apiPassword?: string; // Always "********" when set
  apiTimeout: number;
  oauthUrl?: string;

  // Connection Status
  lastConnectionTest?: string;
  connectionStatus?: 'connected' | 'failed' | 'untested';
  connectionError?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface CreateCountryDto {
  code: string;
  name: string;
  isActive?: boolean;
  isDefault?: boolean;
  tableSuffix: string;

  // Database Connection
  dbHost: string;
  dbPort?: number;
  dbDatabase: string;
  dbUsername: string;
  dbPassword: string;
  dbOptions?: Record<string, any>;

  // API Configuration
  apiBaseUrl?: string;
  apiUsername?: string;
  apiPassword?: string;
  apiTimeout?: number;
  oauthUrl?: string;
}

export interface UpdateCountryDto extends Partial<Omit<CreateCountryDto, 'code'>> {
  // Passwords are optional on update
  dbPassword?: string;
  apiPassword?: string;
}

export interface TestConnectionDto {
  dbHost: string;
  dbPort?: number;
  dbDatabase: string;
  dbUsername: string;
  dbPassword: string;
  dbOptions?: Record<string, any>;
  tableSuffix?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: {
    serverVersion?: string;
    database?: string;
    testTableFound?: boolean;
  };
}

export interface ConnectionPoolStatus {
  countryId: string;
  isConnected: boolean;
  lastUsed: string;
  idleMinutes: number;
}
