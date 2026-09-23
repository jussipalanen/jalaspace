import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { SEED_VERSION } from '../../data/seed'
import { initializeDemoData, resetDemoData } from '../../services/demoDataService'
import { STORAGE_KEYS } from '../localStorage/keys'
import { ApiDemoDataStore } from './ApiDemoDataStore'

const API_URL = 'http://api.test'

describe('ApiDemoDataStore', () => {
  let fetchMock: Mock<typeof fetch>
  const store = new ApiDemoDataStore(API_URL)

  beforeEach(() => {
    window.localStorage.clear()
    fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('never seeds in the browser, because the API has its own demo data', async () => {
    expect(await store.getSeedVersion()).toBe(SEED_VERSION)
    expect(await initializeDemoData(store)).toBe('existing')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(STORAGE_KEYS.properties)).toBeNull()
  })

  it('resets the API demo data and the browser demo account, keeping the session and language', async () => {
    window.localStorage.setItem(STORAGE_KEYS.session, '{"email":"demo@jalaspace.app"}')
    window.localStorage.setItem(STORAGE_KEYS.language, '"fi"')
    window.localStorage.setItem(STORAGE_KEYS.profile, '{"firstName":"Changed"}')
    window.localStorage.setItem('jalaspace_credentials', '{"hash":"changed"}')

    await resetDemoData(store)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${API_URL}/api/demo/reset`)
    expect(init).toMatchObject({ method: 'POST', body: undefined })
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull()
    expect(window.localStorage.getItem('jalaspace_credentials')).toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).not.toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('"fi"')
    // The API data is not copied into the browser.
    expect(window.localStorage.getItem(STORAGE_KEYS.properties)).toBeNull()
  })

  it('reports a failed reset', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'not_found' } }), { status: 404 }),
    )
    await expect(resetDemoData(store)).rejects.toMatchObject({ status: 404, code: 'not_found' })
  })
})
