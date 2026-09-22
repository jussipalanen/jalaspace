import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { LeasesPage } from './pages/LeasesPage'
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
import type { RouteHandle } from './types/navigation'

const handle = (title: string): RouteHandle => ({ title })

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <DashboardPage />, handle: handle('Dashboard') },
          { path: 'properties', element: <PropertiesPage />, handle: handle('Properties') },
          {
            path: 'properties/:id',
            element: <PropertyDetailPage />,
            handle: handle('Property details'),
          },
          { path: 'units', element: <SpacesPage />, handle: handle('Spaces') },
          { path: 'maintenance', element: <MaintenancePage />, handle: handle('Maintenance') },
          {
            path: 'maintenance/:id',
            element: <MaintenanceDetailPage />,
            handle: handle('Maintenance task'),
          },
          { path: 'tenants', element: <TenantsPage />, handle: handle('Tenants') },
          { path: 'tenants/:id', element: <TenantDetailPage />, handle: handle('Tenant details') },
          { path: 'leases', element: <LeasesPage />, handle: handle('Leases') },
          { path: 'settings', element: <SettingsPage />, handle: handle('Settings') },
          { path: '*', element: <NotFoundPage />, handle: handle('Page not found') },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
