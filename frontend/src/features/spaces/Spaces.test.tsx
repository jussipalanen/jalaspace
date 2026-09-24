import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { createSpace } from '../../services/spaceService'
import { emptySpaceForm } from '../../services/spaces'
import { renderRoute } from '../../test/renderRoute'

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('spaces', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('lists all spaces with property, status and current tenant', async () => {
    renderRoute('/units')

    await screen.findByRole('table')
    expect(rows()).toHaveLength(68)
    expect(screen.getByText('68 spaces')).toBeInTheDocument()
    const a1 = rows()[0]!
    expect(a1).toHaveTextContent('A 1')
    expect(a1).toHaveTextContent('Helsinki Kallio Residences')
    expect(within(a1).getByRole('link', { name: 'Aino Virtanen' })).toBeInTheDocument()
  })

  it('opens the status filter from the URL, as the dashboard links do', async () => {
    renderRoute('/units?status=available')

    await screen.findByRole('table')
    expect(screen.getByLabelText('Status')).toHaveValue('available')
    expect(rows()).toHaveLength(7)
  })

  it('combines filters, keeps them in the URL and clears them', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/units')

    await user.selectOptions(await screen.findByLabelText('Property'), 'Joensuu Center')
    await user.selectOptions(screen.getByLabelText('Status'), 'Available')

    expect(rows()).toHaveLength(2)
    expect(router.state.location.search).toBe('?property=property-joensuu-center&status=available')

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(rows()).toHaveLength(68)
  })

  it('finds spaces by number of rooms and features', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/units')

    await user.selectOptions(await screen.findByLabelText('Rooms'), '3 rooms')
    const features = screen.getByRole('group', { name: 'Features' })
    await user.click(within(features).getByRole('checkbox', { name: 'Sauna' }))

    expect(rows().map((row) => within(row).getAllByRole('cell')[0]!.textContent)).toEqual([
      'A 4Sauna · Parking · Accessible · Kitchen',
      'A 8Sauna · Balcony · Parking · Kitchen',
      'A 11Sauna · Balcony · Kitchen',
      'A 12Sauna · Balcony · Kitchen',
      'A 15Sauna · Balcony · Kitchen',
      'A 16Sauna · Balcony · Kitchen',
    ])
    expect(router.state.location.search).toBe('?rooms=3&features=sauna')

    await user.click(within(features).getByRole('checkbox', { name: 'Parking' }))
    expect(rows()).toHaveLength(2)
    expect(router.state.location.search).toBe('?rooms=3&features=sauna%2Cparking')
  })

  it('opens the rooms and features filters from the URL', async () => {
    renderRoute('/units?rooms=3&features=parking,sauna&status=available')

    expect(await screen.findByText('0 spaces')).toBeInTheDocument()
    expect(screen.getByLabelText('Rooms')).toHaveValue('3')
    expect(screen.getByRole('checkbox', { name: 'Sauna' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Parking' })).toBeChecked()
    expect(screen.getByText('No spaces match the filters')).toBeInTheDocument()
  })

  it('does not save a duplicate name or invalid numbers', async () => {
    const user = userEvent.setup()
    renderRoute('/units/new?property=property-joensuu-center')

    expect(await screen.findByLabelText(/^Property/)).toHaveValue('property-joensuu-center')
    await user.type(screen.getByLabelText(/^Name/), 'a 201')
    await user.clear(screen.getByLabelText(/^Floor/))
    await user.type(screen.getByLabelText(/^Floor/), '2.5')
    await user.type(screen.getByLabelText(/^Area/), '0')
    await user.click(screen.getByRole('button', { name: 'Save space' }))

    expect(screen.getByText('This property already has a space with this name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a whole number from -10 to 200.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveFocus()
    expect(await createDataLayer('localStorage').spaces.getAll()).toHaveLength(68)
  })

  it('creates a space with a decimal comma area', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/units/new?property=property-joensuu-center')

    await user.type(await screen.findByLabelText(/^Name/), 'A 501')
    await user.clear(screen.getByLabelText(/^Floor/))
    await user.type(screen.getByLabelText(/^Floor/), '5')
    await user.type(screen.getByLabelText(/^Area/), '62,5')
    await user.type(screen.getByLabelText(/^Rooms/), '3')
    await user.click(screen.getByRole('checkbox', { name: 'Kitchen' }))
    await user.click(screen.getByRole('checkbox', { name: 'Balcony' }))
    await user.selectOptions(screen.getByLabelText(/^Status/), 'Maintenance')
    await user.click(screen.getByRole('button', { name: 'Save space' }))

    expect(await screen.findByText('Space A 501 was added.')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?property=property-joensuu-center')
    await screen.findByRole('table')
    const row = rows().find((r) => r.textContent?.includes('A 501'))!
    expect(row).toHaveTextContent('62.5 m²')
    expect(row).toHaveTextContent('Balcony · Kitchen')
    expect(within(row).getByRole('cell', { name: '3' })).toBeInTheDocument()
    expect(row).toHaveTextContent('Maintenance')
  })

  it('does not save an invalid number of rooms', async () => {
    const user = userEvent.setup()
    renderRoute('/units/new?property=property-joensuu-center')

    await user.type(await screen.findByLabelText(/^Name/), 'A 501')
    await user.type(screen.getByLabelText(/^Area/), '40')
    await user.type(screen.getByLabelText(/^Rooms/), '2.5')
    await user.click(screen.getByRole('button', { name: 'Save space' }))

    expect(screen.getByText('Enter a whole number from 1 to 50, or leave the field empty.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Rooms/)).toHaveFocus()
    expect(await createDataLayer('localStorage').spaces.getAll()).toHaveLength(68)
  })

  it('locks the status of a space with an active lease and links to its tenant', async () => {
    renderRoute('/units/space-joensuu-center-6/edit')

    expect(
      await screen.findByText(/^Occupied under an active lease since \d+\.\d+\.\d{4}\./),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Status/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nordic Pixel Oy' })).toHaveAttribute(
      'href',
      '/tenants/tenant-nordic-pixel',
    )
    expect(screen.getByRole('link', { name: 'Edit tenant Nordic Pixel Oy' })).toHaveAttribute(
      'href',
      '/tenants/tenant-nordic-pixel/edit',
    )
  })

  it('shows a field error if another tab has used the name since the form opened', async () => {
    const user = userEvent.setup()
    renderRoute('/units/new?property=property-joensuu-center')
    await user.type(await screen.findByLabelText(/^Name/), 'A 501')
    await user.type(screen.getByLabelText(/^Area/), '62,5')

    await createSpace(createDataLayer('localStorage'), {
      ...emptySpaceForm('property-joensuu-center'), name: 'A 501', area: '70',
    })
    await user.click(screen.getByRole('button', { name: 'Save space' }))

    expect(await screen.findByText('This property already has a space with this name.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Save space' })).toBeEnabled()
    expect(await createDataLayer('localStorage').spaces.getAll()).toHaveLength(69)
  })

  it('explains why a space with a lease cannot be deleted', async () => {
    const user = userEvent.setup()
    renderRoute('/units/space-joensuu-center-6/edit')

    await user.click(await screen.findByRole('button', { name: 'Delete space' }))

    const dialog = screen.getByRole('dialog', { name: 'A 202 cannot be deleted' })
    expect(dialog).toHaveTextContent('1 lease')
    expect(within(dialog).queryByRole('button', { name: 'Delete space' })).not.toBeInTheDocument()
  })

  it('deletes a new space after confirmation', async () => {
    const data = createDataLayer('localStorage')
    await data.spaces.create({
      id: 'new-space',
      propertyId: 'property-kuopio-harbour',
      name: 'B 401',
      type: 'office',
      floor: 4,
      areaM2: 40,
      rooms: null,
      features: [],
      status: 'available',
      createdAt: '2026-09-22T10:30:00.000Z',
      updatedAt: '2026-09-22T10:30:00.000Z',
    })
    const user = userEvent.setup()
    const { router } = renderRoute('/units/new-space/edit')

    await user.click(await screen.findByRole('button', { name: 'Delete space' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Delete B 401?' })).getByRole('button', {
        name: 'Delete space',
      }),
    )

    expect(await screen.findByText('Space B 401 was deleted.')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?property=property-kuopio-harbour')
    expect(await data.spaces.getById('new-space')).toBeNull()
  })

  it('shows a not-found page for an unknown space', async () => {
    renderRoute('/units/missing/edit')

    expect(await screen.findByRole('heading', { level: 1, name: 'Space not found' })).toBeInTheDocument()
  })

  it('offers "Add space" on the property details page', async () => {
    renderRoute('/properties/property-joensuu-center')

    expect(await screen.findByRole('link', { name: 'Add space' })).toHaveAttribute(
      'href',
      '/units/new?property=property-joensuu-center',
    )
    expect(screen.getByRole('link', { name: 'Edit A 202' })).toHaveAttribute(
      'href',
      '/units/space-joensuu-center-6/edit',
    )
    // The spaces table shows the current tenant of each occupied space.
    const a202 = screen.getByRole('link', { name: 'Edit A 202' }).closest('tr')!
    expect(within(a202).getByRole('link', { name: 'Nordic Pixel Oy' })).toHaveAttribute(
      'href',
      '/tenants/tenant-nordic-pixel',
    )
  })

  it('is translated to Finnish', async () => {
    renderRoute('/units', { language: 'fi' })

    await screen.findByRole('table')
    expect(screen.getByText('68 tilaa')).toBeInTheDocument()
    expect(screen.getByLabelText('Käyttötilanne')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Vuokralainen' })).toBeInTheDocument()
  })
})
