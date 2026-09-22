import type { LoginCredentials } from '../../types/auth'

/** Error codes; the UI translates them (`auth.validation.<field>.<code>`). */
export interface LoginFormErrors {
  email?: 'required' | 'invalid'
  password?: 'required'
}

// Intentionally simple: a basic shape check, not full RFC 5322 validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginForm({ email, password }: LoginCredentials): LoginFormErrors {
  const errors: LoginFormErrors = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) errors.email = 'required'
  else if (!EMAIL_PATTERN.test(trimmedEmail)) errors.email = 'invalid'

  if (!password) errors.password = 'required'

  return errors
}
