import { Navigate, useLocation } from 'react-router'
import { LogoMark } from '../components/icons'
import { LanguageSwitcher } from '../components/LanguageSwitcher/LanguageSwitcher'
import { LoginForm } from '../features/auth/LoginForm'
import type { LoginLocationState } from '../features/auth/RequireAuth'
import { useAuth } from '../features/auth/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTranslation } from '../i18n/useTranslation'
import './LoginPage.css'

/** Only allow returning to in-app paths. */
function getRedirectTarget(state: unknown): string {
  const from = (state as LoginLocationState | null)?.from
  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
    return from
  }
  return '/'
}

export function LoginPage() {
  const { status } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  useDocumentTitle(t('auth.signIn'))

  if (status === 'loading') return null
  if (status === 'authenticated') {
    return <Navigate to={getRedirectTarget(location.state)} replace />
  }

  return (
    <main className="login-page">
      <div className="login-page__panel">
        <div className="login-page__language">
          <LanguageSwitcher />
        </div>
        <div className="login-page__brand">
          <LogoMark className="login-page__logo" />
          <span className="login-page__brand-name">{t('app.name')}</span>
        </div>

        <div className="card login-page__card">
          <h1 className="login-page__title">{t('auth.signIn')}</h1>
          <p className="login-page__subtitle">{t('auth.subtitle')}</p>
          <LoginForm />
        </div>

        <p className="login-page__notice">{t('auth.notice')}</p>
      </div>
    </main>
  )
}
