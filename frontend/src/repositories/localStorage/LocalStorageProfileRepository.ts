import type { Profile } from '../../types/profile'
import type { ProfileRepository } from '../ProfileRepository'
import { STORAGE_KEYS } from './keys'
import { readJson, writeJson } from './storage'

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false
  const { firstName, lastName, birthDate, updatedAt } = value as Partial<Profile>
  return (
    typeof firstName === 'string' &&
    typeof lastName === 'string' &&
    (birthDate === null || typeof birthDate === 'string') &&
    typeof updatedAt === 'string'
  )
}

export class LocalStorageProfileRepository implements ProfileRepository {
  async get(): Promise<Profile | null> {
    const value = readJson(STORAGE_KEYS.profile)
    return isProfile(value) ? value : null
  }

  async save(profile: Profile): Promise<void> {
    writeJson(STORAGE_KEYS.profile, profile)
  }
}
