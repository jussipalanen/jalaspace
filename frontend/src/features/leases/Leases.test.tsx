import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'
import { addDays, toIsoDate } from '../../utils/date'
import { formatDate } from '../../utils/format'

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)
const day = (offset: number) => formatDate(toIsoDate(addDays(new Date(), offset)))

describe('leases', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('lists leases with tenant, space, period, rent and status, newest first', async () => {
    renderRoute('/leases')

    await screen.findByRole('table')
    expect(rows()).toHaveLength(62)
    expect(screen.getByText('62 leases')).toBeInTheDocument()
    const aurora = rows()[0]!
    expect(within(aurora).getByRole('link', { name: 'Aurora Yoga Studio Oy' })).toHaveAttribute(
      'href',
      '/tenants/tenant-aurora-yoga',
    )
    expect(within(aurora).getByRole('link', { name: 'A 302' })).toHaveAttribute(
      'href',
      '/units/space-joensuu-center-12/edit',
    )
    expect(aurora).toHaveTextContent(/From \d+\.\d+\.\d{4}, open.ended/)
    expect(aurora).toHaveTextContent('Upcoming')
    expect(within(aurora).getByRole('link', { name: 'Edit: Aurora Yoga Studio Oy, A 302' })).toHaveAttribute(
      'href',
      '/leases/lease-59/edit',
    )
  })

  it('filters by status, property and search, keeps the filters in the URL and clears them', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/leases?status=ended')

    await screen.findByRole('table')
    expect(screen.getByLabelText('Status')).toHaveValue('ended')
    expect(rows()).toHaveLength(3)

    await user.selectOptions(screen.getByLabelText('Status'), 'Active')
    await user.selectOptions(screen.getByLabelText('Property'), 'Tampere Hervanta Logistics')
    await user.type(screen.getByRole('searchbox', { name: 'Search leases' }), 'hall')
    expect(router.state.location.search).toBe('?status=active&property=property-tampere-hervanta&q=hall')
    expect(rows().length).toBeGreaterThan(0)
    for (const row of rows()) expect(row).toHaveTextContent('Hall')

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(rows()).toHaveLength(62)
  })

  it('creates an upcoming lease with an end date and returns to the list', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/leases/new')

    await user.selectOptions(await screen.findByLabelText(/^Tenant/), 'Mikko Esimerkki')
    await user.selectOptions(screen.getByLabelText(/^Property/), 'Kuopio Harbour Business Park')
    await user.selectOptions(screen.getByLabelText(/^Space/), 'B 204 (Available)')
    const start = screen.getByRole('textbox', { name: /^Start date/ })
    await user.clear(start)
    await user.type(start, day(7))
    await user.type(screen.getByRole('textbox', { name: /^End date/ }), day(372))
    await user.keyboard('{Escape}')
    await user.type(screen.getByLabelText(/^Monthly rent/), '1 250,50')
    await user.click(screen.getByRole('button', { name: 'Save lease' }))

    expect(await screen.findByText('The lease of B 204 for Mikko Esimerkki was created.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/leases')
    const leases = await createDataLayer('localStorage').leases.getAll()
    expect(leases.find((lease) => lease.spaceId === 'space-kuopio-harbour-10')).toMatchObject({
      tenantId: 'tenant-mikko-esimerkki',
      endDate: toIsoDate(addDays(new Date(), 372)),
      monthlyRentCents: 125050,
    })
  })

  it('does not save invalid values and focuses the first invalid field', async () => {
    const user = userEvent.setup()
    renderRoute('/leases/new?space=space-joensuu-center-6')

    // The space is preselected; A 202 is leased open-ended, so any new period overlaps.
    expect(await screen.findByLabelText(/^Space/)).toHaveValue('space-joensuu-center-6')
    await user.type(screen.getByRole('textbox', { name: /^End date/ }), '1.1.2000')
    await user.keyboard('{Escape}')
    await user.type(screen.getByLabelText(/^Monthly rent/), '0')
    await user.click(screen.getByRole('button', { name: 'Save lease' }))

    expect(screen.getByText('Choose a tenant.')).toBeInTheDocument()
    expect(screen.getByText('The end date cannot be before the start date.')).toBeInTheDocument()
    expect(screen.getByText('Enter an amount above 0 and at most 1,000,000 €, with up to 2 decimals.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Tenant/)).toHaveFocus()

    await user.selectOptions(screen.getByLabelText(/^Tenant/), 'Mikko Esimerkki')
    await user.clear(screen.getByRole('textbox', { name: /^End date/ }))
    await user.keyboard('{Escape}')
    await user.clear(screen.getByLabelText(/^Monthly rent/))
    await user.click(screen.getByRole('button', { name: 'Save lease' }))
    expect(
      screen.getByText('This space already has a lease during this period. Change the dates or choose another space.'),
    ).toBeInTheDocument()
    expect(await createDataLayer('localStorage').leases.getAll()).toHaveLength(62)
  })

  it('edits a lease from the tenant page, schedules a move-out and returns there', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/tenants/tenant-aino-esimerkki')

    await user.click(await screen.findByRole('link', { name: 'Edit lease: A 1' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Edit lease' })).toBeInTheDocument()
    // Tenant and space are shown but cannot be changed.
    expect(screen.queryByLabelText(/^Tenant/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aino Esimerkki' })).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /^End date/ }), day(60))
    await user.keyboard('{Escape}')
    expect(screen.getByText('The lease is active today, so the space will be occupied.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save lease' }))

    expect(await screen.findByText('Changes to the lease of A 1 were saved.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/tenants/tenant-aino-esimerkki')
    expect(await screen.findByRole('region', { name: 'Spaces' })).toHaveTextContent(day(60))
  })

  it('links an occupied space to its current lease', async () => {
    renderRoute('/units/space-helsinki-kallio-1/edit')

    expect(await screen.findByRole('link', { name: 'View lease' })).toHaveAttribute(
      'href',
      `/leases/lease-45/edit?returnTo=${encodeURIComponent('/units/space-helsinki-kallio-1/edit')}`,
    )
  })

  it('shows a not-found page for an unknown lease', async () => {
    renderRoute('/leases/missing/edit')

    expect(await screen.findByRole('heading', { level: 1, name: 'Lease not found' })).toBeInTheDocument()
  })

  it('ignores a return path that leads to another site', async () => {
    renderRoute('/leases/lease-45/edit?returnTo=//evil.example')

    expect(await screen.findByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/leases')
  })

  it('is translated to Finnish', async () => {
    renderRoute('/leases', { language: 'fi' })

    await screen.findByRole('table')
    expect(screen.getByText('62 vuokrasopimusta')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Sopimuskausi' })).toBeInTheDocument()
    expect(screen.getAllByText('Voimassa').length).toBeGreaterThan(0)
  })
})
