import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '../../test/renderRoute'

const sidebar = async () => within(await screen.findByRole('complementary', { name: /^(Sidebar|Sivupalkki)$/ }))

describe('API documentation link', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('opens the API docs in a new tab when the API address is configured', async () => {
    vi.stubEnv('VITE_API_URL', 'https://jalaspace.onrender.com/')
    renderRoute('/settings')

    const link = (await sidebar()).getByRole('link', { name: 'API docs (opens in a new tab)' })
    expect(link).toHaveAttribute('href', 'https://jalaspace.onrender.com/docs')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('is translated to Finnish', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
    renderRoute('/settings', { language: 'fi' })

    expect(
      (await sidebar()).getByRole('link', { name: 'API-kuvaus (avautuu uuteen välilehteen)' }),
    ).toHaveAttribute('href', 'http://localhost:3000/docs')
  })

  it('is not shown without an API address', async () => {
    renderRoute('/settings')
    expect((await sidebar()).queryByRole('link', { name: /API docs/ })).not.toBeInTheDocument()
  })
})
