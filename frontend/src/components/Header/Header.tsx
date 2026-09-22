import { LogOutIcon, MenuIcon } from '../icons'
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
  return (
    <header className="header">
      <button
        type="button"
        className="icon-button header__menu"
        onClick={onMenuClick}
        aria-label="Open navigation"
        aria-controls={sidebarId}
        aria-expanded={isSidebarOpen}
      >
        <MenuIcon />
      </button>

      <p className="header__title">{title}</p>

      <div className="header__end">
        <span className="badge">Demo</span>
        <div className="header__user">
          <span className="header__avatar" aria-hidden="true">
            {getInitials(userName)}
          </span>
          <span className="header__user-name">{userName}</span>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOutIcon />
        </button>
      </div>
    </header>
  )
}
