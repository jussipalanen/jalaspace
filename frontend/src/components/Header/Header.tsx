import { MenuIcon } from '../icons'
import './Header.css'

interface HeaderProps {
  title: string
  sidebarId: string
  isSidebarOpen: boolean
  onMenuClick: () => void
}

export function Header({ title, sidebarId, isSidebarOpen, onMenuClick }: HeaderProps) {
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
            DU
          </span>
          <span className="header__user-name">Demo User</span>
        </div>
      </div>
    </header>
  )
}
