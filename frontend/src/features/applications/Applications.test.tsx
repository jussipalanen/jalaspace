import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { changeApplicationStatus } from '../../services/applicationService'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'

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
    expect(rows()).toHaveLength(7)
    expect(screen.getByText('7 applications')).toBeInTheDocument()
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
    expect(rows()).toHaveLength(7)
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
    expect(screen.getByText('7 hakemusta')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Toivottu alkamispäivä' })).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getAllByText('Käsittelyssä')).toHaveLength(2)
  })
})
