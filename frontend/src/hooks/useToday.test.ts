import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useToday } from './useToday'

describe('useToday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the local calendar date and keeps it across renders', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 2, 23, 59))
    const { result, rerender } = renderHook(() => useToday())
    expect(result.current).toBe('2026-09-02')

    vi.setSystemTime(new Date(2026, 8, 3, 0, 1))
    rerender()
    expect(result.current).toBe('2026-09-02')
  })
})
