import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { approveApplication, changeApplicationStatus } from '../../services/applicationService'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'
import { formatDate } from '../../utils/format'

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('applications', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('is in the sidebar under Leasing', async () => {
    renderRoute('/')

    const navigation = await screen.findByRole('navigation', { name: 'Main navigation' })
    expect(within(navigation).getByRole('link', { name: 'Applications' })).toHaveAttribute('href', '/applications')
  })

  it('lists applications newest first with their space and status', async () => {
    renderRoute('/applications')

    await screen.findByRole('table')
    expect(rows()).toHaveLength(8)
    expect(screen.getByText('8 applications')).toBeInTheDocument()
    const lotta = rows().find((row) => row.textContent?.includes('Lotta Esimerkki'))!
    expect(within(lotta).getByRole('link', { name: 'Lotta Esimerkki' })).toHaveAttribute(
      'href',
      '/applications/application-7',
    )
    expect(lotta).toHaveTextContent('A 11')
    expect(lotta).toHaveTextContent('Helsinki Kallio Residences')
    expect(lotta).toHaveTextContent('Submitted')
    expect(rows().at(-1)).toHaveTextContent('Pilates Studio Esimerkki Oy')
  })

  it('filters by status, property and search, keeps the filters in the URL and clears them', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/applications?status=open')

    await screen.findByRole('table')
    expect(screen.getByLabelText('Status')).toHaveValue('open')
    expect(rows()).toHaveLength(5)

    await user.selectOptions(screen.getByLabelText('Property'), 'Helsinki Kallio Residences')
    await user.type(screen.getByRole('searchbox', { name: 'Search applications' }), 'oskari')
    expect(router.state.location.search).toBe('?status=open&property=property-helsinki-kallio&q=oskari')
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Oskari Esimerkki')

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(rows()).toHaveLength(8)
  })

  it('shows the details of an application', async () => {
    renderRoute('/applications/application-6')

    expect(await screen.findByRole('heading', { level: 1, name: 'Consulting Esimerkki Oy' })).toBeInTheDocument()
    const applicant = screen.getByRole('region', { name: 'Applicant' })
    expect(applicant).toHaveTextContent('Tapio Esimerkki')
    expect(within(applicant).getByRole('link', { name: 'info@consulting-esimerkki.example' })).toHaveAttribute(
      'href',
      'mailto:info@consulting-esimerkki.example',
    )
    const space = screen.getByRole('region', { name: 'Space' })
    expect(within(space).getByRole('link', { name: 'A 201' })).toHaveAttribute(
      'href',
      '/units/space-joensuu-center-5/edit',
    )
    expect(screen.getByRole('region', { name: 'Message' })).toHaveTextContent('small office with a kitchenette')
  })

  it('starts the review, then rejects the application after confirmation', async () => {
    const user = userEvent.setup()
    renderRoute('/applications/application-7')

    const status = await screen.findByRole('region', { name: 'Status' })
    await user.click(within(status).getByRole('button', { name: 'Start review' }))
    expect(await screen.findByText('The application of Lotta Esimerkki is now in review.')).toBeInTheDocument()
    expect(within(status).queryByRole('button', { name: 'Start review' })).not.toBeInTheDocument()

    await user.click(within(status).getByRole('button', { name: 'Reject' }))
    const dialog = screen.getByRole('dialog', { name: 'Reject the application of Lotta Esimerkki?' })
    await user.click(within(dialog).getByRole('button', { name: 'Reject application' }))

    expect(await screen.findByText('The application of Lotta Esimerkki was rejected.')).toBeInTheDocument()
    expect(within(status).getByText('Rejected')).toBeInTheDocument()
    expect(within(status).queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByRole('region', { name: 'Applicant' })).toHaveTextContent('Decided')
    expect(await createDataLayer('localStorage').applications.getById('application-7')).toMatchObject({
      status: 'rejected',
    })
  })

  it('marks an application as withdrawn, and cancelling the confirmation changes nothing', async () => {
    const user = userEvent.setup()
    renderRoute('/applications/application-4')

    const status = await screen.findByRole('region', { name: 'Status' })
    await user.click(within(status).getByRole('button', { name: 'Mark as withdrawn' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(await createDataLayer('localStorage').applications.getById('application-4')).toMatchObject({
      status: 'in_review',
    })

    await user.click(within(status).getByRole('button', { name: 'Mark as withdrawn' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as withdrawn' }))
    expect(
      await screen.findByText('The application of Oskari Esimerkki was marked as withdrawn.'),
    ).toBeInTheDocument()
  })

  it('approves an application into a new tenant, opens the lease form and then offers to reject the others', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/applications/application-4')
    const data = createDataLayer('localStorage')
    const desiredStart = (await data.applications.getById('application-4'))!.desiredStartDate

    const status = await screen.findByRole('region', { name: 'Status' })
    await user.click(within(status).getByRole('button', { name: 'Approve' }))
    const dialog = screen.getByRole('dialog', { name: 'Approve the application of Oskari Esimerkki?' })
    expect(dialog).toHaveTextContent('A new tenant, Oskari Esimerkki, is created from the application.')
    expect(dialog).toHaveTextContent('The lease is created only when you save it.')
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    expect(
      await screen.findByText('The application of Oskari Esimerkki was approved. Create the lease next.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/leases/new')
    expect(await screen.findByRole('combobox', { name: 'Tenant' })).toHaveDisplayValue('Oskari Esimerkki')
    expect(screen.getByRole('combobox', { name: 'Space' })).toHaveDisplayValue(/^A 11/)
    expect(screen.getByRole('textbox', { name: /^Start date/ })).toHaveValue(formatDate(desiredStart))
    await user.type(screen.getByLabelText(/^Monthly rent/), '1100')
    await user.click(screen.getByRole('button', { name: 'Save lease' }))

    expect(await screen.findByText('The lease of A 11 for Oskari Esimerkki was created.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/applications/application-4')
    const approved = await screen.findByRole('region', { name: 'Status' })
    expect(approved).toHaveTextContent('Approved')
    expect(within(approved).getByRole('link', { name: 'Oskari Esimerkki' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/tenants\//),
    )
    expect(within(approved).queryByRole('link', { name: 'Create lease' })).not.toBeInTheDocument()

    const others = screen.getByRole('region', { name: 'Other applications for this space' })
    expect(others).toHaveTextContent('1 other application for A 11 is still open.')
    expect(within(others).getByRole('link', { name: 'Lotta Esimerkki' })).toHaveAttribute(
      'href',
      '/applications/application-7',
    )
    await user.click(within(others).getByRole('button', { name: 'Reject all' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Reject the other application for A 11?' })).getByRole('button', {
        name: 'Reject all',
      }),
    )
    expect(await screen.findByText('1 application was rejected.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Other applications for this space' })).not.toBeInTheDocument()
    expect(await data.applications.getById('application-7')).toMatchObject({ status: 'rejected' })
  })

  it('offers to create the lease when an approved application has none yet', async () => {
    await approveApplication(createDataLayer('localStorage'), 'application-6')
    renderRoute('/applications/application-6')

    const status = await screen.findByRole('region', { name: 'Status' })
    expect(status).toHaveTextContent('The tenant has no lease for this space yet.')
    expect(within(status).getByRole('link', { name: 'Create lease' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/leases\/new\?tenant=.+&space=space-joensuu-center-5&startDate=\d{4}-\d{2}-\d{2}&returnTo=/),
    )
  })

  it('names the existing tenant when approving reuses them, and hides Approve for a space that was let', async () => {
    const user = userEvent.setup()
    const data = createDataLayer('localStorage')
    const application = (await data.applications.getById('application-5'))!
    await data.applications.update({ ...application, email: 'info@software-esimerkki.example' })
    const { unmount } = renderRoute('/applications/application-5')

    await user.click(within(await screen.findByRole('region', { name: 'Status' })).getByRole('button', { name: 'Approve' }))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Software Esimerkki Oy (info@software-esimerkki.example) is already a tenant, so the application is linked to them.',
    )
    unmount()

    const space = (await data.spaces.getById('space-helsinki-kallio-11'))!
    await data.spaces.update({ ...space, status: 'maintenance' })
    renderRoute('/applications/application-7')
    const status = await screen.findByRole('region', { name: 'Status' })
    expect(within(status).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(within(status).getByRole('button', { name: 'Start review' })).toBeInTheDocument()
  })

  it('lists the approved application on its tenant page and keeps the tenant from being deleted', async () => {
    const user = userEvent.setup()
    const { tenant } = await approveApplication(createDataLayer('localStorage'), 'application-6')
    renderRoute(`/tenants/${tenant.id}`)

    const section = await screen.findByRole('region', { name: 'Applications' })
    expect(within(section).getByRole('link', { name: 'Application for A 201' })).toHaveAttribute(
      'href',
      '/applications/application-6',
    )
    expect(section).toHaveTextContent('Approved')

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('dialog', { name: 'Consulting Esimerkki Oy cannot be deleted' })).toHaveTextContent(
      '1 approved application',
    )
  })

  it('explains when the status was already changed in another tab', async () => {
    const user = userEvent.setup()
    renderRoute('/applications/application-7')

    const status = await screen.findByRole('region', { name: 'Status' })
    await changeApplicationStatus(createDataLayer('localStorage'), 'application-7', 'withdrawn')
    await user.click(within(status).getByRole('button', { name: 'Start review' }))

    expect(await within(status).findByRole('alert')).toHaveTextContent('already changed elsewhere')
  })

  it('warns when the space of an open application is no longer available', async () => {
    const data = createDataLayer('localStorage')
    const space = (await data.spaces.getById('space-helsinki-kallio-11'))!
    await data.spaces.update({ ...space, status: 'maintenance' })
    renderRoute('/applications/application-7')

    expect(await screen.findByText(/Space no longer available/)).toBeInTheDocument()
  })

  it('deletes an application after confirmation', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/applications/application-2')

    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete the application of Print Esimerkki Oy?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete application' }))

    expect(await screen.findByText('The application of Print Esimerkki Oy was deleted.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/applications')
    expect(await createDataLayer('localStorage').applications.getById('application-2')).toBeNull()
  })

  it('explains that a space with applications cannot be deleted', async () => {
    const user = userEvent.setup()
    renderRoute('/units/space-kuopio-harbour-17/edit')

    await user.click(await screen.findByRole('button', { name: 'Delete space' }))

    const dialog = screen.getByRole('dialog', { name: 'B 305 cannot be deleted' })
    expect(dialog).toHaveTextContent('1 application')
  })

  it('shows a not-found page for an unknown application', async () => {
    renderRoute('/applications/missing')

    expect(await screen.findByRole('heading', { level: 1, name: 'Application not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to applications' })).toHaveAttribute('href', '/applications')
  })

  it('shows an empty state when there are no applications', async () => {
    window.localStorage.setItem('jalaspace_applications', '[]')
    renderRoute('/applications')

    expect(await screen.findByRole('heading', { name: 'No applications yet' })).toBeInTheDocument()
  })

  it('is translated to Finnish', async () => {
    renderRoute('/applications', { language: 'fi' })

    await screen.findByRole('table')
    expect(screen.getByRole('heading', { level: 1, name: 'Hakemukset' })).toBeInTheDocument()
    expect(screen.getByText('8 hakemusta')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Toivottu alkamispäivä' })).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getAllByText('Käsittelyssä')).toHaveLength(2)
  })
})
