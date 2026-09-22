import { describe, expect, it } from 'vitest'
import { detectLanguage, isLanguage } from './languages'

describe('detectLanguage', () => {
  it('prefers a stored, supported choice', () => {
    expect(detectLanguage('fi', ['en-US'])).toBe('fi')
    expect(detectLanguage('en', ['fi-FI'])).toBe('en')
  })

  it('ignores an unsupported stored value', () => {
    expect(detectLanguage('sv', ['fi-FI'])).toBe('fi')
    expect(detectLanguage(42, [])).toBe('en')
  })

  it('uses the first supported browser language', () => {
    expect(detectLanguage(null, ['fi-FI', 'en-US'])).toBe('fi')
    expect(detectLanguage(null, ['FI'])).toBe('fi')
    expect(detectLanguage(null, ['sv-SE', 'fi', 'en'])).toBe('fi')
    expect(detectLanguage(null, ['en-US', 'fi-FI'])).toBe('en')
  })

  it('falls back to English', () => {
    expect(detectLanguage(null, ['sv-SE', 'de'])).toBe('en')
    expect(detectLanguage(null, [])).toBe('en')
  })

  it('recognises supported languages', () => {
    expect(isLanguage('fi')).toBe(true)
    expect(isLanguage('fi-FI')).toBe(false)
  })
})
