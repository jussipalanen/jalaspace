import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { Header } from '../components/Header/Header'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useRouteTitle } from '../hooks/useRouteTitle'
import './AppLayout.css'

const SIDEBAR_ID = 'app-sidebar'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const title = useRouteTitle()
  useDocumentTitle(title)

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
        Skip to content
      </a>

      <Sidebar id={SIDEBAR_ID} isOpen={isSidebarOpen} onClose={closeSidebar} />

      {isSidebarOpen && (
        <div className="app-layout__backdrop" onClick={closeSidebar} aria-hidden="true" />
      )}

      <div className="app-layout__main">
        <Header
          title={title}
          sidebarId={SIDEBAR_ID}
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main id="main-content" className="app-layout__content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
