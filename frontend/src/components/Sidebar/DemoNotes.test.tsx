import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDataLayer } from '../../repositories'
import { renderRoute } from '../../test/renderRoute'

// The sidebar and the sign-in page say where the demo data is kept.
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

  it('on the sign-in page ask not to enter personal information when the data is shared', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    renderRoute('/login', { authenticated: false, language: 'fi' })
    expect(
      await screen.findByText(/Tiedot ovat yhteisiä kaikille demon käyttäjille, joten älä syötä henkilötietoja\./),
    ).toBeInTheDocument()
  })

  it('on the sign-in page say the data stays in this browser with localStorage', async () => {
    renderRoute('/login', { authenticated: false })
    expect(await screen.findByText(/Data is stored only in this browser\./)).toBeInTheDocument()
  })
})
