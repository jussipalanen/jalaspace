import { describe, expect, it } from 'vitest'
import type { ProfileFormValues } from './profile'
import {
  birthYearOptions,
  buildProfile,
  dayOptionCount,
  defaultProfile,
  fullName,
  toBirthDate,
  toProfileForm,
  validateProfileForm,
} from './profile'

const today = new Date(2026, 8, 22)
const valid: ProfileFormValues = {
  firstName: 'Jussi',
  lastName: 'Alanen',
  birthDay: '22',
  birthMonth: '9',
  birthYear: '1990',
}

describe('profile defaults and names', () => {
  it('derives the default profile from the signed-in user', () => {
    expect(defaultProfile({ id: 'u', email: 'demo@jalaspace.app', name: 'Demo User' })).toEqual({
      firstName: 'Demo',
      lastName: 'User',
      birthDate: null,
      updatedAt: '',
    })
    expect(defaultProfile({ id: 'u', email: 'x', name: 'Anna Maria Virtanen' })).toMatchObject({
      firstName: 'Anna',
      lastName: 'Maria Virtanen',
    })
  })

  it('joins first and last name', () => {
    expect(fullName({ firstName: 'Jussi', lastName: 'Alanen' })).toBe('Jussi Alanen')
    expect(fullName({ firstName: 'Jussi', lastName: '' })).toBe('Jussi')
  })
})

describe('birthdate helpers', () => {
  it.each([
    ['22', '9', '1990', '1990-09-22'],
    ['1', '1', '2000', '2000-01-01'],
    ['29', '2', '2024', '2024-02-29'],
  ])('combines %s.%s.%s into %s', (day, month, year, expected) => {
    expect(toBirthDate(day, month, year)).toBe(expected)
  })

  it.each([
    ['31', '2', '1990'],
    ['29', '2', '2023'],
    ['31', '4', '1990'],
    ['0', '1', '1990'],
    ['1', '13', '1990'],
    ['x', '1', '1990'],
  ])('rejects the non-existent date %s.%s.%s', (day, month, year) => {
    expect(toBirthDate(day, month, year)).toBeNull()
  })

  it('offers as many days as the chosen month has', () => {
    expect(dayOptionCount('', '')).toBe(31)
    expect(dayOptionCount('2', '')).toBe(29)
    expect(dayOptionCount('2', '2023')).toBe(28)
    expect(dayOptionCount('2', '2024')).toBe(29)
    expect(dayOptionCount('4', '1990')).toBe(30)
  })

  it('lists years from this year back 120 years', () => {
    const years = birthYearOptions(today)
    expect(years[0]).toBe(2026)
    expect(years.at(-1)).toBe(1906)
    expect(years).toHaveLength(121)
  })

  it('converts a stored profile to form values and back', () => {
    const profile = buildProfile(valid, new Date('2026-09-22T10:30:00.000Z'))
    expect(profile.birthDate).toBe('1990-09-22')
    expect(toProfileForm(profile)).toEqual(valid)
    expect(toProfileForm({ ...profile, birthDate: null })).toMatchObject({
      birthDay: '',
      birthMonth: '',
      birthYear: '',
    })
  })
})

describe('validateProfileForm', () => {
  it('accepts a complete profile, with or without a birthdate', () => {
    expect(validateProfileForm(valid, today)).toEqual({})
    expect(
      validateProfileForm({ ...valid, birthDay: '', birthMonth: '', birthYear: '' }, today),
    ).toEqual({})
  })

  it('requires first and last name and limits their length', () => {
    expect(validateProfileForm({ ...valid, firstName: '  ', lastName: '' }, today)).toEqual({
      firstName: 'required',
      lastName: 'required',
    })
    expect(validateProfileForm({ ...valid, lastName: 'x'.repeat(51) }, today).lastName).toBe(
      'tooLong',
    )
    expect(validateProfileForm({ ...valid, lastName: 'x'.repeat(50) }, today)).toEqual({})
  })

  it.each([
    [{ birthYear: '' }, 'incomplete'],
    [{ birthDay: '', birthMonth: '' }, 'incomplete'],
    [{ birthDay: '31', birthMonth: '2' }, 'invalid'],
    [{ birthDay: '23', birthMonth: '9', birthYear: '2026' }, 'future'],
  ] as const)('rejects %j as %s', (change, code) => {
    expect(validateProfileForm({ ...valid, ...change }, today).birthDate).toBe(code)
  })

  it('accepts today as a birthdate', () => {
    expect(
      validateProfileForm({ ...valid, birthDay: '22', birthMonth: '9', birthYear: '2026' }, today),
    ).toEqual({})
  })
})

describe('buildProfile', () => {
  it('trims names and stores the save time', () => {
    const profile = buildProfile(
      { ...valid, firstName: ' Jussi ', lastName: ' Alanen ' },
      new Date('2026-09-22T10:30:00.000Z'),
    )
    expect(profile).toEqual({
      firstName: 'Jussi',
      lastName: 'Alanen',
      birthDate: '1990-09-22',
      updatedAt: '2026-09-22T10:30:00.000Z',
    })
  })
})
