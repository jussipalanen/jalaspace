import { expect, test } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const count = (page: import('@playwright/test').Page) => page.locator('.list-toolbar__count')

test.describe('spaces', () => {
  test('the dashboard opens the available spaces, and filters survive a reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'View all 7' }).click()

    await expect(page).toHaveURL('/units?status=available')
    await expect(count(page)).toHaveText('7 spaces')

    await page.getByLabel('Property').selectOption({ label: 'Joensuu Center' })
    await expect(count(page)).toHaveText('2 spaces')
    await page.reload()
    await expect(count(page)).toHaveText('2 spaces')
    await expect(page.getByLabel('Status')).toHaveValue('available')
  })

  test('adds a space from its property and shows it after a reload', async ({ page }) => {
    await page.goto('/properties/property-kuopio-harbour')
    await page.getByRole('link', { name: 'Add space' }).click()
    await expectPageHeading(page, 'Add space')

    await page.getByLabel('Name').fill('B 401')
    await page.getByLabel('Floor').fill('4')
    await page.getByLabel('Area (m²)').fill('48,5')
    await page.getByRole('button', { name: 'Save space' }).click()

    await expect(page.getByText('Space B 401 was added.')).toBeVisible()
    await expect(page).toHaveURL('/units?property=property-kuopio-harbour')
    await expect(count(page)).toHaveText('19 spaces')

    await page.reload()
    const row = page.getByRole('row').filter({ hasText: 'B 401' })
    await expect(row).toContainText('48.5 m²')
    await expect(row).toContainText('Available')

    await page.goto('/properties/property-kuopio-harbour')
    await expect(page.getByRole('link', { name: 'Edit B 401' })).toBeVisible()
    await page.getByRole('link', { name: 'Edit B 401' }).click()
    await page.getByLabel('Name').fill('B 402')
    await page.getByLabel('Status').selectOption('maintenance')
    await page.getByRole('button', { name: 'Save space' }).click()
    await expect(page.getByText('Changes to B 402 were saved.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: 'B 402' })).toContainText('Maintenance')
    await expect(page.getByRole('link', { name: 'Edit B 401' })).toHaveCount(0)
  })

  test('keeps an occupied space occupied and explains why it cannot be deleted', async ({ page }) => {
    await page.goto('/units/space-joensuu-center-6/edit')

    await expect(page.getByText('Occupied by Nordic Pixel Oy under an active lease.')).toBeVisible()
    await expect(page.getByLabel('Status', { exact: true })).toHaveCount(0)
    await page.getByLabel('Area (m²)').fill('75')
    await page.getByRole('button', { name: 'Save space' }).click()
    await expect(page.getByText('Changes to A 202 were saved.')).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: 'A 202' })).toContainText('Occupied')
    await page.getByRole('link', { name: 'Edit A 202' }).click()
    await page.getByRole('button', { name: 'Delete space' }).click()
    const dialog = page.getByRole('dialog', { name: 'A 202 cannot be deleted' })
    await expect(dialog).toContainText('1 lease')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('deletes a new space after confirmation', async ({ page }) => {
    await page.goto('/units/new?property=property-tampere-hervanta')
    await page.getByLabel('Name').fill('Storage 7')
    await page.getByLabel('Type').selectOption('Storage')
    await page.getByLabel('Area (m²)').fill('20')
    await page.getByRole('button', { name: 'Save space' }).click()
    await expect(page.getByText('Space Storage 7 was added.')).toBeVisible()

    await page.getByRole('link', { name: 'Edit Storage 7' }).click()
    await page.getByRole('button', { name: 'Delete space' }).click()
    await page.getByRole('dialog', { name: 'Delete Storage 7?' }).getByRole('button', { name: 'Delete space' }).click()

    await expect(page.getByText('Space Storage 7 was deleted.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit Storage 7' })).toHaveCount(0)
  })
})
