import { expect, test } from '@playwright/test'
import { expectPageHeading, SESSION_KEY, signIn } from './fixtures'

test.describe('demo authentication', () => {
  test('redirects signed-out visitors to the login page', async ({ page }) => {
    await page.goto('/properties')

    await expect(page).toHaveURL('/login')
    await expectPageHeading(page, 'Sign in')
    await expect(page).toHaveTitle('Sign in · JalaSpace')
  })

  test('validates the form before submitting', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Email is required.')).toBeVisible()
    await expect(page.getByText('Password is required.')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await signIn(page, 'demo@jalaspace.app', 'wrong-password')

    await expect(page.getByRole('alert')).toHaveText('Invalid email or password.')
    await expect(page).toHaveURL('/login')
  })

  test('signs in, returns to the requested page and survives a reload', async ({ page }) => {
    await page.goto('/tenants/abc-123')
    await expect(page).toHaveURL('/login')

    await signIn(page)

    await expect(page).toHaveURL('/tenants/abc-123')
    await expectPageHeading(page, 'Tenant details')

    await page.reload()
    await expectPageHeading(page, 'Tenant details')
    await expect(page.getByText('Demo User')).toBeVisible()
  })

  test('fills in the demo credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Fill in demo credentials' }).click()
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')
    await expectPageHeading(page, 'Dashboard')
  })

  test('signs out and stays signed out after a reload', async ({ page }) => {
    await page.goto('/login')
    await signIn(page)
    await expectPageHeading(page, 'Dashboard')

    await page.getByRole('button', { name: 'Sign out' }).click()

    await expect(page).toHaveURL('/login')
    expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull()

    await page.reload()
    await expectPageHeading(page, 'Sign in')
  })
})
