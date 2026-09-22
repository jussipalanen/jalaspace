import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import { STORAGE_KEYS } from '../repositories/localStorage/keys'
import { routes } from '../router'
import type { Session } from '../types/auth'

export const testSession: Session = {
  user: { id: 'demo-user', email: 'demo@jalaspace.app', name: 'Demo User' },
  createdAt: '2026-09-22T10:30:00.000Z',
}

interface RenderRouteOptions {
  /** Start with a signed-in demo session (default: true). */
  authenticated?: boolean
}

export function renderRoute(path: string, { authenticated = true }: RenderRouteOptions = {}) {
  if (authenticated) {
    window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(testSession))
  }

  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return {
    router,
    ...render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    ),
  }
}
