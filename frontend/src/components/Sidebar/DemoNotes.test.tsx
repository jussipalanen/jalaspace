import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDataLayer } from '../../repositories'
import { renderRoute } from '../../test/renderRoute'

// The sidebar says where the demo data is kept; the sign-in page shows a generic demo notice.
describe('demo notes', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('say the data stays in this browser with localStorage', async () => {
    renderRoute('/settings')
    expect(await screen.findByText('Demo environment. Data is stored only in this browser.')).toBeInTheDocument()
  })

  it('say the data is shared when it is on the API', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    // The page reads the provider from the environment; the data stays local in the test.
    renderRoute('/settings', { dataLayer: createDataLayer('localStorage') })
    expect(
      await screen.findByText('Demo environment. The data is shared by everyone who uses this demo.'),
    ).toBeInTheDocument()
  })

  it('on the sign-in page show the demo notice regardless of the data provider', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    renderRoute('/login', { authenticated: false, language: 'fi' })
    expect(
      await screen.findByText('Tämä on demo, jossa käytetään testitunnuksia ja esimerkkidataa.'),
    ).toBeInTheDocument()
  })

  it('on the sign-in page show the demo notice with localStorage', async () => {
    renderRoute('/login', { authenticated: false })
    expect(
      await screen.findByText('This is a demo using test credentials and sample data only.'),
    ).toBeInTheDocument()
  })
})
