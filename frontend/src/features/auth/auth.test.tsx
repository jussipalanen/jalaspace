import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../repositories/localStorage/keys'
import { renderRoute } from '../../test/renderRoute'

describe('demo authentication flow', () => {
  it('redirects signed-out users to the login page', async () => {
    const { router } = renderRoute('/properties', { authenticated: false })

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('signs in with the demo credentials and returns to the requested page', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/tenants/abc?tab=leases', { authenticated: false })

    await user.type(await screen.findByLabelText('Email'), 'demo@jalaspace.app')
    await user.type(screen.getByLabelText('Password'), 'demo')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tenant details' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/tenants/abc')
    expect(router.state.location.search).toBe('?tab=leases')
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).not.toBeNull()
  })

  it('can fill in the demo credentials', async () => {
    const user = userEvent.setup()
    renderRoute('/login', { authenticated: false })

    await user.click(await screen.findByRole('button', { name: 'Fill in demo credentials' }))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('shows an error for wrong credentials and stays signed out', async () => {
    const user = userEvent.setup()
    renderRoute('/login', { authenticated: false })

    await user.type(await screen.findByLabelText('Email'), 'demo@jalaspace.app')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull()
  })

  it('does not submit an empty form', async () => {
    const user = userEvent.setup()
    renderRoute('/login', { authenticated: false })

    await user.click(await screen.findByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Email is required.')
  })

  it('redirects signed-in users away from the login page', async () => {
    const { router } = renderRoute('/login')

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows the signed-in user and signs out', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/leases')

    expect(await screen.findByText('Demo User')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(window.localStorage.getItem(STORAGE_KEYS.session)).toBeNull()
  })
})
