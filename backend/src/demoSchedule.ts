// Restores the demo data once a day. Kept apart from server.ts so the timing
// can be tested with a fixed clock.

/** A time of day in UTC. */
export interface DailyTime {
  hours: number
  minutes: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Parses `HH:MM` (24-hour clock), or returns `null` if it is not a real time. */
export function parseDailyTime(value: string): DailyTime | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours <= 23 && minutes <= 59 ? { hours, minutes } : null
}

/** Milliseconds from `now` until the next `at` (UTC); a full day when it is exactly now. */
export function msUntilNext(at: DailyTime, now: Date): number {
  const next = new Date(now)
  next.setUTCHours(at.hours, at.minutes, 0, 0)
  if (next.getTime() <= now.getTime()) next.setTime(next.getTime() + DAY_MS)
  return next.getTime() - now.getTime()
}

/** Timer functions, replaceable in tests. */
export interface Timers {
  setTimeout: (callback: () => void, ms: number) => { unref?: () => unknown }
  now: () => Date
}

export interface DailyTaskOptions {
  at: DailyTime
  run: () => Promise<void>
  log?: (message: string) => void
  logError?: (error: unknown) => void
  timers?: Timers
}

/**
 * Runs `run` every day at `at` (UTC). A failed run is logged, and the next one
 * is still scheduled. The timer does not keep the process alive.
 */
export function scheduleDaily({
  at,
  run,
  log = console.log,
  logError = console.error,
  timers = { setTimeout: (callback, ms) => setTimeout(callback, ms), now: () => new Date() },
}: DailyTaskOptions): void {
  const scheduleNext = () => {
    const timer = timers.setTimeout(async () => {
      try {
        await run()
        log('Demo data restored (nightly reset)')
      } catch (error) {
        logError(error)
      }
      scheduleNext()
    }, msUntilNext(at, timers.now()))
    timer.unref?.()
  }
  scheduleNext()
}
