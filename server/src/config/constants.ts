/**
 * MAN-01: Centralized Application Constants
 * All magic numbers and configuration values should be defined here
 */

// ==========================================
// WORKFLOW CONFIGURATION
// ==========================================

export const WORKFLOW_CONFIG = {
  /** Maximum iterations allowed in workflow advancement to prevent infinite loops (LOG-07) */
  MAX_ITERATIONS: 100,

  /** Default timeout for database transactions in milliseconds */
  TRANSACTION_TIMEOUT: 30000,

  /** Default level order for first workflow level */
  FIRST_LEVEL_ORDER: 1,
} as const;

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

export const DATABASE_CONFIG = {
  /** Transaction isolation level for critical operations */
  ISOLATION_LEVEL: 'Serializable' as const,

  /** Default query timeout in milliseconds */
  QUERY_TIMEOUT: 30000,
} as const;

// ==========================================
// RATE LIMITING CONFIGURATION
// ==========================================

export const RATE_LIMIT_CONFIG = {
  /** Short burst protection: requests per second */
  SHORT: {
    TTL: 1000,
    LIMIT: 10,
  },

  /** Medium term protection: requests per 10 seconds */
  MEDIUM: {
    TTL: 10000,
    LIMIT: 50,
  },

  /** Long term protection: requests per minute */
  LONG: {
    TTL: 60000,
    LIMIT: 100,
  },
} as const;

// ==========================================
// SECURITY CONFIGURATION
// ==========================================

export const SECURITY_CONFIG = {
  /** JWT token expiration in seconds */
  JWT_EXPIRATION: '1h',

  /** Refresh token expiration in seconds */
  REFRESH_TOKEN_EXPIRATION: '7d',

  /** Encryption algorithm for stored secrets */
  ENCRYPTION_ALGORITHM: 'aes-256-gcm' as const,

  /** IV length for AES-GCM */
  ENCRYPTION_IV_LENGTH: 16,

  /** Auth tag length for AES-GCM */
  ENCRYPTION_AUTH_TAG_LENGTH: 16,

  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,

  /** Salt rounds for bcrypt */
  BCRYPT_SALT_ROUNDS: 10,

  /** Secret masking string for API responses */
  SECRET_MASK: '********',
} as const;

// ==========================================
// PAGINATION DEFAULTS
// ==========================================

export const PAGINATION_CONFIG = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 20,

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 100,

  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;

// ==========================================
// PROTHEUS INTEGRATION
// ==========================================

export const PROTHEUS_CONFIG = {
  /** Default timeout for Protheus API calls in milliseconds */
  API_TIMEOUT: 30000,

  /** Maximum retry attempts for failed sync */
  MAX_SYNC_RETRIES: 3,

  /** Delay between retry attempts in milliseconds */
  RETRY_DELAY: 5000,
} as const;

// ==========================================
// HEALTH CHECK CONFIGURATION
// ==========================================

export const HEALTH_CHECK_CONFIG = {
  /** Memory usage threshold percentage for warning */
  MEMORY_THRESHOLD_WARNING: 80,

  /** Memory usage threshold percentage for critical */
  MEMORY_THRESHOLD_CRITICAL: 90,

  /** Database response time threshold for warning (ms) */
  DB_RESPONSE_WARNING: 1000,

  /** Database response time threshold for critical (ms) */
  DB_RESPONSE_CRITICAL: 5000,
} as const;

// ==========================================
// VALIDATION MESSAGES (Portuguese)
// ==========================================

export const VALIDATION_MESSAGES = {
  FIELD_REQUIRED: (fieldName: string) => `${fieldName} é obrigatório`,
  FIELD_INVALID_NUMBER: (fieldName: string) => `${fieldName} deve ser um número válido`,
  FIELD_INVALID_DATE: (fieldName: string) => `${fieldName} deve ser uma data válida`,
  FIELD_INVALID_BOOLEAN: (fieldName: string) => `${fieldName} deve ser verdadeiro ou falso`,
  FIELD_MAX_LENGTH: (fieldName: string, maxLength: number) =>
    `${fieldName} deve ter no máximo ${maxLength} caracteres`,

  // Generic messages
  NOT_FOUND: (entity: string, id: string) => `${entity} ${id} não encontrado`,
  FORBIDDEN_OWN_REGISTRATION: 'Você não pode aprovar/rejeitar sua própria solicitação',
  FORBIDDEN_NOT_OWNER: 'Você só pode modificar suas próprias solicitações',
  FORBIDDEN_ACCESS_DENIED: 'Você não tem acesso a este recurso',
  FORBIDDEN_ADMIN_ONLY: 'Apenas administradores podem executar esta ação',

  // Workflow messages
  WORKFLOW_NOT_FOUND: (templateId: string) =>
    `Nenhum workflow ativo encontrado para o template ${templateId}`,
  WORKFLOW_NO_LEVELS: 'Workflow não possui níveis configurados',
  WORKFLOW_LEVEL_NO_APPROVERS: (levelOrder: number, levelName: string) =>
    `Nível ${levelOrder} (${levelName}) não possui aprovadores configurados. Configure pelo menos um aprovador ou grupo para cada nível.`,
  WORKFLOW_MAX_ITERATIONS: 'Erro de processamento do workflow: muitas iterações. Por favor, contate o suporte.',

  // Status messages
  STATUS_INVALID_TRANSITION: (from: string, to: string, context?: string) =>
    `Transição de status inválida de ${from} para ${to}${context ? ` (${context})` : ''}`,
  STATUS_NOT_PENDING: (currentStatus: string) =>
    `Solicitação não está pendente de aprovação (status atual: ${currentStatus})`,
  STATUS_ONLY_DRAFT: 'Apenas solicitações em RASCUNHO podem ser modificadas',
  STATUS_ONLY_FAILED_SYNC: 'Apenas sincronizações com falha podem ser reprocessadas',

  // Approval messages
  NO_PENDING_APPROVAL: 'Nenhuma aprovação pendente encontrada para este usuário no nível atual',
  FIELD_NOT_EDITABLE: (fieldName: string) =>
    `Campo "${fieldName}" não é editável neste nível de aprovação`,
} as const;

// ==========================================
// HTTP STATUS CODES (for reference)
// ==========================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ==========================================
// EXPORT ALL AS DEFAULT
// ==========================================

export default {
  WORKFLOW_CONFIG,
  DATABASE_CONFIG,
  RATE_LIMIT_CONFIG,
  SECURITY_CONFIG,
  PAGINATION_CONFIG,
  PROTHEUS_CONFIG,
  HEALTH_CHECK_CONFIG,
  VALIDATION_MESSAGES,
  HTTP_STATUS,
};
