import { expect, test } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

test.describe('profile', () => {
  test('edits the profile from the header and keeps it after a reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Demo User/ }).click()
    await expectPageHeading(page, 'Settings')

    await page.getByLabel('First name').fill('Esko')
    await page.getByLabel('Last name').fill('Esimerkki')
    await page.getByLabel('Day').selectOption('22')
    await page.getByLabel('Month').selectOption('9')
    await page.getByLabel('Year').selectOption('1990')
    await page.getByRole('button', { name: 'Save profile' }).click()

    await expect(page.getByText('Your profile was saved.')).toBeVisible()
    const header = page.getByRole('banner')
    await expect(header.getByText('Esko Esimerkki')).toBeVisible()
    await expect(header.getByText('EE', { exact: true })).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('First name')).toHaveValue('Esko')
    await expect(page.getByLabel('Day')).toHaveValue('22')
    await expect(page.getByLabel('Month')).toHaveValue('9')
    await expect(page.getByLabel('Year')).toHaveValue('1990')
    await expect(page.getByText('Your profile was saved.')).toHaveCount(0)
  })

  test('rejects an impossible or future birthdate', async ({ page }) => {
    await page.goto('/settings')

    await page.getByLabel('Day').selectOption('31')
    await page.getByLabel('Month').selectOption('2')
    await page.getByLabel('Year').selectOption('1990')
    await page.getByRole('button', { name: 'Save profile' }).click()
    await expect(page.getByText('This date does not exist.')).toBeVisible()
    await expect(page.getByLabel('Day')).toBeFocused()

    const thisYear = String(new Date().getFullYear())
    await page.getByLabel('Day').selectOption('31')
    await page.getByLabel('Month').selectOption('12')
    await page.getByLabel('Year').selectOption(thisYear)
    await page.getByRole('button', { name: 'Save profile' }).click()
    // 31.12. of this year is in the future on every day except New Year's Eve.
    const isNewYearsEve = new Date().getMonth() === 11 && new Date().getDate() === 31
    if (!isNewYearsEve) {
      await expect(page.getByText('The birthdate cannot be in the future.')).toBeVisible()
    }
  })
})
