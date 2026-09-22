import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../repositories/localStorage/keys'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'

describe('language switcher', () => {
  it('switches the app to Finnish without leaving the page', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/leases')
    await screen.findByRole('heading', { level: 1, name: 'Leases' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'Suomi')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Vuokrasopimukset' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/leases')
    expect(screen.getByRole('navigation', { name: 'Päävalikko' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kirjaudu ulos' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Kieli' })).toHaveValue('fi')
    expect(document.documentElement.lang).toBe('fi')
    await waitFor(() => expect(document.title).toBe('Vuokrasopimukset · JalaSpace'))
    expect(window.localStorage.getItem(STORAGE_KEYS.language)).toBe('"fi"')
  })

  it('lists each language by its own name', async () => {
    renderRoute('/', { language: 'fi' })

    const select = await screen.findByRole('combobox', { name: 'Kieli' })
    const options = within(select).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['English', 'Suomi'])
    expect(options.map((option) => option.getAttribute('lang'))).toEqual(['en', 'fi'])
  })

  it('starts in the stored language', async () => {
    renderRoute('/does-not-exist', { language: 'fi' })

    expect(await screen.findByRole('heading', { name: 'Sivua ei löytynyt' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('fi')
  })

  it('is available on the login page', async () => {
    const user = userEvent.setup()
    renderRoute('/login', { authenticated: false })

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Language' }), 'fi')
    await user.click(screen.getByRole('button', { name: 'Kirjaudu sisään' }))

    expect(screen.getByText('Sähköposti on pakollinen.')).toBeInTheDocument()
    expect(screen.getByText('Salasana on pakollinen.')).toBeInTheDocument()
  })

  it('translates the dashboard, including plurals and number formats', async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
    renderRoute('/', { language: 'fi' })

    const figures = await screen.findByRole('region', { name: 'Tunnusluvut' })
    expect(within(figures).getByRole('link', { name: /^Käyttöaste/ })).toHaveTextContent(
      // toHaveTextContent normalises the no-break space in "85 %" to a regular space.
      'Käyttöaste85 %58 / 68 tilasta vuokrattu',
    )
    expect(within(figures).getByRole('link', { name: /^Avoimet huollot/ })).toHaveTextContent(
      '4 kiireellistä',
    )
    const maintenance = screen.getByRole('region', { name: 'Viimeisimmät huoltotehtävät' })
    expect(within(maintenance).getAllByText('Kiireellisyys: Korkea').length).toBeGreaterThan(0)
    expect(within(maintenance).getAllByText('Avoin').length).toBeGreaterThan(0)
  })
})
