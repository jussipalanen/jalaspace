import { describe, expect, it } from 'vitest'
import type { SessionRepository } from '../repositories/SessionRepository'
import type { Session } from '../types/auth'
import { createDemoAuthService, InvalidCredentialsError } from './authService'

function createMemoryRepository(): SessionRepository & { stored: Session | null } {
  return {
    stored: null,
    async get() {
      return this.stored
    },
    async save(session) {
      this.stored = session
    },
    async clear() {
      this.stored = null
    },
  }
}

const fixedNow = () => new Date('2026-09-22T10:30:00.000Z')

describe('demo auth service', () => {
  it('signs in with the demo credentials and persists the session', async () => {
    const repository = createMemoryRepository()
    const service = createDemoAuthService(repository, fixedNow)

    const session = await service.login({ email: 'demo@jalaspace.app', password: 'demo' })

    expect(session.user.email).toBe('demo@jalaspace.app')
    expect(session.createdAt).toBe('2026-09-22T10:30:00.000Z')
    expect(repository.stored).toEqual(session)
  })

  it('accepts the email with surrounding whitespace and different case', async () => {
    const service = createDemoAuthService(createMemoryRepository(), fixedNow)

    await expect(
      service.login({ email: '  Demo@JalaSpace.app ', password: 'demo' }),
    ).resolves.toBeDefined()
  })

  it.each([
    ['wrong password', { email: 'demo@jalaspace.app', password: 'wrong' }],
    ['unknown email', { email: 'someone@jalaspace.app', password: 'demo' }],
    ['case-changed password', { email: 'demo@jalaspace.app', password: 'DEMO' }],
  ])('rejects a %s without storing a session', async (_, credentials) => {
    const repository = createMemoryRepository()
    const service = createDemoAuthService(repository, fixedNow)

    await expect(service.login(credentials)).rejects.toBeInstanceOf(InvalidCredentialsError)
    expect(repository.stored).toBeNull()
  })

  it('clears the session on logout', async () => {
    const repository = createMemoryRepository()
    const service = createDemoAuthService(repository, fixedNow)
    await service.login({ email: 'demo@jalaspace.app', password: 'demo' })

    await service.logout()

    expect(await service.getSession()).toBeNull()
  })
})
