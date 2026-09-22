import { expect, test } from '@playwright/test'
import { DEMO_EMAIL, DEMO_PASSWORD, expectPageHeading, signedInState } from './fixtures'

test.describe('language', () => {
  test.describe('signed in', () => {
    test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

    test('switches to Finnish and remembers the choice after a reload', async ({ page }) => {
      await page.goto('/maintenance')
      await expectPageHeading(page, 'Maintenance')
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')

      await page.getByRole('combobox', { name: 'Language' }).selectOption('Suomi')

      await expectPageHeading(page, 'Huolto')
      await expect(page).toHaveURL('/maintenance')
      await expect(page.locator('html')).toHaveAttribute('lang', 'fi')
      await expect(page).toHaveTitle('Huolto · JalaSpace')
      await expect(page.getByRole('navigation', { name: 'Päävalikko' })).toBeVisible()

      await page.reload()
      await expectPageHeading(page, 'Huolto')
      await expect(page.getByRole('combobox', { name: 'Kieli' })).toHaveValue('fi')

      await page.getByRole('combobox', { name: 'Kieli' }).selectOption('English')
      await expectPageHeading(page, 'Maintenance')
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    })

    test('can be chosen in Settings', async ({ page }) => {
      await page.goto('/settings')
      await page
        .getByRole('region', { name: 'Language' })
        .getByRole('combobox', { name: 'Language' })
        .selectOption('Suomi')

      await expectPageHeading(page, 'Asetukset')
      await expect(page.locator('html')).toHaveAttribute('lang', 'fi')
      await expect(page.getByRole('banner').getByRole('combobox', { name: 'Kieli' })).toHaveValue('fi')

      await page.reload()
      await expectPageHeading(page, 'Asetukset')
    })

    test('translates the dashboard figures', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('combobox', { name: 'Language' }).selectOption('fi')

      const figures = page.getByRole('region', { name: 'Tunnusluvut' })
      await expect(figures.getByRole('link', { name: /^Käyttöaste/ })).toContainText('85 %')
      await expect(figures.getByRole('link', { name: /^Avoimet huollot/ })).toContainText(
        '4 kiireellistä',
      )
    })
  })

  test('can be chosen on the login page and stays after signing in', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('combobox', { name: 'Language' }).selectOption('Suomi')
    await expectPageHeading(page, 'Kirjaudu sisään')

    await page.getByLabel('Sähköposti').fill(DEMO_EMAIL)
    await page.getByLabel('Salasana').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()

    await expectPageHeading(page, 'Yleiskatsaus')
    await expect(page.getByRole('combobox', { name: 'Kieli' })).toHaveValue('fi')
  })

  test.describe('with a Finnish browser', () => {
    test.use({ locale: 'fi-FI' })

    test('starts in Finnish on the first visit', async ({ page }) => {
      await page.goto('/login')

      await expectPageHeading(page, 'Kirjaudu sisään')
      await expect(page.locator('html')).toHaveAttribute('lang', 'fi')
      await expect(page.getByRole('combobox', { name: 'Kieli' })).toHaveValue('fi')
    })
  })
})
