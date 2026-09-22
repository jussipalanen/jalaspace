import { describe, expect, it } from 'vitest'
import { getLeaseStatus } from './leases'

const today = '2026-09-22'

describe('getLeaseStatus', () => {
  it.each([
    ['starts tomorrow', { startDate: '2026-09-23', endDate: null }, 'upcoming'],
    ['starts today', { startDate: '2026-09-22', endDate: null }, 'active'],
    ['is open-ended', { startDate: '2020-01-01', endDate: null }, 'active'],
    ['ends today', { startDate: '2025-01-01', endDate: '2026-09-22' }, 'active'],
    ['ended yesterday', { startDate: '2025-01-01', endDate: '2026-09-21' }, 'ended'],
  ] as const)('a lease that %s is %s', (_, lease, expected) => {
    expect(getLeaseStatus(lease, today)).toBe(expected)
  })
})
