import { z } from 'zod'

export const loginAdminSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

export const loginPlayerSchema = z.object({
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
  organization_id: z.string().uuid().optional(),
})

export const changePasswordSchema = z.object({
  senha_atual: z.string().min(1, 'Senha atual obrigatória'),
  nova_senha: z.string().min(8, 'Mínimo 8 caracteres'),
})

export const requestPasswordResetSchema = z.object({
  email_or_cpf: z.string().min(1, 'Informe e-mail ou CPF'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  nova_senha: z.string().min(8, 'Mínimo 8 caracteres'),
})

export type LoginAdminInput = z.infer<typeof loginAdminSchema>
export type LoginPlayerInput = z.infer<typeof loginPlayerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
