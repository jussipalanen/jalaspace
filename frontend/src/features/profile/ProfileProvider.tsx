import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { profileRepository } from '../../repositories'
import type { ProfileRepository } from '../../repositories/ProfileRepository'
import { buildProfile, defaultProfile, fullName, type ProfileFormValues } from '../../services/profile'
import type { Profile } from '../../types/profile'
import { useAuth } from '../auth/useAuth'
import { ProfileContext, type ProfileContextValue } from './ProfileContext'

interface ProfileProviderProps {
  children: ReactNode
  /** Injectable for tests or a future API-backed implementation. */
  repository?: ProfileRepository
}

export function ProfileProvider({ children, repository = profileRepository }: ProfileProviderProps) {
  const { session } = useAuth()
  const user = session?.user ?? null
  const [saved, setSaved] = useState<{ userId: string; profile: Profile | null } | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    repository
      .get()
      .catch(() => null)
      .then((profile) => {
        if (!cancelled) setSaved({ userId: user.id, profile })
      })
    return () => {
      cancelled = true
    }
  }, [repository, user])

  const reloadProfile = useCallback(async () => {
    if (!user) return
    const profile = await repository.get().catch(() => null)
    setSaved({ userId: user.id, profile })
  }, [repository, user])

  const saveProfile = useCallback(
    async (values: ProfileFormValues) => {
      if (!user) throw new Error('Cannot save a profile while signed out')
      const profile = buildProfile(values, new Date())
      await repository.save(profile)
      setSaved({ userId: user.id, profile })
      return profile
    },
    [repository, user],
  )

  const value = useMemo<ProfileContextValue>(() => {
    if (!user) {
      return { profile: null, loaded: false, email: '', displayName: '', saveProfile, reloadProfile }
    }
    const loaded = saved?.userId === user.id
    const profile = (loaded ? saved.profile : null) ?? defaultProfile(user)
    return {
      profile,
      loaded,
      email: user.email,
      displayName: fullName(profile) || user.name,
      saveProfile,
      reloadProfile,
    }
  }, [user, saved, saveProfile, reloadProfile])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
