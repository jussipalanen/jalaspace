import { expect, test } from '@playwright/test'
import { expectPageHeading } from './fixtures'

test.describe('public application form on a phone', () => {
  test('fits the screen and sends an application', async ({ page }) => {
    await page.goto('/apply')
    await expectPageHeading(page, 'Find a space')
    await page.getByRole('link', { name: 'Apply for A 11, Helsinki Kallio Residences' }).click()
    await expectPageHeading(page, 'Apply for A 11')

    const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await page.getByRole('textbox', { name: /^Full name/ }).fill('Liisa Esimerkki')
    await page.getByRole('textbox', { name: /^Email/ }).fill('liisa.esimerkki@example.com')
    await page
      .getByRole('textbox', { name: /^Desired start date/ })
      .fill(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`)
    await page.getByRole('checkbox', { name: /I understand this is a demo/ }).check()

    // No horizontal scrolling at phone width.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    )

    await page.getByRole('button', { name: 'Send application' }).click()
    await expectPageHeading(page, 'Application sent')
  })
})
