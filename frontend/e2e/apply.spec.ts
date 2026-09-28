import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signIn } from './fixtures'

/** A start date a month from now, as typed in the form. */
function nextMonth(): string {
  const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

async function fillApplication(page: Page) {
  await page.getByRole('textbox', { name: /^Full name/ }).fill('Liisa Esimerkki')
  await page.getByRole('textbox', { name: /^Email/ }).fill('liisa.esimerkki@example.com')
  await page.getByRole('textbox', { name: /^Phone/ }).fill('+358501234566')
  await page.getByRole('textbox', { name: /^Desired start date/ }).fill(nextMonth())
  await page.getByRole('textbox', { name: /^Message/ }).fill('Looking for a home near the harbour.')
  await page.getByRole('checkbox', { name: /I understand this is a demo/ }).check()
}

test.describe('public application form', () => {
  test('a visitor applies from the sign-in page and the manager sees the application', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Browse available spaces and apply' }).click()
    await expectPageHeading(page, 'Find a space')
    await expect(page).toHaveTitle('Available spaces · JalaSpace')

    await page.getByLabel('City').selectOption('Kuopio')
    await page.reload()
    await expect(page.getByRole('article')).toHaveCount(3)
    await page.getByRole('link', { name: 'Apply for B 103, Kuopio Harbour Business Park' }).click()
    await expectPageHeading(page, 'Apply for B 103')

    // The consent is required.
    await page.getByRole('button', { name: 'Send application' }).click()
    await expect(page.getByText('Confirm that you have not entered real personal information.')).toBeVisible()

    await fillApplication(page)
    await page.getByRole('button', { name: 'Send application' }).click()
    await expectPageHeading(page, 'Application sent')
    await expect(page.getByRole('heading', { name: 'Application sent' })).toBeFocused()

    await page.getByRole('link', { name: 'For property managers: sign in' }).click()
    await signIn(page)
    // The sidebar counts the new application.
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Applications, 4 new' }),
    ).toBeVisible()
    await page.goto('/applications?status=submitted')
    await expect(page.getByRole('link', { name: 'Liisa Esimerkki' })).toBeVisible()
    await page.getByRole('link', { name: 'Liisa Esimerkki' }).click()
    await expect(page.getByRole('region', { name: 'Message' })).toContainText('near the harbour')
  })

  test('the manager opens the form in a new tab from the Applications page', async ({ page, context }) => {
    await page.goto('/login')
    await signIn(page)
    await page.goto('/applications')

    const [form] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: 'Application form (opens in a new tab)' }).click(),
    ])
    await expectPageHeading(form, 'Find a space')
    await expect(form.getByRole('link', { name: 'Back to JalaSpace' })).toBeVisible()
  })
})
