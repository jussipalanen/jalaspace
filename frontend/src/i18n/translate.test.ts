import { describe, expect, it, vi } from 'vitest'
import { en, type Messages } from './locales/en'
import { fi } from './locales/fi'
import { createTranslator } from './translate'

const tEn = createTranslator(en, 'en-GB')
const tFi = createTranslator(fi, 'fi-FI')

describe('createTranslator', () => {
  it('translates by key', () => {
    expect(tEn('nav.items.properties')).toBe('Properties')
    expect(tFi('nav.items.properties')).toBe('Kiinteistöt')
  })

  it('fills in placeholders and formats numbers for the locale', () => {
    expect(tEn('pages.details.reference', { id: 'abc' })).toBe('Reference: abc')
    expect(tEn('dashboard.stats.available', { count: 1234 })).toBe('1,234 available')
    // Finnish groups thousands with a no-break space.
    expect(tFi('dashboard.stats.available', { count: 1234 })).toBe('1\u00a0234 vapaana')
  })

  it('keeps unknown placeholders visible', () => {
    expect(tEn('pages.details.reference')).toBe('Reference: {id}')
  })

  it('chooses plural forms by count in each language', () => {
    expect(tEn('dashboard.stats.inCities', { count: 1 })).toBe('In 1 city')
    expect(tEn('dashboard.stats.inCities', { count: 4 })).toBe('In 4 cities')
    expect(tEn('dashboard.stats.inCities', { count: 0 })).toBe('In 0 cities')
    expect(tFi('dashboard.stats.highPriority', { count: 1 })).toBe('1 kiireellinen')
    expect(tFi('dashboard.stats.highPriority', { count: 4 })).toBe('4 kiireellistä')
  })

  it('falls back to English when a translation is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const partial = { ...fi, header: {} } as unknown as Messages
    const t = createTranslator(partial, 'fi-FI')

    expect(t('header.signOut')).toBe('Sign out')
    expect(t('nav.items.properties')).toBe('Kiinteistöt')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('header.signOut'))
    warn.mockRestore()
  })
})

describe('dictionaries', () => {
  function leaves(node: unknown, path = ''): [string, string][] {
    if (typeof node === 'string') return [[path, node]]
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
      leaves(value, path ? `${path}.${key}` : key),
    )
  }

  it('have the same keys in Finnish and English', () => {
    expect(leaves(fi).map(([key]) => key)).toEqual(leaves(en).map(([key]) => key))
  })

  it('have no empty translations', () => {
    for (const [key, value] of [...leaves(en), ...leaves(fi)]) {
      expect(value.trim(), key).not.toBe('')
    }
  })

  it('use the same placeholders in both languages', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).toSorted()
    const finnish = new Map(leaves(fi))
    for (const [key, english] of leaves(en)) {
      expect(placeholders(finnish.get(key)!), key).toEqual(placeholders(english))
    }
  })
})
