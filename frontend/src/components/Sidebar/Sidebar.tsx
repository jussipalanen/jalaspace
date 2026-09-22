import { NavLink } from 'react-router'
import { mainNavigation, secondaryNavigation } from '../../config/navigation'
import type { NavItem } from '../../types/navigation'
import { CloseIcon, LogoMark } from '../icons'
import './Sidebar.css'

interface SidebarProps {
  id: string
  isOpen: boolean
  onClose: () => void
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) => (isActive ? 'sidebar__link is-active' : 'sidebar__link')}
      >
        <Icon className="sidebar__link-icon" />
        <span>{item.label}</span>
      </NavLink>
    </li>
  )
}

export function Sidebar({ id, isOpen, onClose }: SidebarProps) {
  return (
    <aside id={id} className={isOpen ? 'sidebar is-open' : 'sidebar'} aria-label="Sidebar">
      <div className="sidebar__brand">
        <LogoMark className="sidebar__logo" />
        <span className="sidebar__brand-name">JalaSpace</span>
        <button
          type="button"
          className="icon-button sidebar__close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {mainNavigation.map((section) => (
          <div key={section.title} className="sidebar__section">
            <p className="sidebar__section-title" id={`nav-${section.title.toLowerCase()}`}>
              {section.title}
            </p>
            <ul
              className="sidebar__list"
              aria-labelledby={`nav-${section.title.toLowerCase()}`}
            >
              {section.items.map((item) => (
                <SidebarLink key={item.to} item={item} onNavigate={onClose} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <ul className="sidebar__list">
          {secondaryNavigation.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </ul>
        <p className="sidebar__demo-note">
          Demo environment. Data is stored only in this browser.
        </p>
      </div>
    </aside>
  )
}
