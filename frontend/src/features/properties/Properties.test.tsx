import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'

type User = ReturnType<typeof userEvent.setup>

async function fillForm(user: User, values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) {
    const field = await screen.findByLabelText(new RegExp(`^${label}`))
    await user.clear(field)
    if (value) await user.type(field, value)
  }
}

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('properties', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('lists properties with their metrics, sorted by name', async () => {
    renderRoute('/properties')

    await screen.findByRole('table')
    expect(rows().map((row) => within(row).getByRole('link').textContent)).toEqual([
      'Helsinki Kallio Residences',
      'Joensuu Center',
      'Kuopio Harbour Business Park',
      'Tampere Hervanta Logistics',
    ])
    const joensuu = rows()[1]!
    expect(joensuu).toHaveTextContent('Siltakatu 12, 80100 Joensuu')
    expect(joensuu).toHaveTextContent('Mixed use')
    expect(joensuu).toHaveTextContent('2286%3')
    expect(screen.getByText('4 properties')).toBeInTheDocument()
  })

  it('searches by city and keeps the search in the URL', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/properties')

    await user.type(await screen.findByRole('searchbox', { name: 'Search properties' }), 'kuopio')

    expect(rows()).toHaveLength(1)
    expect(screen.getByText('1 property')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?q=kuopio')
  })

  it('shows a no-results state that can clear the search', async () => {
    const user = userEvent.setup()
    renderRoute('/properties?q=nowhere')

    expect(await screen.findByRole('heading', { name: 'No properties match “nowhere”' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(rows()).toHaveLength(4)
  })

  it('does not save an invalid property and focuses the first invalid field', async () => {
    const user = userEvent.setup()
    renderRoute('/properties/new')

    await fillForm(user, { Name: 'Oulu Tech Campus', 'Postal code': '901' })
    await user.click(screen.getByRole('button', { name: 'Save property' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Please correct the highlighted fields.')
    expect(screen.getByLabelText(/^Street address/)).toHaveFocus()
    expect(screen.getByLabelText(/^Postal code/)).toHaveAccessibleDescription(
      '5 digits, e.g. 80100 Enter a 5-digit postal code.',
    )
    expect(screen.getByText('City is required.')).toBeInTheDocument()
    expect(await createDataLayer('localStorage').properties.getAll()).toHaveLength(4)
  })

  it('creates a property and shows it with a success message', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/properties/new')

    await fillForm(user, {
      Name: 'Oulu Tech Campus',
      'Street address': 'Kauppurienkatu 3',
      'Postal code': '90100',
      City: 'Oulu',
    })
    await user.selectOptions(screen.getByLabelText(/^Type/), 'Industrial')
    await user.click(screen.getByRole('button', { name: 'Save property' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Oulu Tech Campus' })).toBeInTheDocument()
    expect(screen.getByText('Property Oulu Tech Campus was added.')).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/properties\/[0-9a-f-]{36}$/)
    expect(screen.getByText('Industrial')).toBeInTheDocument()
    expect(screen.getByText('This property has no spaces yet.')).toBeInTheDocument()
  })

  it('edits a property', async () => {
    const user = userEvent.setup()
    renderRoute('/properties/property-kuopio-harbour/edit')

    const name = await screen.findByLabelText(/^Name/)
    expect(name).toHaveValue('Kuopio Harbour Business Park')
    await fillForm(user, { Name: 'Kuopio Harbour Offices' })
    await user.click(screen.getByRole('button', { name: 'Save property' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kuopio Harbour Offices' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Changes to Kuopio Harbour Offices were saved.')).toBeInTheDocument()
  })

  it('explains why a property with spaces cannot be deleted', async () => {
    const user = userEvent.setup()
    renderRoute('/properties/property-joensuu-center')

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    const dialog = screen.getByRole('dialog', { name: 'Joensuu Center cannot be deleted' })
    expect(dialog).toHaveTextContent('22 spaces')
    expect(dialog).toHaveTextContent('4 maintenance tasks')
    expect(within(dialog).queryByRole('button', { name: 'Delete property' })).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(dialog).not.toBeVisible())
    expect(await createDataLayer('localStorage').properties.getById('property-joensuu-center')).not.toBeNull()
  })

  it('deletes a property after confirmation', async () => {
    const user = userEvent.setup()
    renderRoute('/properties/new')
    await fillForm(user, {
      Name: 'Temporary Site',
      'Street address': 'Testikatu 1',
      'Postal code': '00100',
      City: 'Helsinki',
    })
    await user.click(screen.getByRole('button', { name: 'Save property' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete Temporary Site?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete property' }))

    // The list's loading indicator is also a status region, so match the message text.
    expect(await screen.findByText('Property Temporary Site was deleted.')).toBeInTheDocument()
    await screen.findByRole('table')
    expect(rows()).toHaveLength(4)
  })

  it('shows a not-found page for an unknown property', async () => {
    renderRoute('/properties/does-not-exist')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Property not found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to properties' })).toHaveAttribute(
      'href',
      '/properties',
    )
  })

  it('is translated to Finnish', async () => {
    renderRoute('/properties', { language: 'fi' })

    await screen.findByRole('table')
    expect(screen.getByRole('link', { name: 'Lisää kiinteistö' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Hae kiinteistöjä' })).toBeInTheDocument()
    expect(screen.getByText('4 kiinteistöä')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Käyttöaste' })).toBeInTheDocument()
  })
})
