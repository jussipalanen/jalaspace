import { describe, expect, it } from 'vitest'
import { msUntilNext, parseDailyTime, scheduleDaily, type Timers } from './demoSchedule.ts'

const HOUR_MS = 60 * 60 * 1000
const at3 = { hours: 3, minutes: 0 }

describe('parseDailyTime', () => {
  it('reads HH:MM on a 24-hour clock', () => {
    expect(parseDailyTime('03:00')).toEqual({ hours: 3, minutes: 0 })
    expect(parseDailyTime(' 23:59 ')).toEqual({ hours: 23, minutes: 59 })
    expect(parseDailyTime('0:05')).toEqual({ hours: 0, minutes: 5 })
  })

  it.each(['24:00', '12:60', '3', '03:0', '-1:00', 'noon'])('rejects %j', (value) => {
    expect(parseDailyTime(value)).toBeNull()
  })
})

describe('msUntilNext', () => {
  it('waits until later the same day', () => {
    expect(msUntilNext(at3, new Date('2026-09-23T01:00:00.000Z'))).toBe(2 * HOUR_MS)
  })

  it('waits until the next day once the time has passed, across midnight and month ends', () => {
    expect(msUntilNext(at3, new Date('2026-09-23T10:00:00.000Z'))).toBe(17 * HOUR_MS)
    expect(msUntilNext(at3, new Date('2026-09-30T23:30:00.000Z'))).toBe(3.5 * HOUR_MS)
  })

  it('waits a full day when it is exactly the time now', () => {
    expect(msUntilNext(at3, new Date('2026-09-23T03:00:00.000Z'))).toBe(24 * HOUR_MS)
  })
})

describe('scheduleDaily', () => {
  /** Timers that record what was scheduled and let the test fire them. */
  function fakeTimers(start: string) {
    let now = new Date(start)
    const pending: { callback: () => void; ms: number; unref: boolean }[] = []
    const timers: Timers = {
      now: () => now,
      setTimeout: (callback, ms) => {
        const entry = { callback, ms, unref: false }
        pending.push(entry)
        return { unref: () => (entry.unref = true) }
      },
    }
    const fireNext = async () => {
      const next = pending.shift()!
      now = new Date(now.getTime() + next.ms)
      next.callback()
      // Let the async run and the rescheduling finish.
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    return { timers, pending, fireNext }
  }

  it('runs at the time every day, without keeping the process alive', async () => {
    const { timers, pending, fireNext } = fakeTimers('2026-09-23T10:00:00.000Z')
    const runs: string[] = []
    const logs: string[] = []

    scheduleDaily({ at: at3, timers, run: async () => void runs.push(timers.now().toISOString()), log: (m) => logs.push(m) })

    expect(pending).toMatchObject([{ ms: 17 * HOUR_MS, unref: true }])
    await fireNext()
    await fireNext()
    expect(runs).toEqual(['2026-09-24T03:00:00.000Z', '2026-09-25T03:00:00.000Z'])
    expect(logs).toEqual(['Demo data restored (nightly reset)', 'Demo data restored (nightly reset)'])
    expect(pending).toHaveLength(1)
  })

  it('logs a failed run and still schedules the next one', async () => {
    const { timers, pending, fireNext } = fakeTimers('2026-09-23T02:59:00.000Z')
    const errors: unknown[] = []

    scheduleDaily({
      at: at3,
      timers,
      run: () => Promise.reject(new Error('store unavailable')),
      logError: (error) => errors.push(error),
    })
    await fireNext()

    expect(errors).toEqual([new Error('store unavailable')])
    expect(pending).toMatchObject([{ ms: 24 * HOUR_MS }])
  })
})
