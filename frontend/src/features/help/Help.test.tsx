import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute'

async function openChapter(path: string, title: string) {
  const rendered = renderRoute(path)
  await screen.findByRole('heading', { level: 1, name: title })
  return rendered
}

describe('handbook', () => {
  it('is linked from the sidebar', async () => {
    renderRoute('/')
    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' })
    expect(within(sidebar).getByRole('link', { name: 'Handbook' })).toHaveAttribute('href', '/help')
  })

  it('lists every chapter in the contents, grouped like the sidebar', async () => {
    renderRoute('/help')

    expect(await screen.findByRole('heading', { level: 1, name: 'Handbook' })).toBeInTheDocument()
    const contents = await screen.findByRole('navigation', { name: 'Contents' })
    expect(within(contents).getByRole('heading', { name: 'Leasing' })).toBeInTheDocument()
    const links = within(contents).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Getting started',
      'Dashboard',
      'Properties',
      'Spaces',
      'Maintenance',
      'Applications',
      'Tenants',
      'Leases',
      'Settings',
      'Walkthroughs',
    ])
    expect(within(contents).getByRole('link', { name: 'Maintenance' })).toHaveAttribute(
      'href',
      '/help/maintenance',
    )
  })

  it('shows a chapter with its sections and links to them', async () => {
    await openChapter('/help/maintenance', 'Maintenance')

    expect(screen.getByText('Chapter 5 of 10')).toBeInTheDocument()
    const toc = screen.getByRole('navigation', { name: 'In this chapter' })
    expect(within(toc).getByRole('link', { name: 'Following a task' })).toHaveAttribute('href', '#status')
    expect(screen.getByRole('heading', { level: 2, name: 'Following a task' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Maintenance' })).toHaveAttribute('href', '/maintenance')
    // Names of buttons are bold, as they appear in the app.
    expect(screen.getAllByText('Mark as completed')[0].tagName).toBe('STRONG')
  })

  it('moves to the previous and next chapters', async () => {
    const user = userEvent.setup()
    const { router } = await openChapter('/help/maintenance', 'Maintenance')

    const pager = screen.getByRole('navigation', { name: 'Chapters' })
    expect(within(pager).getByRole('link', { name: /Previous chapter\s*Spaces/ })).toHaveAttribute(
      'href',
      '/help/spaces',
    )
    await user.click(within(pager).getByRole('link', { name: /Next chapter\s*Applications/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Applications' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/help/applications')
  })

  it('has no previous chapter on the first chapter', async () => {
    await openChapter('/help/getting-started', 'Getting started')
    const pager = screen.getByRole('navigation', { name: 'Chapters' })
    expect(within(pager).queryByRole('link', { name: /Previous chapter/ })).not.toBeInTheDocument()
    expect(within(pager).getByRole('link', { name: /Next chapter/ })).toBeInTheDocument()
  })

  it('has no next chapter on the last chapter', async () => {
    await openChapter('/help/walkthroughs', 'Walkthroughs')
    const pager = screen.getByRole('navigation', { name: 'Chapters' })
    expect(within(pager).getByRole('link', { name: /Previous chapter/ })).toBeInTheDocument()
    expect(within(pager).queryByRole('link', { name: /Next chapter/ })).not.toBeInTheDocument()
  })

  it('shows a message for an unknown chapter', async () => {
    renderRoute('/help/no-such-chapter')

    expect(await screen.findByRole('heading', { level: 1, name: 'Chapter not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the contents' })).toHaveAttribute('href', '/help')
  })

  it('is shown in Finnish', async () => {
    renderRoute('/help/leases', { language: 'fi' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Vuokrasopimukset' })).toBeInTheDocument()
    expect(screen.getByText('Luku 8/10')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Sopimuksen tilanne' })).toBeInTheDocument()
  })

  it('stays on the same chapter when the language changes', async () => {
    const user = userEvent.setup()
    const { router } = await openChapter('/help/tenants', 'Tenants')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'Suomi')

    expect(await screen.findByRole('heading', { level: 1, name: 'Vuokralaiset' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Sisään- ja poismuutto' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/help/tenants')
  })
})

describe('help button', () => {
  it.each([
    ['/', '/help/dashboard'],
    ['/maintenance', '/help/maintenance'],
    ['/maintenance/new', '/help/maintenance#add'],
    ['/leases/new', '/help/leases#create'],
    ['/settings', '/help/settings'],
    ['/help', '/help'],
    ['/does-not-exist', '/help'],
  ])('on %s opens %s', async (path, help) => {
    renderRoute(path)
    const button = await screen.findByRole('link', { name: 'Help for this page' })
    expect(button).toHaveAttribute('href', help)
  })

  it('has a Finnish name', async () => {
    renderRoute('/tenants', { language: 'fi' })
    expect(await screen.findByRole('link', { name: 'Tämän sivun ohje' })).toHaveAttribute(
      'href',
      '/help/tenants',
    )
  })
})
