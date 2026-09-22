import { Navigate, useLocation } from 'react-router'
import { LogoMark } from '../components/icons'
import { LoginForm } from '../features/auth/LoginForm'
import type { LoginLocationState } from '../features/auth/RequireAuth'
import { useAuth } from '../features/auth/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
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
  useDocumentTitle('Sign in')

  if (status === 'loading') return null
  if (status === 'authenticated') {
    return <Navigate to={getRedirectTarget(location.state)} replace />
  }

  return (
    <main className="login-page">
      <div className="login-page__panel">
        <div className="login-page__brand">
          <LogoMark className="login-page__logo" />
          <span className="login-page__brand-name">JalaSpace</span>
        </div>

        <div className="card login-page__card">
          <h1 className="login-page__title">Sign in</h1>
          <p className="login-page__subtitle">Property and space management demo</p>
          <LoginForm />
        </div>

        <p className="login-page__notice">
          This is a demo. Sign-in is simulated in your browser and is not secure. Data is
          stored only in this browser.
        </p>
      </div>
    </main>
  )
}
