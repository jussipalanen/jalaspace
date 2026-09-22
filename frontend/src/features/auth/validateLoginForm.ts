import type { LoginCredentials } from '../../types/auth'

export type LoginFormErrors = Partial<Record<keyof LoginCredentials, string>>

// Intentionally simple: a basic shape check, not full RFC 5322 validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginForm({ email, password }: LoginCredentials): LoginFormErrors {
  const errors: LoginFormErrors = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(trimmedEmail)) errors.email = 'Enter a valid email address.'

  if (!password) errors.password = 'Password is required.'

  return errors
}
