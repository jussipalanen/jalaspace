import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDataLayer, type DataLayer } from '../../repositories'
import { STORAGE_KEYS } from '../../repositories/localStorage/keys'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute, testSession } from '../../test/renderRoute'

const resetButton = () => screen.getByRole('button', { name: 'Reset demo data' })

describe('settings: language', () => {
  it('switches the language immediately and stores the choice', async () => {
    const user = userEvent.setup()
    renderRoute('/settings')

    const section = await screen.findByRole('region', { name: 'Language' })
    await user.selectOptions(within(section).getByLabelText('Language'), 'Suomi')

    expect(await screen.findByRole('heading', { level: 1, name: 'Asetukset' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'fi')
    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('"fi"')
    expect(within(screen.getByRole('region', { name: 'Kieli' })).getByLabelText('Kieli')).toHaveValue('fi')
  })
})

describe('settings: demo data reset', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does nothing when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const dataLayer = createDataLayer('localStorage')
    const [task] = await dataLayer.maintenance.getAll()
    await dataLayer.maintenance.delete(task!.id)
    renderRoute('/settings')

    await user.click(await screen.findByRole('button', { name: 'Reset demo data' }))
    const dialog = screen.getByRole('dialog', { name: 'Reset demo data?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await dataLayer.maintenance.getById(task!.id)).toBeNull()
    expect(screen.queryByText('The demo data was reset.')).not.toBeInTheDocument()
  })

  it('restores the seed data and the default profile, keeping the session and language', async () => {
    const user = userEvent.setup()
    const dataLayer = createDataLayer('localStorage')
    const [first] = await dataLayer.properties.getAll()
    await dataLayer.properties.update({ ...first!, name: 'Edited by user' })
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({
        firstName: 'Esko',
        lastName: 'Esimerkki',
        birthDate: '1990-09-22',
        updatedAt: '2026-09-22T10:30:00.000Z',
      }),
    )
    renderRoute('/settings', { language: 'en' })

    expect(await screen.findByLabelText(/^First name/)).toHaveValue('Esko')
    await user.click(resetButton())
    const dialog = screen.getByRole('dialog', { name: 'Reset demo data?' })
    await user.click(within(dialog).getByRole('button', { name: 'Reset demo data' }))

    expect(await screen.findByText('The demo data was reset.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^First name/)).toHaveValue('Demo')
    expect(screen.getByLabelText(/^Last name/)).toHaveValue('User')
    expect(within(screen.getByRole('banner')).getByRole('link', { name: /Demo User/ })).toBeInTheDocument()

    expect((await dataLayer.properties.getById(first!.id))?.name).not.toBe('Edited by user')
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.session)!)).toEqual(testSession)
    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('"en"')
  })

  it('shows an error in the dialog when the reset fails', async () => {
    const user = userEvent.setup()
    const real = createDataLayer('localStorage')
    const dataLayer: DataLayer = {
      ...real,
      demoData: {
        getSeedVersion: () => real.demoData!.getSeedVersion(),
        replaceAll: () => Promise.reject(new DOMException('Storage is full', 'QuotaExceededError')),
        clear: () => real.demoData!.clear(),
      },
    }
    renderRoute('/settings', { dataLayer })

    await user.click(await screen.findByRole('button', { name: 'Reset demo data' }))
    const dialog = screen.getByRole('dialog', { name: 'Reset demo data?' })
    await user.click(within(dialog).getByRole('button', { name: 'Reset demo data' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Unable to reset the demo data. Please try again.',
    )
    expect(within(dialog).getByRole('button', { name: 'Reset demo data' })).toBeEnabled()
  })

  it('explains that a reset affects everyone when the data is on the API', async () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    const user = userEvent.setup()
    // The page reads the provider from the environment; the data layer stays local here.
    renderRoute('/settings', { dataLayer: createDataLayer('localStorage') })

    const section = await screen.findByRole('region', { name: 'Demo data' })
    expect(
      within(section).getByText(
        'JalaSpace stores the demo data on the API server, shared by everyone who uses it.',
      ),
    ).toBeInTheDocument()
    await user.click(within(section).getByRole('button', { name: 'Reset demo data' }))
    expect(
      within(screen.getByRole('dialog', { name: 'Reset demo data?' })).getByText(
        /The demo data is reset for everyone who uses this API/,
      ),
    ).toBeInTheDocument()
  })

  it('explains when the data provider cannot reset demo data', async () => {
    const dataLayer: DataLayer = { ...createDataLayer('localStorage'), demoData: null }
    renderRoute('/settings', { dataLayer })

    const section = await screen.findByRole('region', { name: 'Demo data' })
    expect(
      within(section).getByText('The demo data cannot be reset with the current data provider.'),
    ).toBeInTheDocument()
    expect(within(section).queryByRole('button')).not.toBeInTheDocument()
  })
})
