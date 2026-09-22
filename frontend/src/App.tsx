import { RouterProvider } from 'react-router'
import { AuthProvider } from './features/auth/AuthProvider'
import { I18nProvider } from './i18n/I18nProvider'
import { router } from './router'

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </I18nProvider>
  )
}
