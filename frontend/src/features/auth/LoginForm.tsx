import { useState, type FormEvent } from 'react'
import { DEMO_CREDENTIALS, InvalidCredentialsError } from '../../services/authService'
import type { LoginCredentials } from '../../types/auth'
import { InfoIcon } from '../../components/icons'
import { useTranslation } from '../../i18n/useTranslation'
import { useAuth } from './useAuth'
import { validateLoginForm, type LoginFormErrors } from './validateLoginForm'

export function LoginForm() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const [values, setValues] = useState<LoginCredentials>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [formError, setFormError] = useState<'invalidCredentials' | 'unavailable' | null>(null)
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
      setFormError(error instanceof InvalidCredentialsError ? 'invalidCredentials' : 'unavailable')
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
          <p className="login-form__demo-title">{t('auth.demoAccount')}</p>
          <dl className="login-form__demo-credentials">
            <dt>{t('auth.email')}</dt>
            <dd>
              <code>{DEMO_CREDENTIALS.email}</code>
            </dd>
            <dt>{t('auth.password')}</dt>
            <dd>
              <code>{DEMO_CREDENTIALS.password}</code>
            </dd>
          </dl>
          <button type="button" className="login-form__demo-fill" onClick={fillDemoCredentials}>
            {t('auth.fillDemo')}
          </button>
        </div>
      </div>

      {formError && (
        <div className="alert alert--error" role="alert">
          {t(`auth.${formError}`)}
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="login-email">
          {t('auth.email')}
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
            {t(`auth.validation.email.${errors.email}`)}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="login-password">
          {t('auth.password')}
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
            {t(`auth.validation.password.${errors.password}`)}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="button button--primary button--block login-form__submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('auth.submitting') : t('auth.signIn')}
      </button>
    </form>
  )
}
