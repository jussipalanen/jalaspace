import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDataLayer, type DataLayer } from '../../repositories'
import { LocalStorageDemoDataStore } from '../../repositories/localStorage/LocalStorageDemoDataStore'
import { initializeDemoData } from '../../services/demoDataService'
import { renderRoute } from '../../test/renderRoute'

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

async function fillRequired(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.type(await screen.findByLabelText(/^Title/), title)
}

describe('maintenance', () => {
  beforeEach(async () => {
    await initializeDemoData(new LocalStorageDemoDataStore())
  })

  it('lists all tasks with property, space, priority and status', async () => {
    renderRoute('/maintenance')

    await screen.findByRole('table')
    expect(rows()).toHaveLength(14)
    expect(screen.getByText('14 tasks')).toBeInTheDocument()
    const doorCloser = rows().find((row) => row.textContent?.includes('Main entrance door closer'))!
    expect(within(doorCloser).getByRole('link', { name: 'Main entrance door closer broken' })).toHaveAttribute(
      'href',
      '/maintenance/maintenance-3',
    )
    expect(doorCloser).toHaveTextContent('Joensuu Center')
    expect(doorCloser).toHaveTextContent('Common area')
    expect(doorCloser).toHaveTextContent('High priority')
    expect(doorCloser).toHaveTextContent('Open')
  })

  it('opens filters from the URL and clears the space when the property changes', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute(
      '/maintenance?property=property-joensuu-center&space=space-joensuu-center-1',
    )

    await screen.findByRole('table')
    expect(screen.getByLabelText('Space')).toHaveValue('space-joensuu-center-1')
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Grease trap service')

    await user.selectOptions(screen.getByLabelText('Property'), 'Kuopio Harbour Business Park')
    expect(router.state.location.search).toBe('?property=property-kuopio-harbour')
    expect(screen.getByLabelText('Space')).toHaveValue('')
    expect(rows()).toHaveLength(3)
  })

  it('combines priority, status and search, and clears them', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/maintenance')

    await user.selectOptions(await screen.findByLabelText('Priority'), 'High')
    await user.selectOptions(screen.getByLabelText('Status'), 'Open')
    expect(rows()).toHaveLength(1)
    expect(router.state.location.search).toBe('?priority=high&status=open')

    await user.type(screen.getByRole('searchbox', { name: 'Search tasks' }), 'leak')
    const noResults = screen.getByRole('heading', { name: 'No tasks match the filters' }).parentElement!
    await user.click(within(noResults).getByRole('button', { name: 'Clear filters' }))
    expect(rows()).toHaveLength(14)
  })

  it('shows task details with the property, space and dates', async () => {
    renderRoute('/maintenance/maintenance-2')

    expect(await screen.findByRole('heading', { level: 1, name: 'Grease trap service' })).toBeInTheDocument()
    const details = screen.getByRole('region', { name: 'Details' })
    expect(within(details).getByRole('link', { name: 'Joensuu Center' })).toHaveAttribute(
      'href',
      '/properties/property-joensuu-center',
    )
    expect(details).toHaveTextContent('Retail 1')
    expect(details).toHaveTextContent('Plumbing')
    expect(screen.getByRole('region', { name: 'Description' })).toHaveTextContent(
      'Scheduled grease trap emptying for the café in Retail 1.',
    )
  })

  it('starts, completes and reopens a task, and saves each change', async () => {
    const user = userEvent.setup()
    const data = createDataLayer('localStorage')
    renderRoute('/maintenance/maintenance-3')

    const status = await screen.findByRole('region', { name: 'Status' })
    await user.click(within(status).getByRole('button', { name: 'Start work' }))
    expect(await screen.findByText('Work on Main entrance door closer broken was started.')).toBeInTheDocument()
    expect(within(status).getByText('In progress')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Status' })).toHaveFocus()

    await user.click(within(status).getByRole('button', { name: 'Mark as completed' }))
    expect(
      await screen.findByText('Main entrance door closer broken was marked as completed.'),
    ).toBeInTheDocument()
    const completed = await data.maintenance.getById('maintenance-3')
    expect(completed).toMatchObject({ status: 'completed' })
    expect(completed?.completedAt).not.toBeNull()
    expect(screen.getByRole('region', { name: 'Details' })).toHaveTextContent('Completed')

    await user.click(within(status).getByRole('button', { name: 'Reopen task' }))
    expect(await screen.findByText('Main entrance door closer broken was reopened.')).toBeInTheDocument()
    expect(await data.maintenance.getById('maintenance-3')).toMatchObject({
      status: 'open',
      completedAt: null,
    })
  })

  it('does not save invalid values and focuses the first invalid field', async () => {
    const user = userEvent.setup()
    renderRoute('/maintenance/new')

    await user.type(await screen.findByLabelText(/^Due date/), '31.2.2026')
    await user.click(screen.getByRole('button', { name: 'Save task' }))

    expect(screen.getByText('Please correct the highlighted fields.')).toBeInTheDocument()
    expect(screen.getByText('Choose a property.')).toBeInTheDocument()
    expect(screen.getByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByText('Enter a real date as d.m.yyyy, e.g. 30.9.2026.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Property/)).toHaveFocus()
    expect(await createDataLayer('localStorage').maintenance.getAll()).toHaveLength(14)
  })

  it('offers only spaces of the chosen property and clears the space when it changes', async () => {
    const user = userEvent.setup()
    renderRoute('/maintenance/new?property=property-joensuu-center')

    const space = await screen.findByLabelText(/^Space/)
    expect(screen.getByLabelText(/^Property/)).toHaveValue('property-joensuu-center')
    await user.selectOptions(space, 'Retail 1')
    expect(within(space).queryByRole('option', { name: 'B 101' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/^Property/), 'Kuopio Harbour Business Park')
    expect(space).toHaveValue('')
    expect(within(space).queryByRole('option', { name: 'Retail 1' })).not.toBeInTheDocument()
  })

  it('chooses a due date from the calendar with the keyboard', async () => {
    const user = userEvent.setup()
    renderRoute('/maintenance/new?property=property-joensuu-center')

    const input = await screen.findByLabelText(/^Due date/)
    // Typing starts with a click, which opens the calendar; Escape closes it.
    await user.type(input, '30.9.2026')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'Choose due date from a calendar' })
    await user.click(toggle)

    const dialog = screen.getByRole('dialog', { name: 'Choose due date' })
    expect(within(dialog).getByRole('heading', { name: 'September 2026' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /30 September 2026, Selected/ })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(within(dialog).getByRole('heading', { name: 'October 2026' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /, 1 October 2026/ })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(input).toHaveValue('1.10.2026')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(input).toHaveFocus()

    await user.click(toggle)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(input).toHaveFocus()
    expect(input).toHaveValue('1.10.2026')
  })

  it('opens the calendar from the field and still lets the date be typed', async () => {
    const user = userEvent.setup()
    renderRoute('/maintenance/new?property=property-joensuu-center')

    const input = await screen.findByRole('textbox', { name: /^Due date/ })
    await user.click(input)
    const dialog = screen.getByRole('dialog', { name: 'Choose due date' })
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'true')

    await user.type(input, '15.3.2027')
    expect(input).toHaveValue('15.3.2027')
    expect(within(dialog).getByRole('heading', { name: 'March 2027' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /15 March 2027, Selected/ })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: /, 20 March 2027/ }))
    expect(input).toHaveValue('20.3.2027')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /20 March 2027, Selected/ })).toHaveFocus()
    await user.click(screen.getByRole('heading', { level: 1 }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('creates a task from the property page and shows it after saving', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/properties/property-joensuu-center')

    await user.click(await screen.findByRole('link', { name: 'Add task' }))
    await fillRequired(user, '  Broken shop window ')
    await user.selectOptions(screen.getByLabelText(/^Space/), 'Retail 1')
    await user.selectOptions(screen.getByLabelText(/^Priority/), 'High')
    await user.type(screen.getByLabelText(/^Due date/), '1.1.2020')
    await user.click(screen.getByRole('button', { name: 'Save task' }))

    expect(await screen.findByText('Task Broken shop window was added.')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Broken shop window' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Details' })).toHaveTextContent('1.1.2020 · Overdue')
    const id = router.state.location.pathname.split('/').at(-1)!
    expect(await createDataLayer('localStorage').maintenance.getById(id)).toMatchObject({
      title: 'Broken shop window',
      spaceId: 'space-joensuu-center-1',
      priority: 'high',
      dueDate: '2020-01-01',
    })
  })

  it('shows a field error when the space was deleted after the form opened', async () => {
    const user = userEvent.setup()
    const data = createDataLayer('localStorage')
    await data.spaces.create({
      id: 'temporary-space',
      propertyId: 'property-joensuu-center',
      name: 'Pop-up 1',
      type: 'retail',
      floor: 1,
      areaM2: 20,
      status: 'available',
      createdAt: '2026-09-22T10:30:00.000Z',
      updatedAt: '2026-09-22T10:30:00.000Z',
    })
    renderRoute('/maintenance/new?property=property-joensuu-center')
    await fillRequired(user, 'Check the lights')
    await user.selectOptions(screen.getByLabelText(/^Space/), 'Pop-up 1')

    await data.spaces.delete('temporary-space')
    await user.click(screen.getByRole('button', { name: 'Save task' }))

    expect(
      await screen.findByText(
        'This space is not part of the chosen property or no longer exists. Choose another space.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^Space/)).toHaveFocus()
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Check the lights')
    expect(await data.maintenance.getAll()).toHaveLength(14)
  })

  it('keeps the input when storage fails', async () => {
    const user = userEvent.setup()
    const real = createDataLayer('localStorage')
    const dataLayer: DataLayer = {
      ...real,
      maintenance: {
        getAll: () => real.maintenance.getAll(),
        getById: (id) => real.maintenance.getById(id),
        create: () => Promise.reject(new DOMException('Storage is full', 'QuotaExceededError')),
        update: (task) => real.maintenance.update(task),
        delete: (id) => real.maintenance.delete(id),
      },
    }
    renderRoute('/maintenance/new?property=property-joensuu-center', { dataLayer })

    await fillRequired(user, 'Check the lights')
    await user.click(screen.getByRole('button', { name: 'Save task' }))

    expect(
      await screen.findByText('Unable to save the task. Please try again.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Check the lights')
    expect(screen.getByRole('button', { name: 'Save task' })).toBeEnabled()
  })

  it('edits a task and keeps its completion time', async () => {
    const user = userEvent.setup()
    const data = createDataLayer('localStorage')
    // maintenance-4 is completed in the seed data.
    const before = (await data.maintenance.getById('maintenance-4'))!
    renderRoute('/maintenance/maintenance-4/edit')

    const title = await screen.findByLabelText(/^Title/)
    expect(title).toHaveValue(before.title)
    await user.clear(title)
    await user.type(title, 'LED stairwell lighting')
    await user.click(screen.getByRole('button', { name: 'Save task' }))

    expect(await screen.findByText('Changes to LED stairwell lighting were saved.')).toBeInTheDocument()
    const after = await data.maintenance.getById('maintenance-4')
    expect(after).toMatchObject({ title: 'LED stairwell lighting', status: 'completed' })
    expect(after?.completedAt).toBe(before.completedAt)
  })

  it('deletes a task after confirmation', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/maintenance/maintenance-2')

    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete Grease trap service?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete task' }))

    expect(await screen.findByText('Task Grease trap service was deleted.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/maintenance')
    expect(await createDataLayer('localStorage').maintenance.getById('maintenance-2')).toBeNull()
  })

  it('shows a not-found page for an unknown task', async () => {
    renderRoute('/maintenance/missing/edit')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Maintenance task not found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to maintenance' })).toHaveAttribute(
      'href',
      '/maintenance',
    )
  })

  it('asks for a property first when there are none', async () => {
    window.localStorage.setItem('jalaspace_properties', '[]')
    window.localStorage.setItem('jalaspace_units', '[]')
    window.localStorage.setItem('jalaspace_maintenance', '[]')
    renderRoute('/maintenance')

    expect(await screen.findByRole('heading', { name: 'Add a property first' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add property' })).toHaveAttribute('href', '/properties/new')
    expect(screen.queryByRole('link', { name: 'Add task' })).not.toBeInTheDocument()
  })

  it('is translated to Finnish', async () => {
    renderRoute('/maintenance', { language: 'fi' })

    await screen.findByRole('table')
    expect(screen.getByText('14 tehtävää')).toBeInTheDocument()
    expect(screen.getByLabelText('Kiireellisyys')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Määräpäivä' })).toBeInTheDocument()
  })
})
