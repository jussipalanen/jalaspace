import { expect, test } from '@playwright/test'
import { signedInState } from './fixtures'

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
    expect(await page.evaluate(() => localStorage.getItem('jalaspace_seed_version'))).toBe('1')

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
})
