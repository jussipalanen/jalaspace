import { afterEach, describe, expect, it, vi } from 'vitest'
import { startWakingApi } from './apiWakeUp'

describe('startWakingApi', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sends one health request to the API when the data is kept there', () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    vi.stubEnv('VITE_API_URL', 'https://jalaspace.onrender.com/')
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'))

    startWakingApi(send)

    expect(send).toHaveBeenCalledExactlyOnceWith('https://jalaspace.onrender.com/api/health')
  })

  it('sends nothing when the data is in the browser', () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'localStorage')
    vi.stubEnv('VITE_API_URL', 'https://jalaspace.onrender.com')
    const send = vi.fn<typeof fetch>()

    startWakingApi(send)

    expect(send).not.toHaveBeenCalled()
  })

  it('ignores a failed request, so the app still starts', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    vi.stubEnv('VITE_API_URL', 'https://jalaspace.onrender.com')
    const failure = Promise.reject(new TypeError('Failed to fetch'))
    const send = vi.fn<typeof fetch>().mockReturnValue(failure)

    expect(() => startWakingApi(send)).not.toThrow()
    // An unhandled rejection would fail the test run.
    await failure.catch(() => {})
  })
})
