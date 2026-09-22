import { RouterProvider } from 'react-router'
import { AuthProvider } from './features/auth/AuthProvider'
import { ProfileProvider } from './features/profile/ProfileProvider'
import { I18nProvider } from './i18n/I18nProvider'
import { router } from './router'

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <RouterProvider router={router} />
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
