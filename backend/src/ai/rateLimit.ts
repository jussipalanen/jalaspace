export interface RateLimitOptions {
  /** Requests allowed per key and window. */
  limit: number
  windowMs: number
  now?: () => number
}

/** AI requests per client: suggestions and questions together, 10 per 10 minutes. */
export const AI_RATE_LIMIT = 10
export const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

export function createAiRateLimiter(): RateLimiter {
  return new RateLimiter({ limit: AI_RATE_LIMIT, windowMs: AI_RATE_LIMIT_WINDOW_MS })
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

/**
 * Counts requests per key (the client IP) in fixed windows, in memory. The
 * counts reset when the server restarts, which is fine for protecting a demo.
 */
export class RateLimiter {
  readonly #limit: number
  readonly #windowMs: number
  readonly #now: () => number
  readonly #windows = new Map<string, { count: number; resetAt: number }>()

  constructor({ limit, windowMs, now = Date.now }: RateLimitOptions) {
    this.#limit = limit
    this.#windowMs = windowMs
    this.#now = now
  }

  /** Records a request for `key` and says whether it is allowed. */
  hit(key: string): RateLimitResult {
    const now = this.#now()
    this.#sweep(now)
    const window = this.#windows.get(key)
    if (!window || window.resetAt <= now) {
      this.#windows.set(key, { count: 1, resetAt: now + this.#windowMs })
      return { allowed: true }
    }
    if (window.count >= this.#limit) {
      return { allowed: false, retryAfterSeconds: Math.ceil((window.resetAt - now) / 1000) }
    }
    window.count++
    return { allowed: true }
  }

  /** Forgets expired windows once there are many, so memory stays bounded. */
  #sweep(now: number) {
    if (this.#windows.size < 10_000) return
    for (const [key, window] of this.#windows) {
      if (window.resetAt <= now) this.#windows.delete(key)
    }
  }
}
