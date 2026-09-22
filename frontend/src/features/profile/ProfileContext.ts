import { createContext } from 'react'
import type { ProfileFormValues } from '../../services/profile'
import type { Profile } from '../../types/profile'

export interface ProfileContextValue {
  /** Saved profile, or the default based on the signed-in user. `null` while signed out. */
  profile: Profile | null
  /** False until the saved profile has been read; forms should wait for it. */
  loaded: boolean
  email: string
  displayName: string
  saveProfile(values: ProfileFormValues): Promise<Profile>
  /** Reads the stored profile again, e.g. after the demo data was reset. */
  reloadProfile(): Promise<void>
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)
