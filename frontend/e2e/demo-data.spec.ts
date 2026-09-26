import { expect, test } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const readCollection = (key: string) =>
  JSON.parse(window.localStorage.getItem(key) ?? '[]') as { id: string; name?: string }[]

test.describe('demo data', () => {
  test('is seeded on the first visit and keeps changes after a reload', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()

    const properties = await page.evaluate(readCollection, 'jalaspace_properties')
    expect(properties).toHaveLength(4)
    expect(await page.evaluate(readCollection, 'jalaspace_units')).toHaveLength(68)
    expect(await page.evaluate(() => localStorage.getItem('jalaspace_seed_version'))).toBe('4')

    // Simulate a user edit, then reload: the seed must not overwrite it.
    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('jalaspace_properties') ?? '[]')
      stored[0].name = 'Edited by user'
      localStorage.setItem('jalaspace_properties', JSON.stringify(stored))
    })
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()

    const reloaded = await page.evaluate(readCollection, 'jalaspace_properties')
    expect(reloaded[0]?.name).toBe('Edited by user')
    expect(reloaded).toHaveLength(4)
  })

  test('is restored by Reset demo data in Settings after confirmation', async ({ page }) => {
    await page.goto('/settings')
    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('jalaspace_properties') ?? '[]')
      stored[0].name = 'Edited by user'
      localStorage.setItem('jalaspace_properties', JSON.stringify(stored))
    })
    await page.getByLabel('First name').fill('Esko')
    await page.getByRole('button', { name: 'Save profile' }).click()
    await expect(page.getByRole('banner').getByText('Esko User')).toBeVisible()

    await page.getByRole('button', { name: 'Reset demo data' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reset demo data?' })
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByLabel('First name')).toHaveValue('Esko')

    await page.getByRole('button', { name: 'Reset demo data' }).click()
    await dialog.getByRole('button', { name: 'Reset demo data' }).click()

    await expect(page.getByText('The demo data was reset.')).toBeVisible()
    await expect(page.getByRole('banner').getByText('Demo User')).toBeVisible()
    await expect(page.getByLabel('First name')).toHaveValue('Demo')

    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Properties' }).click()
    await expectPageHeading(page, 'Properties')
    await expect(page.getByText('Joensuu Center')).toBeVisible()
    await expect(page.getByText('Edited by user')).toHaveCount(0)
  })
})
