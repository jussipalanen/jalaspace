import { expect, test, type Page } from '@playwright/test'
import { expectPageHeading, signedInState } from './fixtures'

test.use({ storageState: async ({ baseURL }, use) => use(signedInState(baseURL!)) })

const count = (page: Page) => page.locator('.list-toolbar__count')
const openMaintenanceFigure = (page: Page) =>
  page.getByRole('region', { name: 'Key figures' }).getByRole('link', { name: /^Open maintenance/ })

test.describe('maintenance', () => {
  test('filters survive a reload and a direct link', async ({ page }) => {
    await page.goto('/maintenance')
    await expect(count(page)).toHaveText('14 tasks')

    await page.getByLabel('Property').selectOption({ label: 'Joensuu Center' })
    await page.getByLabel('Space').selectOption({ label: 'Retail 1' })
    await expect(count(page)).toHaveText('1 task')
    await expect(page).toHaveURL(
      '/maintenance?property=property-joensuu-center&space=space-joensuu-center-1',
    )

    await page.reload()
    await expect(count(page)).toHaveText('1 task')
    await expect(page.getByRole('link', { name: 'Grease trap service' })).toBeVisible()

    await page.goto('/maintenance?priority=high&status=open')
    await expect(count(page)).toHaveText('1 task')
    await expect(page.getByLabel('Priority')).toHaveValue('high')
  })

  test('adds a task from its property, edits it and keeps the changes after a reload', async ({ page }) => {
    await page.goto('/properties/property-kuopio-harbour')
    await page.getByRole('link', { name: 'Add task' }).click()
    await expectPageHeading(page, 'Add maintenance task')
    await expect(page.getByLabel('Property')).toHaveValue('property-kuopio-harbour')

    await page.getByLabel('Title').fill('Leaking radiator valve')
    await page.getByLabel('Description').fill('Water drips from the valve in the meeting room.')
    await page.getByLabel('Category').selectOption({ label: 'Heating and ventilation' })
    await page.getByRole('textbox', { name: 'Due date' }).fill('30.2.2026')
    await page.getByRole('button', { name: 'Save task' }).click()
    await expect(page.getByText('Enter a real date as d.m.yyyy, e.g. 30.9.2026.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Due date' })).toBeFocused()

    await page.getByRole('textbox', { name: 'Due date' }).fill('1.12.2099')
    // Move one day forward in the calendar.
    await page.getByRole('button', { name: 'Choose due date from a calendar' }).click()
    await expect(page.getByRole('dialog', { name: 'Choose due date' })).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('textbox', { name: 'Due date' })).toHaveValue('2.12.2099')
    await page.getByRole('button', { name: 'Save task' }).click()
    await expect(page.getByText('Task Leaking radiator valve was added.')).toBeVisible()
    await expectPageHeading(page, 'Leaking radiator valve')

    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    await page.getByLabel('Priority').selectOption({ label: 'High' })
    await page.getByRole('button', { name: 'Save task' }).click()
    await expect(page.getByText('Changes to Leaking radiator valve were saved.')).toBeVisible()

    await page.reload()
    await expectPageHeading(page, 'Leaking radiator valve')
    const details = page.getByRole('region', { name: 'Details' })
    await expect(details).toContainText('Heating and ventilation')
    await expect(details).toContainText('2.12.2099')
    await expect(page.getByRole('region', { name: 'Status' })).toContainText('High')
  })

  test('completing and reopening a task updates the dashboard and property counts', async ({ page }) => {
    await page.goto('/')
    await expect(openMaintenanceFigure(page)).toContainText('10')

    await page
      .getByRole('region', { name: 'Recent maintenance' })
      .getByRole('link', { name: 'Main entrance door closer broken' })
      .click()
    const status = page.getByRole('region', { name: 'Status' })
    await status.getByRole('button', { name: 'Start work' }).click()
    await expect(page.getByText('Work on Main entrance door closer broken was started.')).toBeVisible()
    await status.getByRole('button', { name: 'Mark as completed' }).click()
    await expect(status).toContainText('Completed')

    await page.reload()
    await expect(status).toContainText('The task was completed on')

    await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
    await expect(openMaintenanceFigure(page)).toContainText('9')
    await page.goto('/properties/property-joensuu-center')
    await expect(
      page.getByRole('region', { name: 'Key figures' }).getByText('Open maintenance').locator('..'),
    ).toContainText('2')

    await page.goto('/maintenance/maintenance-3')
    await status.getByRole('button', { name: 'Reopen task' }).click()
    await expect(page.getByText('Main entrance door closer broken was reopened.')).toBeVisible()
    await page.goto('/')
    await expect(openMaintenanceFigure(page)).toContainText('10')
  })

  test('deletes a task after confirmation', async ({ page }) => {
    await page.goto('/maintenance/maintenance-2')
    await page.getByRole('button', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete Grease trap service?' })
    await dialog.getByRole('button', { name: 'Delete task' }).click()

    await expect(page.getByText('Task Grease trap service was deleted.')).toBeVisible()
    await expect(page).toHaveURL('/maintenance')
    await page.reload()
    await expect(count(page)).toHaveText('13 tasks')
    await expect(page.getByRole('link', { name: 'Grease trap service' })).toHaveCount(0)
  })

  test('shows a helpful page for an unknown task', async ({ page }) => {
    await page.goto('/maintenance/does-not-exist')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Maintenance task not found' }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Back to maintenance' }).click()
    await expectPageHeading(page, 'Maintenance')
  })
})
