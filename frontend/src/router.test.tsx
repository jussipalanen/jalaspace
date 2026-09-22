import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from './test/renderRoute'

describe('application routes', () => {
  it.each([
    ['/', 'Dashboard'],
    ['/properties', 'Properties'],
    ['/properties/abc-123', 'Property not found'],
    ['/units', 'Spaces'],
    ['/maintenance', 'Maintenance'],
    ['/maintenance/abc-123', 'Maintenance task details'],
    ['/tenants', 'Tenants'],
    ['/tenants/abc-123', 'Tenant details'],
    ['/leases', 'Leases'],
    ['/settings', 'Settings'],
  ])('renders %s inside the app shell', async (path, heading) => {
    renderRoute(path)

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows a not found page for unknown routes', async () => {
    renderRoute('/does-not-exist')

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/')
  })

  it('highlights the active navigation item', async () => {
    renderRoute('/maintenance/abc-123')

    const nav = await screen.findByRole('navigation', { name: 'Main navigation' })
    const activeLink = nav.querySelector('[aria-current="page"]')
    expect(activeLink).toHaveTextContent('Maintenance')
  })

  it('updates the document title from the route', async () => {
    renderRoute('/leases')

    await screen.findByRole('heading', { level: 1, name: 'Leases' })
    // The title is set in an effect, which may run after the heading renders.
    await waitFor(() => expect(document.title).toBe('Leases · JalaSpace'))
  })
})

describe('sidebar navigation', () => {
  it('opens with the menu button and closes with Escape', async () => {
    const user = userEvent.setup()
    renderRoute('/')

    const menuButton = await screen.findByRole('button', { name: 'Open navigation' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('navigates and closes the drawer when a link is chosen', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/')

    const menuButton = await screen.findByRole('button', { name: 'Open navigation' })
    await user.click(menuButton)
    await user.click(screen.getByRole('link', { name: 'Tenants' }))

    expect(router.state.location.pathname).toBe('/tenants')
    expect(await screen.findByRole('heading', { level: 1, name: 'Tenants' })).toBeInTheDocument()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
