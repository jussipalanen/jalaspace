import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { sessionRepository } from '../../repositories'
import { createDemoAuthService, type AuthService } from '../../services/authService'
import type { LoginCredentials, Session } from '../../types/auth'
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext'

const defaultAuthService = createDemoAuthService(sessionRepository)

interface AuthProviderProps {
  children: ReactNode
  /** Injectable for tests or a future API-backed implementation. */
  service?: AuthService
}

export function AuthProvider({ children, service = defaultAuthService }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false

    service
      .getSession()
      .catch(() => null)
      .then((restored) => {
        if (cancelled) return
        setSession(restored)
        setStatus(restored ? 'authenticated' : 'unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [service])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const newSession = await service.login(credentials)
      setSession(newSession)
      setStatus('authenticated')
    },
    [service],
  )

  const logout = useCallback(async () => {
    await service.logout()
    setSession(null)
    setStatus('unauthenticated')
  }, [service])

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, login, logout }),
    [status, session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
