import { describe, expect, it } from 'vitest'
import { parseSuggestion, parseSuggestionRequest, SuggestionError } from './suggestions.ts'

describe('suggestion request', () => {
  it('accepts a description and defaults to English', () => {
    expect(parseSuggestionRequest({ description: ' Water is leaking. ' })).toEqual({
      ok: true,
      values: { description: 'Water is leaking.', language: 'en' },
    })
    expect(parseSuggestionRequest({ description: 'Vesivuoto', language: 'fi' })).toEqual({
      ok: true,
      values: { description: 'Vesivuoto', language: 'fi' },
    })
  })

  it('requires a description of at most 2000 characters', () => {
    expect(parseSuggestionRequest({ description: '  ' })).toEqual({
      ok: false,
      errors: { description: 'required' },
    })
    expect(parseSuggestionRequest({ description: 'x'.repeat(2000) }).ok).toBe(true)
    expect(parseSuggestionRequest({ description: 'x'.repeat(2001) })).toEqual({
      ok: false,
      errors: { description: 'tooLong' },
    })
  })

  it('rejects unknown languages and wrong types', () => {
    expect(parseSuggestionRequest({ description: 42, language: 'sv' })).toEqual({
      ok: false,
      errors: { description: 'invalid', language: 'invalid' },
    })
  })
})

describe('suggestion from the model', () => {
  it('accepts a known category and priority and tidies the title', () => {
    expect(parseSuggestion({ title: '  Kitchen sink   leak ', category: 'plumbing', priority: 'high' })).toEqual({
      title: 'Kitchen sink leak',
      category: 'plumbing',
      priority: 'high',
    })
  })

  it.each([
    ['not an object', 'Kitchen sink leak'],
    ['an empty title', { title: ' ', category: 'plumbing', priority: 'high' }],
    ['a too long title', { title: 'x'.repeat(121), category: 'plumbing', priority: 'high' }],
    ['an unknown category', { title: 'Leak', category: 'water', priority: 'high' }],
    ['an unknown priority', { title: 'Leak', category: 'plumbing', priority: 'urgent' }],
  ])('rejects %s', (_case, value) => {
    expect(() => parseSuggestion(value)).toThrow(SuggestionError)
    try {
      parseSuggestion(value)
    } catch (error) {
      expect((error as SuggestionError).code).toBe('invalid_suggestion')
    }
  })
})
