import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ProfileProvider } from '../features/profile/ProfileProvider'
import { I18nProvider } from '../i18n/I18nProvider'
import type { Language } from '../i18n/languages'
import type { DataLayer } from '../repositories'
import { DataLayerProvider } from '../repositories/DataLayerProvider'
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
  /** Replace the configured repositories, e.g. with failing fakes. */
  dataLayer?: DataLayer
  /** UI language (default: English, as detected from jsdom's `en-US`). */
  language?: Language
}

export function renderRoute(
  path: string,
  { authenticated = true, dataLayer, language }: RenderRouteOptions = {},
) {
  if (language) {
    window.localStorage.setItem(STORAGE_KEYS.language, JSON.stringify(language))
  }
  if (authenticated) {
    window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(testSession))
  }

  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const app = (
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <RouterProvider router={router} />
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
  return {
    router,
    ...render(dataLayer ? <DataLayerProvider dataLayer={dataLayer}>{app}</DataLayerProvider> : app),
  }
}
