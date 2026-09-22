import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer, type DataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { createTenant } from '../../services/tenantService'
import { emptyTenantForm } from '../../services/tenants'
import { renderRoute } from '../../test/renderRoute'
import { addDays, toIsoDate } from '../../utils/date'
import { formatDate } from '../../utils/format'

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('tenants', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('lists tenants by name with their contact and current spaces', async () => {
    renderRoute('/tenants')

    await screen.findByRole('table')
    expect(rows()).toHaveLength(31)
    expect(screen.getByText('31 tenants')).toBeInTheDocument()
    const aino = rows()[0]!
    expect(within(aino).getByRole('link', { name: 'Aino Virtanen' })).toHaveAttribute(
      'href',
      '/tenants/tenant-aino-virtanen',
    )
    expect(aino).toHaveTextContent('Person')
    expect(aino).toHaveTextContent('A 1 · Helsinki Kallio Residences')
    const aurora = rows().find((row) => row.textContent?.includes('Aurora Yoga'))!
    expect(aurora).toHaveTextContent(/Moving in \d+\.\d+\.\d{4}: A 302/)
  })

  it('filters by type and search, keeps the filters in the URL and clears them', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/tenants?type=person')

    await screen.findByRole('table')
    expect(screen.getByLabelText('Type')).toHaveValue('person')
    expect(rows()).toHaveLength(15)

    await user.selectOptions(screen.getByLabelText('Type'), 'Company')
    await user.type(screen.getByRole('searchbox', { name: 'Search tenants' }), 'rautio')
    expect(router.state.location.search).toBe('?type=company&q=rautio')
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Nordic Pixel Oy')

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(rows()).toHaveLength(31)
  })

  it('shows tenant details with current spaces and past leases', async () => {
    renderRoute('/tenants/tenant-saimaa-design')

    expect(await screen.findByRole('heading', { level: 1, name: 'Saimaa Design Studio Oy' })).toBeInTheDocument()
    const spaces = screen.getByRole('region', { name: 'Spaces' })
    expect(within(spaces).getByRole('link', { name: 'A 305' })).toHaveAttribute(
      'href',
      '/units/space-joensuu-center-15/edit',
    )
    expect(
      within(spaces).getByRole('button', { name: 'Remove from space A 304' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Details' })).toHaveTextContent('Tuomas Kettunen')
    expect(screen.getByRole('region', { name: 'Past leases' })).toHaveTextContent('A 201')
  })

  it('does not save invalid values and focuses the first invalid field', async () => {
    const user = userEvent.setup()
    renderRoute('/tenants/new')

    await user.type(await screen.findByRole('textbox', { name: /^Email/ }), 'info@nordic-pixel.example')
    await user.type(screen.getByRole('textbox', { name: /^Phone/ }), 'call me')
    await user.click(screen.getByRole('button', { name: 'Save tenant' }))

    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Another tenant already uses this email.')).toBeInTheDocument()
    expect(screen.getByText('Enter 5–20 digits, spaces, +, - or parentheses.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^Company name/ })).toHaveFocus()
    expect(await createDataLayer('localStorage').tenants.getAll()).toHaveLength(31)
  })

  it('switches the name label and hides the contact person for a person', async () => {
    const user = userEvent.setup()
    renderRoute('/tenants/new')

    await user.type(await screen.findByRole('textbox', { name: /^Contact person/ }), 'Liisa')
    await user.click(screen.getByRole('radio', { name: 'Person' }))

    expect(screen.getByRole('textbox', { name: /^Full name/ })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /^Contact person/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Company' }))
    expect(screen.getByRole('textbox', { name: /^Contact person/ })).toHaveValue('')
  })

  it('creates a tenant and shows its details', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/tenants/new')

    await user.type(await screen.findByRole('textbox', { name: /^Company name/ }), ' Pohjola Bakery Oy ')
    await user.type(screen.getByRole('textbox', { name: /^Contact person/ }), 'Liisa Pohjola')
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'hello@pohjola-bakery.example')
    await user.click(screen.getByRole('button', { name: 'Save tenant' }))

    expect(await screen.findByText('Tenant Pohjola Bakery Oy was added.')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Pohjola Bakery Oy' })).toBeInTheDocument()
    expect(screen.getByText('This tenant does not rent any space at the moment.')).toBeInTheDocument()
    const id = router.state.location.pathname.split('/').at(-1)!
    expect(await createDataLayer('localStorage').tenants.getById(id)).toMatchObject({
      name: 'Pohjola Bakery Oy',
      contactPerson: 'Liisa Pohjola',
      phone: null,
    })
  })

  it('keeps the input when storage fails', async () => {
    const user = userEvent.setup()
    const real = createDataLayer('localStorage')
    const dataLayer: DataLayer = {
      ...real,
      tenants: {
        getAll: () => real.tenants.getAll(),
        getById: (id) => real.tenants.getById(id),
        create: () => Promise.reject(new DOMException('Storage is full', 'QuotaExceededError')),
        update: (tenant) => real.tenants.update(tenant),
        delete: (id) => real.tenants.delete(id),
      },
    }
    renderRoute('/tenants/new', { dataLayer })

    await user.type(await screen.findByRole('textbox', { name: /^Company name/ }), 'Pohjola Bakery Oy')
    await user.type(screen.getByRole('textbox', { name: /^Email/ }), 'hello@pohjola-bakery.example')
    await user.click(screen.getByRole('button', { name: 'Save tenant' }))

    expect(await screen.findByText('Unable to save the tenant. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^Company name/ })).toHaveValue('Pohjola Bakery Oy')
  })

  it('assigns a tenant to a space with a new lease and returns to the tenant', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/tenants/tenant-aino-virtanen')

    await user.click(await screen.findByRole('link', { name: 'Assign to space' }))
    expect(await screen.findByLabelText(/^Tenant/)).toHaveValue('tenant-aino-virtanen')
    await user.selectOptions(screen.getByLabelText(/^Property/), 'Kuopio Harbour Business Park')
    await user.selectOptions(screen.getByLabelText(/^Space/), 'B 204 (Available)')
    await user.type(screen.getByLabelText(/^Monthly rent/), '980')
    expect(screen.getByText('The lease is active today, so the space will be occupied.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save lease' }))

    expect(await screen.findByText('The lease of B 204 for Aino Virtanen was created.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/tenants/tenant-aino-virtanen')
    const spaces = await screen.findByRole('region', { name: 'Spaces' })
    expect(within(spaces).getByRole('link', { name: 'B 204' })).toBeInTheDocument()
    expect(spaces).toHaveTextContent('€980.00 / month')
    expect(await createDataLayer('localStorage').spaces.getById('space-kuopio-harbour-10')).toMatchObject({
      status: 'occupied',
    })
  })

  it('reserves a space for a future start date', async () => {
    const user = userEvent.setup()
    renderRoute('/leases/new?tenant=tenant-aino-virtanen')
    const start = formatDate(toIsoDate(addDays(new Date(), 14)))

    await user.selectOptions(await screen.findByLabelText(/^Property/), 'Kuopio Harbour Business Park')
    await user.selectOptions(screen.getByLabelText(/^Space/), 'B 204 (Available)')
    const date = screen.getByRole('textbox', { name: /^Start date/ })
    await user.clear(date)
    await user.type(date, start)
    await user.keyboard('{Escape}')
    expect(screen.getByText(`The lease starts on ${start}. Until then the space keeps its current status.`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save lease' }))

    expect(await screen.findByText('The lease of B 204 for Aino Virtanen was created.')).toBeInTheDocument()
    expect(await createDataLayer('localStorage').spaces.getById('space-kuopio-harbour-10')).toMatchObject({
      status: 'available',
    })
  })

  it('removes a tenant from a space after confirmation and frees the space', async () => {
    const user = userEvent.setup()
    renderRoute('/tenants/tenant-aino-virtanen')

    await user.click(await screen.findByRole('button', { name: 'Remove from space A 1' }))
    const dialog = screen.getByRole('dialog', { name: 'Remove Aino Virtanen from A 1?' })
    expect(dialog).toHaveTextContent(formatDate(toIsoDate(addDays(new Date(), -1))))
    await user.click(within(dialog).getByRole('button', { name: 'Remove from space' }))

    expect(await screen.findByText('Aino Virtanen was removed from A 1.')).toBeInTheDocument()
    expect(screen.getByText('This tenant does not rent any space at the moment.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spaces' })).toHaveFocus()
    expect(screen.getByRole('region', { name: 'Past leases' })).toHaveTextContent('A 1')
    expect(await createDataLayer('localStorage').spaces.getById('space-helsinki-kallio-1')).toMatchObject({
      status: 'available',
    })
  })

  it('cancels an upcoming lease', async () => {
    const user = userEvent.setup()
    renderRoute('/tenants/tenant-aurora-yoga')

    await user.click(await screen.findByRole('button', { name: 'Remove from space A 302' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancel the lease of A 302?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel lease' }))

    expect(await screen.findByText('The upcoming lease of A 302 was cancelled.')).toBeInTheDocument()
    expect(await createDataLayer('localStorage').leases.getById('lease-59')).toBeNull()
  })

  it('explains why a tenant with leases cannot be deleted, and deletes one without', async () => {
    const user = userEvent.setup()
    const data = createDataLayer('localStorage')
    const tenant = await createTenant(data, {
      ...emptyTenantForm(),
      name: 'Pohjola Bakery Oy',
      email: 'hello@pohjola-bakery.example',
    })
    const { unmount } = renderRoute('/tenants/tenant-old-town-books')

    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    const blocked = screen.getByRole('dialog', { name: 'Old Town Books Oy cannot be deleted' })
    expect(blocked).toHaveTextContent('1 lease')
    expect(within(blocked).queryByRole('button', { name: 'Delete tenant' })).not.toBeInTheDocument()
    unmount()

    const { router } = renderRoute(`/tenants/${tenant.id}`)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Delete Pohjola Bakery Oy?' })).getByRole('button', {
        name: 'Delete tenant',
      }),
    )
    expect(await screen.findByText('Tenant Pohjola Bakery Oy was deleted.')).toBeInTheDocument()
    expect(await data.tenants.getById(tenant.id)).toBeNull()
    expect(router.state.location.pathname).toBe('/tenants')
  })

  it('shows a not-found page for an unknown tenant', async () => {
    renderRoute('/tenants/missing/edit')

    expect(await screen.findByRole('heading', { level: 1, name: 'Tenant not found' })).toBeInTheDocument()
  })

  it('is translated to Finnish', async () => {
    renderRoute('/tenants', { language: 'fi' })

    await screen.findByRole('table')
    expect(screen.getByText('31 vuokralaista')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nykyiset tilat' })).toBeInTheDocument()
    expect(screen.getAllByText('Henkilö').length).toBeGreaterThan(0)
  })
})
