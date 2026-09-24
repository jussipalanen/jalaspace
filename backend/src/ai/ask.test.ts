import { describe, expect, it } from 'vitest'
import { AskError, parseAskAnswer, parseAskRequest } from './ask.ts'

const question = 'available three-room apartment with a sauna, cheap please'

function codeOf(run: () => unknown): string {
  try {
    run()
  } catch (error) {
    if (error instanceof AskError) return error.code
    throw error
  }
  throw new Error('Expected the answer to be rejected')
}

describe('ask request', () => {
  it('accepts a question and a date, and tidies the spaces', () => {
    expect(parseAskRequest({ question: '  where is\n the API  documentation? ', today: '2026-09-24' })).toEqual({
      ok: true,
      values: { question: 'where is the API documentation?', today: '2026-09-24' },
    })
  })

  it('requires a question of at most 300 characters and a real date', () => {
    expect(parseAskRequest({ question: ' ', today: '2026-02-30' })).toEqual({
      ok: false,
      errors: { question: 'required', today: 'invalid' },
    })
    expect(parseAskRequest({ question: 'x'.repeat(301), today: '2026-09-24' })).toEqual({
      ok: false,
      errors: { question: 'tooLong' },
    })
    expect(parseAskRequest({ question: 42 })).toEqual({ ok: false, errors: { question: 'invalid', today: 'required' } })
  })
})

describe('ask answer', () => {
  it('accepts a known place', () => {
    expect(parseAskAnswer({ kind: 'navigate', place: 'settings.profile' }, question)).toEqual({
      kind: 'navigate',
      place: 'settings.profile',
    })
    expect(codeOf(() => parseAskAnswer({ kind: 'navigate', place: 'settings.password' }, question))).toBe(
      'invalid_answer',
    )
  })

  it("keeps only the chosen area's filter, without empty fields", () => {
    const answer = parseAskAnswer(
      {
        kind: 'search',
        area: 'spaces',
        spaces: {
          types: ['apartment'],
          statuses: ['available'],
          rooms: { min: 3, max: 3 },
          features: ['sauna', 'sauna'],
          city: '  ',
          tenant: null,
          floor: {},
          reserved: undefined,
        },
        properties: { city: 'Joensuu' },
        ignored: ['cheap', 'expensive', 'CHEAP'],
      },
      question,
    )
    expect(answer).toEqual({
      kind: 'search',
      area: 'spaces',
      filter: { types: ['apartment'], statuses: ['available'], rooms: { min: 3, max: 3 }, features: ['sauna'] },
      // Only words that are in the question.
      ignored: ['cheap'],
    })
  })

  it('lists everything in an area with an empty filter, sorted as asked', () => {
    expect(
      parseAskAnswer({ kind: 'search', area: 'tenants', sortBy: 'added', sortDirection: 'desc' }, 'newest tenants'),
    ).toEqual({ kind: 'search', area: 'tenants', filter: {}, sort: { by: 'added', direction: 'desc' }, ignored: [] })
  })

  it.each([
    ['an unknown kind', { kind: 'chat' }],
    ['an unknown area', { kind: 'search', area: 'owners' }],
    ['a field of another area', { kind: 'search', area: 'spaces', spaces: { priorities: ['high'] } }],
    ['an unknown value', { kind: 'search', area: 'spaces', spaces: { features: ['pool'] } }],
    ['a value out of range', { kind: 'search', area: 'spaces', spaces: { rooms: { min: 0 } } }],
    ['a decimal count', { kind: 'search', area: 'spaces', spaces: { rooms: { min: 2.5 } } }],
    ['min above max', { kind: 'search', area: 'spaces', spaces: { areaM2: { min: 80, max: 50 } } }],
    ['an invalid date', { kind: 'search', area: 'leases', leases: { endDate: { to: '2026-13-01' } } }],
    ['dates in the wrong order', { kind: 'search', area: 'leases', leases: { endDate: { from: '2027-01-01', to: '2026-01-01' } } }],
    ['text that is too long', { kind: 'search', area: 'tenants', tenants: { name: 'x'.repeat(101) } }],
    ['a boolean as text', { kind: 'search', area: 'maintenance', maintenance: { overdue: 'yes' } }],
    ['a sort of another area', { kind: 'search', area: 'tenants', sortBy: 'areaM2' }],
    ['an unknown sort direction', { kind: 'search', area: 'tenants', sortBy: 'name', sortDirection: 'up' }],
    ['a non-object', 'spaces'],
  ])('rejects %s', (_case, answer) => {
    expect(codeOf(() => parseAskAnswer(answer, question))).toBe('invalid_answer')
  })

  it('accepts every kind of field', () => {
    const answer = parseAskAnswer(
      {
        kind: 'search',
        area: 'leases',
        leases: {
          tenant: 'Nordic',
          tenantTypes: ['company'],
          statuses: ['active'],
          endDate: { from: '2026-09-24', to: '2026-12-31' },
          openEnded: false,
          monthlyRentEur: { min: 1000.5 },
        },
      },
      'active company leases ending this year',
    )
    expect(answer).toMatchObject({
      filter: {
        tenant: 'Nordic',
        tenantTypes: ['company'],
        statuses: ['active'],
        endDate: { from: '2026-09-24', to: '2026-12-31' },
        openEnded: false,
        monthlyRentEur: { min: 1000.5 },
      },
    })
  })

  it('answers none', () => {
    expect(parseAskAnswer({ kind: 'none', place: 'dashboard' }, 'weather?')).toEqual({ kind: 'none' })
  })
})
