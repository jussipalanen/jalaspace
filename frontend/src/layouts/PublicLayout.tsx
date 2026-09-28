import { Link, Outlet } from 'react-router'
import { LogoMark } from '../components/icons'
import { LanguageSwitcher } from '../components/LanguageSwitcher/LanguageSwitcher'
import { useAuth } from '../features/auth/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useRouteTitleKey } from '../hooks/useRouteTitle'
import { useTranslation } from '../i18n/useTranslation'
import './PublicLayout.css'

/**
 * Layout of the pages anyone can open without signing in: the application
 * form for people looking for a space. No sidebar; a link to sign in for
 * property managers, or back to the app when already signed in.
 */
export function PublicLayout() {
  const { t } = useTranslation()
  const { status } = useAuth()
  const titleKey = useRouteTitleKey()
  useDocumentTitle(titleKey ? t(titleKey) : null)

  return (
    <div className="public-layout">
      <a className="skip-link" href="#main-content">
        {t('app.skipToContent')}
      </a>
      <header className="public-layout__header">
        <div className="public-layout__bar">
          <Link to="/apply" className="public-layout__brand" aria-label={t('apply.header.home')}>
            <LogoMark className="public-layout__logo" />
            <span className="public-layout__name" aria-hidden="true">
              {t('app.name')}
            </span>
          </Link>
          <div className="public-layout__actions">
            <LanguageSwitcher />
            {status === 'authenticated' ? (
              <Link to="/" className="public-layout__sign-in">
                {t('apply.header.backToApp')}
              </Link>
            ) : (
              <Link to="/login" className="public-layout__sign-in">
                {t('apply.header.signIn')}
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" className="public-layout__content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
