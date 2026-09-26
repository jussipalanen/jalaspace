import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../repositories/localStorage/keys'
import { renderRoute } from '../../test/renderRoute'

describe('profile settings', () => {
  it('opens from the name in the header', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/')

    await user.click(await screen.findByRole('link', { name: /Demo User.*Edit profile/ }))

    expect(router.state.location.pathname).toBe('/settings')
    expect(await screen.findByRole('heading', { level: 2, name: 'Profile' })).toBeInTheDocument()
  })

  it('shows the default profile with a read-only email', async () => {
    renderRoute('/settings')

    expect(await screen.findByLabelText(/^First name/)).toHaveValue('Demo')
    expect(screen.getByLabelText(/^Last name/)).toHaveValue('User')
    const email = screen.getByLabelText('Email')
    expect(email).toHaveValue('demo@jalaspace.app')
    expect(email).toHaveAttribute('readonly')
  })

  it('saves the profile and updates the header immediately', async () => {
    const user = userEvent.setup()
    renderRoute('/settings')

    const firstName = await screen.findByLabelText(/^First name/)
    await user.clear(firstName)
    await user.type(firstName, 'Esko')
    await user.clear(screen.getByLabelText(/^Last name/))
    await user.type(screen.getByLabelText(/^Last name/), 'Esimerkki')
    await user.selectOptions(screen.getByLabelText('Day'), '22')
    await user.selectOptions(screen.getByLabelText('Month'), '9')
    await user.selectOptions(screen.getByLabelText('Year'), '1990')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByText('Your profile was saved.')).toBeInTheDocument()
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: /Esko Esimerkki/ })).toHaveTextContent('EE')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.profile)!)).toMatchObject({
      firstName: 'Esko',
      lastName: 'Esimerkki',
      birthDate: '1990-09-22',
    })
  })

  it('does not save a date that does not exist', async () => {
    const user = userEvent.setup()
    renderRoute('/settings')

    await user.selectOptions(await screen.findByLabelText('Day'), '31')
    await user.selectOptions(screen.getByLabelText('Month'), '2')
    await user.selectOptions(screen.getByLabelText('Year'), '1990')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(screen.getByText('This date does not exist.')).toBeInTheDocument()
    expect(screen.getByLabelText('Day')).toHaveFocus()
    expect(screen.getByLabelText('Month')).toHaveAccessibleDescription(
      'Optional. Choose the day, month and year. This date does not exist.',
    )
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull()
  })

  it('offers 28 days for February in a non-leap year', async () => {
    const user = userEvent.setup()
    renderRoute('/settings')

    await user.selectOptions(await screen.findByLabelText('Month'), '2')
    await user.selectOptions(screen.getByLabelText('Year'), '2023')

    // Options are the days plus the "not selected" option.
    expect(within(screen.getByLabelText('Day')).getAllByRole('option')).toHaveLength(29)
  })

  it('loads a saved profile', async () => {
    window.localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify({
        firstName: 'Aino',
        lastName: 'Esimerkki',
        birthDate: '1985-02-03',
        updatedAt: '2026-09-22T10:30:00.000Z',
      }),
    )
    renderRoute('/settings')

    expect(await screen.findByLabelText(/^First name/)).toHaveValue('Aino')
    expect(screen.getByLabelText('Day')).toHaveValue('3')
    expect(screen.getByLabelText('Month')).toHaveValue('2')
    expect(screen.getByLabelText('Year')).toHaveValue('1985')
    expect(within(screen.getByRole('banner')).getByText('Aino Esimerkki')).toBeInTheDocument()
  })

  it('is translated to Finnish', async () => {
    renderRoute('/settings', { language: 'fi' })

    expect(await screen.findByLabelText(/^Etunimi/)).toHaveValue('Demo')
    expect(screen.getByRole('group', { name: 'Syntymäaika' })).toBeInTheDocument()
    expect(screen.getByLabelText('Kuukausi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tallenna profiili' })).toBeInTheDocument()
  })
})
