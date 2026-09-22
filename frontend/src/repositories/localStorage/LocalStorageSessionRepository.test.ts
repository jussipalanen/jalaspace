import { describe, expect, it } from 'vitest'
import type { Session } from '../../types/auth'
import { STORAGE_KEYS } from './keys'
import { LocalStorageSessionRepository } from './LocalStorageSessionRepository'

const session: Session = {
  user: { id: 'demo-user', email: 'demo@jalaspace.app', name: 'Demo User' },
  createdAt: '2026-09-22T10:30:00.000Z',
}

describe('LocalStorageSessionRepository', () => {
  it('returns null when no session is stored', async () => {
    expect(await new LocalStorageSessionRepository().get()).toBeNull()
  })

  it('saves and restores a session under the namespaced key', async () => {
    const repository = new LocalStorageSessionRepository()
    await repository.save(session)

    expect(window.localStorage.getItem(STORAGE_KEYS.session)).not.toBeNull()
    expect(await new LocalStorageSessionRepository().get()).toEqual(session)
  })

  it('clears the stored session', async () => {
    const repository = new LocalStorageSessionRepository()
    await repository.save(session)
    await repository.clear()

    expect(await repository.get()).toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull()
  })

  it.each([
    ['corrupt JSON', '{not json'],
    ['an unexpected shape', JSON.stringify({ user: 'demo' })],
  ])('treats %s as no session', async (_, raw) => {
    window.localStorage.setItem(STORAGE_KEYS.session, raw)
    expect(await new LocalStorageSessionRepository().get()).toBeNull()
  })
})
