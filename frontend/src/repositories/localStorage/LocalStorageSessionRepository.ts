import type { Session } from '../../types/auth'
import type { SessionRepository } from '../SessionRepository'
import { STORAGE_KEYS } from './keys'
import { readJson, removeItem, writeJson } from './storage'

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const { user, createdAt } = value as Partial<Session>
  return (
    typeof createdAt === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string'
  )
}

export class LocalStorageSessionRepository implements SessionRepository {
  async get(): Promise<Session | null> {
    const value = readJson(STORAGE_KEYS.session)
    return isSession(value) ? value : null
  }

  async save(session: Session): Promise<void> {
    writeJson(STORAGE_KEYS.session, session)
  }

  async clear(): Promise<void> {
    removeItem(STORAGE_KEYS.session)
  }
}
