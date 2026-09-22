import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createDataLayer, type DataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'

async function seedDemoData() {
  await initializeDemoData(new LocalStorageDemoDataStore())
}

function figure(label: string) {
  const figures = screen.getByRole('region', { name: 'Key figures' })
  return within(figures).getByRole('link', { name: new RegExp(`^${label}`) })
}

describe('Dashboard', () => {
  it('shows key figures calculated from the demo data', async () => {
    await seedDemoData()
    renderRoute('/')

    await screen.findByRole('region', { name: 'Key figures' })
    expect(figure('Properties')).toHaveTextContent('Properties4In 4 cities')
    expect(figure('Spaces')).toHaveTextContent('Spaces687 available')
    expect(figure('Occupancy')).toHaveTextContent('Occupancy85%58 of 68 spaces occupied')
    expect(figure('Open maintenance')).toHaveTextContent('Open maintenance104 high priority')
    expect(figure('Properties')).toHaveAttribute('href', '/properties')
  })

  it('lists recent maintenance, available spaces and activity', async () => {
    await seedDemoData()
    renderRoute('/')

    const maintenance = await screen.findByRole('region', { name: 'Recent maintenance' })
    const task = within(maintenance).getByRole('link', { name: 'Main entrance door closer broken' })
    expect(task).toHaveAttribute('href', '/maintenance/maintenance-3')
    expect(within(maintenance).getAllByText('High')[0]).toBeInTheDocument()

    const spaces = screen.getByRole('region', { name: 'Available spaces' })
    expect(within(spaces).getByRole('link', { name: 'View all 7' })).toHaveAttribute(
      'href',
      '/units?status=available',
    )
    expect(within(spaces).getByText(/^Reserved from \d{1,2}\.\d{1,2}\.\d{4}$/)).toBeInTheDocument()

    const activity = screen.getByRole('region', { name: 'Recent activity' })
    expect(within(activity).getAllByRole('listitem')).toHaveLength(6)
  })

  it('shows empty states when there is no data', async () => {
    renderRoute('/')

    await screen.findByRole('region', { name: 'Key figures' })
    expect(figure('Occupancy')).toHaveTextContent('Occupancy—0 of 0 spaces occupied')
    expect(screen.getByText('No maintenance tasks yet.')).toBeInTheDocument()
    expect(screen.getByText('All spaces are occupied or in maintenance.')).toBeInTheDocument()
    expect(screen.getByText('No activity yet.')).toBeInTheDocument()
  })

  it('shows an error with a working retry when data cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const real = createDataLayer('localStorage')
    const getAll = vi
      .fn<DataLayer['properties']['getAll']>()
      .mockRejectedValueOnce(new Error('Storage unavailable'))
      .mockImplementation(() => real.properties.getAll())
    const dataLayer: DataLayer = { ...real, properties: { ...real.properties, getAll } }
    await seedDemoData()

    renderRoute('/', { dataLayer })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Unable to load the dashboard.')
    expect(alert).not.toHaveTextContent('Storage unavailable')

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('region', { name: 'Key figures' })).toBeInTheDocument()
    expect(figure('Properties')).toHaveTextContent('4')
    vi.restoreAllMocks()
  })
})
