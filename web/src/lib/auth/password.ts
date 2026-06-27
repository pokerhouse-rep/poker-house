import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Senha deve ter no mínimo 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'Senha deve ter ao menos 1 letra maiúscula'
  if (!/[0-9]/.test(password)) return 'Senha deve ter ao menos 1 número'
  return null
}
