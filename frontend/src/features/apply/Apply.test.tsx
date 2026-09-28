import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'
import { addDays } from '../../utils/date'
import { formatDate } from '../../utils/format'

const cards = () => screen.getAllByRole('article')
const nextMonth = () => formatDate(addDays(new Date(), 30).toISOString())

describe('public application form', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('is linked from the sign-in page', async () => {
    renderRoute('/login', { authenticated: false })

    const block = await screen.findByRole('region', { name: 'Looking for a space?' })
    expect(within(block).getByRole('link', { name: 'Browse available spaces and apply' })).toHaveAttribute(
      'href',
      '/apply',
    )
  })

  it('lists the spaces that can be applied for without signing in, and filters them', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/apply', { authenticated: false })

    expect(await screen.findByRole('heading', { level: 1, name: 'Find a space' })).toBeInTheDocument()
    expect(cards()).toHaveLength(6)
    expect(screen.getByText('6 spaces available')).toBeInTheDocument()
    // A 302 in Joensuu is available but reserved, so it is not offered.
    expect(screen.queryByRole('heading', { name: 'A 302' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'For property managers: sign in' })).toHaveAttribute('href', '/login')

    const kallio = screen.getByRole('article', { name: 'A 11' })
    expect(kallio).toHaveTextContent('Helsinki · Helsinki Kallio Residences')
    expect(kallio).toHaveTextContent('3 rooms')
    expect(within(kallio).getByRole('list', { name: 'Features' })).toHaveTextContent('Sauna')
    expect(within(kallio).getByRole('link', { name: 'Apply for A 11, Helsinki Kallio Residences' })).toHaveAttribute(
      'href',
      '/apply/space-helsinki-kallio-11',
    )

    await user.selectOptions(screen.getByLabelText('City'), 'Kuopio')
    expect(router.state.location.search).toBe('?city=Kuopio')
    expect(cards()).toHaveLength(3)
    await user.selectOptions(screen.getByLabelText('Space type'), 'Storage')
    expect(screen.getByRole('heading', { name: 'No spaces match the filters' })).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!)
    expect(cards()).toHaveLength(6)
  })

  it('shows the space and does not send an invalid application', async () => {
    const user = userEvent.setup()
    renderRoute('/apply/space-helsinki-kallio-11', { authenticated: false })

    expect(await screen.findByRole('heading', { level: 1, name: 'Apply for A 11' })).toBeInTheDocument()
    const summary = screen.getByRole('complementary', { name: /A 11/ })
    expect(summary).toHaveTextContent('Esimerkkikuja 15, 00500 Helsinki')
    expect(screen.getByText(/This is a demo/)).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'lotta@')
    await user.type(screen.getByRole('textbox', { name: /^Desired start date/ }), '1.1.2020')
    await user.click(screen.getByRole('button', { name: 'Send application' }))

    expect(screen.getByText('Please correct the highlighted fields.')).toBeInTheDocument()
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Confirm that you have not entered real personal information.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^Full name/ })).toHaveFocus()
    expect(await createDataLayer('localStorage').applications.getAll()).toHaveLength(8)
  })

  it('sends an application that the property manager then sees', async () => {
    const user = userEvent.setup()
    renderRoute('/apply/space-kuopio-harbour-3', { authenticated: false })

    await screen.findByRole('heading', { level: 1, name: 'Apply for B 103' })
    await user.click(screen.getByRole('radio', { name: 'Company' }))
    await user.type(screen.getByRole('textbox', { name: /^Company name/ }), 'Bakery Esimerkki Oy')
    await user.type(screen.getByRole('textbox', { name: /^Contact person/ }), 'Liisa Esimerkki')
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'info@bakery-esimerkki.example')
    await user.type(screen.getByRole('textbox', { name: /^Phone/ }), '+358501234566')
    await user.type(screen.getByRole('textbox', { name: /^Desired start date/ }), nextMonth())
    await user.type(screen.getByRole('textbox', { name: /^Message/ }), 'A small bakery with a café.')
    await user.click(screen.getByRole('checkbox', { name: /I understand this is a demo/ }))
    await user.click(screen.getByRole('button', { name: 'Send application' }))

    const heading = await screen.findByRole('heading', { level: 1, name: 'Application sent' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByText(/Your application for B 103 in Kuopio Harbour Business Park was sent/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse more spaces' })).toHaveAttribute('href', '/apply')

    const stored = (await createDataLayer('localStorage').applications.getAll()).find(
      (application) => application.name === 'Bakery Esimerkki Oy',
    )
    expect(stored).toMatchObject({ spaceId: 'space-kuopio-harbour-3', status: 'submitted', contactPerson: 'Liisa Esimerkki' })
  })

  it('explains when the space cannot be applied for', async () => {
    renderRoute('/apply/space-joensuu-center-12', { authenticated: false })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This space is no longer available' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse available spaces' })).toHaveAttribute('href', '/apply')
  })

  it('explains when the space was let while the form was open', async () => {
    const user = userEvent.setup()
    renderRoute('/apply/space-kuopio-harbour-3', { authenticated: false })

    await screen.findByRole('heading', { level: 1, name: 'Apply for B 103' })
    await user.type(screen.getByRole('textbox', { name: /^Full name/ }), 'Liisa Esimerkki')
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'liisa.esimerkki@example.com')
    await user.type(screen.getByRole('textbox', { name: /^Desired start date/ }), nextMonth())
    await user.click(screen.getByRole('checkbox', { name: /I understand this is a demo/ }))
    const data = createDataLayer('localStorage')
    const space = (await data.spaces.getById('space-kuopio-harbour-3'))!
    await data.spaces.update({ ...space, status: 'maintenance' })
    await user.click(screen.getByRole('button', { name: 'Send application' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This space is no longer available' }),
    ).toBeInTheDocument()
    expect(await data.applications.getAll()).toHaveLength(8)
  })

  it('links a signed-in manager back to the app', async () => {
    renderRoute('/apply')

    expect(await screen.findByRole('link', { name: 'Back to JalaSpace' })).toHaveAttribute('href', '/')
  })

  it('is linked from the Applications page, the Spaces list and the property page', async () => {
    const { unmount } = renderRoute('/applications')
    const formLink = await screen.findByRole('link', { name: 'Application form (opens in a new tab)' })
    expect(formLink).toHaveAttribute('href', '/apply')
    expect(formLink).toHaveAttribute('target', '_blank')
    unmount()

    const spaces = renderRoute('/units?property=property-helsinki-kallio')
    expect(
      await screen.findByRole('link', { name: 'Application form for A 11 (opens in a new tab)' }),
    ).toHaveAttribute('href', '/apply/space-helsinki-kallio-11')
    // Only spaces that can be applied for get a link.
    expect(screen.getAllByRole('link', { name: /^Application form for/ })).toHaveLength(1)
    spaces.unmount()

    renderRoute('/properties/property-joensuu-center')
    expect(
      await screen.findByRole('link', { name: 'Application form for A 201 (opens in a new tab)' }),
    ).toHaveAttribute('href', '/apply/space-joensuu-center-5')
    expect(screen.queryByRole('link', { name: /Application form for A 302/ })).not.toBeInTheDocument()
  })

  it('is translated to Finnish', async () => {
    renderRoute('/apply', { authenticated: false, language: 'fi' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Löydä tila' })).toBeInTheDocument()
    expect(screen.getByText('6 vapaata tilaa')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hae tilaa A 11, Helsinki Kallio Residences' })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Vapaat tilat · JalaSpace'))
  })
})
