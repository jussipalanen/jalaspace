import { NavLink } from 'react-router'
import { isSharedData } from '../../config/dataProvider'
import { mainNavigation, secondaryNavigation } from '../../config/navigation'
import { useTranslation } from '../../i18n/useTranslation'
import type { NavItem } from '../../types/navigation'
import { CloseIcon, LogoMark } from '../icons'
import './Sidebar.css'

interface SidebarProps {
  id: string
  isOpen: boolean
  onClose: () => void
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const { t } = useTranslation()
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
        <span>{t(item.labelKey)}</span>
      </NavLink>
    </li>
  )
}

export function Sidebar({ id, isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()

  return (
    <aside id={id} className={isOpen ? 'sidebar is-open' : 'sidebar'} aria-label={t('nav.sidebar')}>
      <div className="sidebar__brand">
        <LogoMark className="sidebar__logo" />
        <span className="sidebar__brand-name">{t('app.name')}</span>
        <button
          type="button"
          className="icon-button sidebar__close"
          onClick={onClose}
          aria-label={t('nav.close')}
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label={t('nav.main')}>
        {mainNavigation.map((section) => {
          const headingId = `${id}-${section.titleKey.replaceAll('.', '-')}`
          return (
            <div key={section.titleKey} className="sidebar__section">
              <p className="sidebar__section-title" id={headingId}>
                {t(section.titleKey)}
              </p>
              <ul className="sidebar__list" aria-labelledby={headingId}>
                {section.items.map((item) => (
                  <SidebarLink key={item.to} item={item} onNavigate={onClose} />
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <ul className="sidebar__list">
          {secondaryNavigation.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </ul>
        <p className="sidebar__demo-note">
          {t(isSharedData() ? 'nav.demoNoteShared' : 'nav.demoNote')}
        </p>
      </div>
    </aside>
  )
}
