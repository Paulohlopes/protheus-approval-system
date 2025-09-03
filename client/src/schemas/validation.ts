import { z } from 'zod';

// Common validations
const requiredString = (fieldName: string) => 
  z.string().min(1, `${fieldName} é obrigatório`);

const optionalString = z.string().optional();

const positiveNumber = z.number().positive('Deve ser um número positivo');

const dateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Formato de data inválido. Use YYYY-MM-DD'
);

// Login validation
export const loginSchema = z.object({
  username: requiredString('Usuário')
    .min(3, 'Usuário deve ter pelo menos 3 caracteres')
    .max(50, 'Usuário deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Usuário contém caracteres inválidos'),
  
  password: requiredString('Senha')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
});

export type LoginInput = z.infer<typeof loginSchema>;

// Purchase Request Filters validation
export const purchaseRequestFiltersSchema = z.object({
  filial: z.string()
    .max(10, 'Filial deve ter no máximo 10 caracteres')
    .regex(/^[A-Z0-9]*$/, 'Filial deve conter apenas letras maiúsculas e números')
    .optional(),
  
  solicitante: z.string()
    .max(50, 'Nome do solicitante deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9\s._-]*$/, 'Solicitante contém caracteres inválidos')
    .optional(),
  
  numeroSC: z.string()
    .max(20, 'Número da SC deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9]*$/, 'Número da SC deve conter apenas letras maiúsculas e números')
    .optional(),
  
  dataInicio: dateString.optional(),
  
  dataFim: dateString.optional(),
  
  page: z.number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página deve ser maior que 0')
    .max(10000, 'Página deve ser menor que 10000')
    .optional(),
  
  pageSize: z.number()
    .int('Tamanho da página deve ser um número inteiro')
    .min(1, 'Tamanho da página deve ser maior que 0')
    .max(1000, 'Tamanho da página deve ser menor que 1000')
    .optional()
}).refine((data) => {
  // Validate date range
  if (data.dataInicio && data.dataFim) {
    return new Date(data.dataInicio) <= new Date(data.dataFim);
  }
  return true;
}, {
  message: 'Data de início deve ser anterior à data de fim',
  path: ['dataInicio']
});

export type PurchaseRequestFiltersInput = z.infer<typeof purchaseRequestFiltersSchema>;

// Purchase Order Filters validation
export const purchaseOrderFiltersSchema = z.object({
  filial: z.string()
    .max(10, 'Filial deve ter no máximo 10 caracteres')
    .regex(/^[A-Z0-9]*$/, 'Filial deve conter apenas letras maiúsculas e números')
    .optional(),
  
  solicitante: z.string()
    .max(50, 'Nome do solicitante deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9\s._-]*$/, 'Solicitante contém caracteres inválidos')
    .optional(),
  
  numeroPC: z.string()
    .max(20, 'Número do PC deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9]*$/, 'Número do PC deve conter apenas letras maiúsculas e números')
    .optional(),
  
  fornecedor: z.string()
    .max(15, 'Código do fornecedor deve ter no máximo 15 caracteres')
    .regex(/^[A-Z0-9]*$/, 'Código do fornecedor deve conter apenas letras maiúsculas e números')
    .optional(),
  
  dataInicio: dateString.optional(),
  
  dataFim: dateString.optional(),
  
  page: z.number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página deve ser maior que 0')
    .max(10000, 'Página deve ser menor que 10000')
    .optional(),
  
  pageSize: z.number()
    .int('Tamanho da página deve ser um número inteiro')
    .min(1, 'Tamanho da página deve ser maior que 0')
    .max(1000, 'Tamanho da página deve ser menor que 1000')
    .optional()
}).refine((data) => {
  // Validate date range
  if (data.dataInicio && data.dataFim) {
    return new Date(data.dataInicio) <= new Date(data.dataFim);
  }
  return true;
}, {
  message: 'Data de início deve ser anterior à data de fim',
  path: ['dataInicio']
});

export type PurchaseOrderFiltersInput = z.infer<typeof purchaseOrderFiltersSchema>;

// Document Filters validation
export const documentFiltersSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'in_review'])
    .optional(),
  
  type: z.string()
    .max(50, 'Tipo deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z_]*$/, 'Tipo deve conter apenas letras e underscore')
    .optional(),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'])
    .optional(),
  
  dateFrom: dateString.optional(),
  
  dateTo: dateString.optional(),
  
  requester: z.string()
    .max(100, 'Solicitante deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9\s._-]*$/, 'Solicitante contém caracteres inválidos')
    .optional(),
  
  search: z.string()
    .max(200, 'Busca deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-Z0-9\s._-]*$/, 'Busca contém caracteres inválidos')
    .optional()
}).refine((data) => {
  // Validate date range
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateFrom) <= new Date(data.dateTo);
  }
  return true;
}, {
  message: 'Data inicial deve ser anterior à data final',
  path: ['dateFrom']
});

export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;

// Pagination validation
export const paginationSchema = z.object({
  page: z.number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página deve ser maior que 0')
    .max(10000, 'Página deve ser menor que 10000')
    .default(1),
  
  limit: z.number()
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite deve ser maior que 0')
    .max(1000, 'Limite deve ser menor que 1000')
    .default(10),
  
  sortBy: z.string()
    .max(50, 'Campo de ordenação deve ter no máximo 50 caracteres')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Campo de ordenação inválido')
    .optional(),
  
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Document processing validation
export const documentProcessSchema = z.object({
  documentId: requiredString('ID do documento')
    .max(50, 'ID do documento deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID do documento contém caracteres inválidos'),
  
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Ação deve ser "approve" ou "reject"' })
  }),
  
  comments: z.string()
    .max(500, 'Comentários devem ter no máximo 500 caracteres')
    .optional()
});

export type DocumentProcessInput = z.infer<typeof documentProcessSchema>;

// Generic API response validation
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    error: z.string().optional(),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number()
    }).optional()
  });

// Protheus response validation
export const protheusResponseSchema = <T extends z.ZodTypeAny>(itemsSchema: T) =>
  z.object({
    items: z.array(itemsSchema),
    hasNext: z.boolean(),
    remainingRecords: z.number(),
    protectedDataFields: z.array(z.string()),
    nivelFields: z.array(z.string())
  });

/**
 * Validation utility functions
 */
export class ValidationUtils {
  /**
   * Safely validate and parse data
   */
  static safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errors = result.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        return { success: false, errors };
      }
    } catch (error) {
      return { 
        success: false, 
        errors: ['Erro interno de validação'] 
      };
    }
  }

  /**
   * Validate and throw on error
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${messages}`);
      }
      throw error;
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    
    return value
      .trim()
      .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
      .substring(0, 1000); // Limit length
  }
}