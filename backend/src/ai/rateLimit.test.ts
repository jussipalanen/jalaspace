import { describe, expect, it } from 'vitest'
import { RateLimiter } from './rateLimit.ts'

describe('rate limiter', () => {
  it('allows the limit per key and window, then says when to retry', () => {
    let now = 0
    const limiter = new RateLimiter({ limit: 2, windowMs: 60_000, now: () => now })

    expect(limiter.hit('a')).toEqual({ allowed: true })
    expect(limiter.hit('a')).toEqual({ allowed: true })
    now = 15_000
    expect(limiter.hit('a')).toEqual({ allowed: false, retryAfterSeconds: 45 })
    expect(limiter.hit('b')).toEqual({ allowed: true })

    now = 60_000
    expect(limiter.hit('a')).toEqual({ allowed: true })
  })
})
