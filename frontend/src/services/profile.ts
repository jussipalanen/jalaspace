import type { User } from '../types/auth'
import type { IsoDate } from '../types/common'
import type { Profile } from '../types/profile'
import { toIsoDate } from '../utils/date'

export const PROFILE_NAME_MAX_LENGTH = 50
/** How many years back the birthdate year list goes. */
export const BIRTH_YEAR_RANGE = 120

/** Form values; birthdate parts are strings from the selects ('' = not chosen). */
export interface ProfileFormValues {
  firstName: string
  lastName: string
  birthDay: string
  birthMonth: string
  birthYear: string
}

/** Error codes per field; the UI translates them (`settings.profile.validation.<field>.<code>`). */
export interface ProfileFormErrors {
  firstName?: 'required' | 'tooLong'
  lastName?: 'required' | 'tooLong'
  birthDate?: 'incomplete' | 'invalid' | 'future'
}

/** Profile used until the user saves their own, based on the signed-in user's name. */
export function defaultProfile(user: User): Profile {
  const [firstName = '', ...rest] = user.name.trim().split(/\s+/)
  return { firstName, lastName: rest.join(' '), birthDate: null, updatedAt: '' }
}

export function fullName(profile: Pick<Profile, 'firstName' | 'lastName'>): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ')
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Number of Day options for the chosen month and year (Feb has 29 until a year is chosen). */
export function dayOptionCount(month: string, year: string): number {
  if (!month) return 31
  return daysInMonth(year ? Number(year) : 2000, Number(month))
}

export function birthYearOptions(today: Date): number[] {
  const current = today.getFullYear()
  return Array.from({ length: BIRTH_YEAR_RANGE + 1 }, (_, index) => current - index)
}

export function toProfileForm(profile: Profile): ProfileFormValues {
  const [year = '', month = '', day = ''] = profile.birthDate?.split('-') ?? []
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthDay: day ? String(Number(day)) : '',
    birthMonth: month ? String(Number(month)) : '',
    birthYear: year,
  }
}

/** Combines the three parts into an ISO date, or `null` if the date does not exist. */
export function toBirthDate(day: string, month: string, year: string): IsoDate | null {
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function validateProfileForm(values: ProfileFormValues, today: Date): ProfileFormErrors {
  const errors: ProfileFormErrors = {}

  for (const field of ['firstName', 'lastName'] as const) {
    const value = values[field].trim()
    if (!value) errors[field] = 'required'
    else if (value.length > PROFILE_NAME_MAX_LENGTH) errors[field] = 'tooLong'
  }

  const parts = [values.birthDay, values.birthMonth, values.birthYear]
  const chosen = parts.filter(Boolean).length
  if (chosen > 0 && chosen < 3) {
    errors.birthDate = 'incomplete'
  } else if (chosen === 3) {
    const birthDate = toBirthDate(values.birthDay, values.birthMonth, values.birthYear)
    if (!birthDate) errors.birthDate = 'invalid'
    else if (birthDate > toIsoDate(today)) errors.birthDate = 'future'
  }

  return errors
}

/** Builds the profile to save from validated form values. */
export function buildProfile(values: ProfileFormValues, now: Date): Profile {
  const hasBirthDate = Boolean(values.birthDay && values.birthMonth && values.birthYear)
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    birthDate: hasBirthDate ? toBirthDate(values.birthDay, values.birthMonth, values.birthYear) : null,
    updatedAt: now.toISOString(),
  }
}
