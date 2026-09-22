import { Link } from 'react-router'
import { useTranslation } from '../../i18n/useTranslation'
import { LogOutIcon, MenuIcon } from '../icons'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import './Header.css'

interface HeaderProps {
  title: string
  userName: string
  sidebarId: string
  isSidebarOpen: boolean
  onMenuClick: () => void
  onSignOut: () => void
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Header({
  title,
  userName,
  sidebarId,
  isSidebarOpen,
  onMenuClick,
  onSignOut,
}: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="header">
      <button
        type="button"
        className="icon-button header__menu"
        onClick={onMenuClick}
        aria-label={t('nav.open')}
        aria-controls={sidebarId}
        aria-expanded={isSidebarOpen}
      >
        <MenuIcon />
      </button>

      <p className="header__title">{title}</p>

      <div className="header__end">
        <LanguageSwitcher />
        <span className="badge header__badge">{t('app.demoBadge')}</span>
        <Link to="/settings" className="header__user" title={t('header.editProfile')}>
          <span className="header__avatar" aria-hidden="true">
            {getInitials(userName)}
          </span>
          <span className="header__user-name">{userName}</span>
          <span className="visually-hidden">{t('header.editProfile')}</span>
        </Link>
        <button
          type="button"
          className="icon-button"
          onClick={onSignOut}
          aria-label={t('header.signOut')}
          title={t('header.signOut')}
        >
          <LogOutIcon />
        </button>
      </div>
    </header>
  )
}
