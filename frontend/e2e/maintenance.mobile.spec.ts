import { expect, test } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

test.describe('maintenance on a phone', () => {
  test('opens a task from the list and completes it with the keyboard', async ({ page }) => {
    await page.goto('/maintenance?status=in_progress')
    await expect(page.locator('.list-toolbar__count')).toHaveText('4 tasks')

    const task = page.getByRole('link', { name: 'Air conditioning too cold' })
    await task.focus()
    await page.keyboard.press('Enter')
    await expectPageHeading(page, 'Air conditioning too cold')

    const complete = page
      .getByRole('region', { name: 'Status' })
      .getByRole('button', { name: 'Mark as completed' })
    await complete.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByText('Air conditioning too cold was marked as completed.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Status' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Reopen task' })).toBeVisible()

    // The page must not scroll sideways on a phone.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
