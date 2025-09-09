import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres')
    .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Nome de usuário deve conter apenas letras, números, pontos, underscores e hífens'
    ),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres'),
});

export const protheusLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .toLowerCase(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ProtheusLoginFormData = z.infer<typeof protheusLoginSchema>;

// Manter compatibilidade com username para outros usos
export interface ProtheusLoginData {
  email: string;
}