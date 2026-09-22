import type { SessionRepository } from '../repositories/SessionRepository'
import type { LoginCredentials, Session, User } from '../types/auth'

/**
 * DEMO AUTHENTICATION ONLY.
 * Credentials are checked in the browser and are publicly documented.
 * This is not secure and must be replaced by server-side authentication
 * before handling any real data.
 */
export const DEMO_CREDENTIALS: LoginCredentials = {
  email: 'demo@jalaspace.app',
  password: 'demo',
}

const DEMO_USER: User = {
  id: 'demo-user',
  email: DEMO_CREDENTIALS.email,
  name: 'Demo User',
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password')
    this.name = 'InvalidCredentialsError'
  }
}

export interface AuthService {
  getSession(): Promise<Session | null>
  login(credentials: LoginCredentials): Promise<Session>
  logout(): Promise<void>
}

export function createDemoAuthService(
  repository: SessionRepository,
  now: () => Date = () => new Date(),
): AuthService {
  return {
    getSession: () => repository.get(),

    async login({ email, password }) {
      const matches =
        email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
        password === DEMO_CREDENTIALS.password
      if (!matches) throw new InvalidCredentialsError()

      const session: Session = { user: DEMO_USER, createdAt: now().toISOString() }
      await repository.save(session)
      return session
    },

    logout: () => repository.clear(),
  }
}
