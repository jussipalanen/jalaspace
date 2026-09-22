import { describe, expect, it } from 'vitest'
import { parseSuggestion, parseSuggestionRequest, SuggestionError } from './suggestions.ts'

describe('suggestion request', () => {
  it('accepts a description and defaults to English', () => {
    expect(parseSuggestionRequest({ description: ' Water is leaking. ' })).toEqual({
      ok: true,
      values: { title: '', description: 'Water is leaking.', language: 'en' },
    })
    expect(parseSuggestionRequest({ description: 'Vesivuoto', language: 'fi' })).toEqual({
      ok: true,
      values: { title: '', description: 'Vesivuoto', language: 'fi' },
    })
  })

  it('accepts only a title, or a title and a description', () => {
    expect(parseSuggestionRequest({ title: ' Kitchen sink leak ' })).toEqual({
      ok: true,
      values: { title: 'Kitchen sink leak', description: '', language: 'en' },
    })
    expect(parseSuggestionRequest({ title: 'Sink leak', description: 'Since this morning' })).toEqual({
      ok: true,
      values: { title: 'Sink leak', description: 'Since this morning', language: 'en' },
    })
  })

  it('requires a title or a description', () => {
    expect(parseSuggestionRequest({ title: ' ', description: '  ' })).toEqual({
      ok: false,
      errors: { description: 'required' },
    })
    expect(parseSuggestionRequest({})).toEqual({ ok: false, errors: { description: 'required' } })
  })

  it('limits the description to 2000 and the title to 120 characters', () => {
    expect(parseSuggestionRequest({ description: 'x'.repeat(2000) }).ok).toBe(true)
    expect(parseSuggestionRequest({ description: 'x'.repeat(2001) })).toEqual({
      ok: false,
      errors: { description: 'tooLong' },
    })
    expect(parseSuggestionRequest({ title: 'x'.repeat(120) }).ok).toBe(true)
    expect(parseSuggestionRequest({ title: 'x'.repeat(121) })).toEqual({
      ok: false,
      errors: { title: 'tooLong' },
    })
  })

  it('rejects unknown languages and wrong types', () => {
    expect(parseSuggestionRequest({ title: 7, description: 42, language: 'sv' })).toEqual({
      ok: false,
      errors: { title: 'invalid', description: 'invalid', language: 'invalid' },
    })
  })
})

describe('suggestion from the model', () => {
  it('accepts a known category and priority and tidies the title and description', () => {
    expect(
      parseSuggestion({
        title: '  Kitchen sink   leak ',
        description: ' Water leaks under the  kitchen sink. \n\n\n It started this morning. ',
        category: 'plumbing',
        priority: 'high',
      }),
    ).toEqual({
      title: 'Kitchen sink leak',
      description: 'Water leaks under the kitchen sink.\n\nIt started this morning.',
      category: 'plumbing',
      priority: 'high',
    })
  })

  const valid = { title: 'Leak', description: 'Water leaks.', category: 'plumbing', priority: 'high' }

  it.each([
    ['not an object', 'Kitchen sink leak'],
    ['an empty title', { ...valid, title: ' ' }],
    ['a too long title', { ...valid, title: 'x'.repeat(121) }],
    ['a missing description', { ...valid, description: undefined }],
    ['an empty description', { ...valid, description: ' \n ' }],
    ['a too long description', { ...valid, description: 'x'.repeat(5001) }],
    ['an unknown category', { ...valid, category: 'water' }],
    ['an unknown priority', { ...valid, priority: 'urgent' }],
  ])('rejects %s', (_case, value) => {
    expect(() => parseSuggestion(value)).toThrow(SuggestionError)
    try {
      parseSuggestion(value)
    } catch (error) {
      expect((error as SuggestionError).code).toBe('invalid_suggestion')
    }
  })
})
