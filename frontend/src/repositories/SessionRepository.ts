import type { Session } from '../types/auth'

export interface SessionRepository {
  get(): Promise<Session | null>
  save(session: Session): Promise<void>
  clear(): Promise<void>
}
