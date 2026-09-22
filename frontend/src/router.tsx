import { createBrowserRouter, type RouteObject } from 'react-router'
import { RequireAuth } from './features/auth/RequireAuth'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { LeasesPage } from './pages/LeasesPage'
import { LoginPage } from './pages/LoginPage'
import { MaintenanceDetailPage } from './pages/MaintenanceDetailPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PropertiesPage } from './pages/PropertiesPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { RouteErrorPage } from './pages/RouteErrorPage'
import { SettingsPage } from './pages/SettingsPage'
import { SpacesPage } from './pages/SpacesPage'
import { TenantDetailPage } from './pages/TenantDetailPage'
import { TenantsPage } from './pages/TenantsPage'
import type { MessageKey } from './i18n/translate'
import type { RouteHandle } from './types/navigation'

const handle = (titleKey: MessageKey): RouteHandle => ({ titleKey })

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <DashboardPage />, handle: handle('pages.dashboard.title') },
          { path: 'properties', element: <PropertiesPage />, handle: handle('pages.properties.title') },
          {
            path: 'properties/:id',
            element: <PropertyDetailPage />,
            handle: handle('pages.propertyDetails.title'),
          },
          { path: 'units', element: <SpacesPage />, handle: handle('pages.spaces.title') },
          { path: 'maintenance', element: <MaintenancePage />, handle: handle('pages.maintenance.title') },
          {
            path: 'maintenance/:id',
            element: <MaintenanceDetailPage />,
            handle: handle('pages.maintenanceDetails.title'),
          },
          { path: 'tenants', element: <TenantsPage />, handle: handle('pages.tenants.title') },
          { path: 'tenants/:id', element: <TenantDetailPage />, handle: handle('pages.tenantDetails.title') },
          { path: 'leases', element: <LeasesPage />, handle: handle('pages.leases.title') },
          { path: 'settings', element: <SettingsPage />, handle: handle('pages.settings.title') },
          { path: '*', element: <NotFoundPage />, handle: handle('pages.notFound.title') },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
