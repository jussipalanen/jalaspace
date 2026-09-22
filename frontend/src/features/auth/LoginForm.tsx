import { useState, type FormEvent } from 'react'
import { DEMO_CREDENTIALS, InvalidCredentialsError } from '../../services/authService'
import type { LoginCredentials } from '../../types/auth'
import { InfoIcon } from '../../components/icons'
import { useAuth } from './useAuth'
import { validateLoginForm, type LoginFormErrors } from './validateLoginForm'

export function LoginForm() {
  const { login } = useAuth()
  const [values, setValues] = useState<LoginCredentials>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field: keyof LoginCredentials, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateLoginForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    setFormError(null)
    try {
      // On success the login page redirects; this component then unmounts.
      await login(values)
    } catch (error) {
      setFormError(
        error instanceof InvalidCredentialsError
          ? 'Invalid email or password.'
          : 'Unable to sign in. Please try again.',
      )
      setIsSubmitting(false)
    }
  }

  function fillDemoCredentials() {
    setValues(DEMO_CREDENTIALS)
    setErrors({})
    setFormError(null)
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="alert alert--info login-form__demo">
        <InfoIcon className="login-form__demo-icon" />
        <div>
          <p className="login-form__demo-title">Demo account</p>
          <p className="login-form__demo-text">
            Email <code>{DEMO_CREDENTIALS.email}</code>, password{' '}
            <code>{DEMO_CREDENTIALS.password}</code>
          </p>
          <button type="button" className="login-form__demo-fill" onClick={fillDemoCredentials}>
            Fill in demo credentials
          </button>
        </div>
      </div>

      {formError && (
        <div className="alert alert--error" role="alert">
          {formError}
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="field__input"
          type="email"
          name="email"
          autoComplete="username"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
        />
        {errors.email && (
          <p id="login-email-error" className="field__error">
            {errors.email}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="field__input"
          type="password"
          name="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
        />
        {errors.password && (
          <p id="login-password-error" className="field__error">
            {errors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="button button--primary button--block login-form__submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
