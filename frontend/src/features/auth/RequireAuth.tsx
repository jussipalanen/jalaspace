import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

export interface LoginLocationState {
  from?: string
}

/** Renders children only for signed-in users; otherwise redirects to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return null

  if (status === 'unauthenticated') {
    const state: LoginLocationState = {
      from: location.pathname + location.search + location.hash,
    }
    return <Navigate to="/login" replace state={state} />
  }

  return children
}
