import type { Profile } from '../types/profile'

export interface ProfileRepository {
  /** The saved profile, or `null` if none has been saved yet. */
  get(): Promise<Profile | null>
  save(profile: Profile): Promise<void>
}
