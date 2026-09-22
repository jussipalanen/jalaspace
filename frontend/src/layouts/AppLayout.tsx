import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { FlashMessage } from '../components/FlashMessage/FlashMessage'
import { Header } from '../components/Header/Header'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { useAuth } from '../features/auth/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useRouteTitleKey } from '../hooks/useRouteTitle'
import { useTranslation } from '../i18n/useTranslation'
import './AppLayout.css'

const SIDEBAR_ID = 'app-sidebar'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { session, logout } = useAuth()
  const { t } = useTranslation()
  const titleKey = useRouteTitleKey()
  const title = titleKey ? t(titleKey) : t('app.name')
  useDocumentTitle(titleKey ? title : null)

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])

  useEffect(() => {
    if (!isSidebarOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        {t('app.skipToContent')}
      </a>

      <Sidebar id={SIDEBAR_ID} isOpen={isSidebarOpen} onClose={closeSidebar} />

      {isSidebarOpen && (
        <div className="app-layout__backdrop" onClick={closeSidebar} aria-hidden="true" />
      )}

      <div className="app-layout__main">
        <Header
          title={title}
          userName={session?.user.name ?? ''}
          sidebarId={SIDEBAR_ID}
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen(true)}
          onSignOut={() => void logout()}
        />
        <main id="main-content" className="app-layout__content" tabIndex={-1}>
          <FlashMessage />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
