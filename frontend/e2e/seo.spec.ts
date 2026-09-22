import { expect, test } from '@playwright/test'

// JalaSpace is a public demo, so search engines must not index it.
test.describe('search engines', () => {
  test('every page asks search engines not to index or follow it', async ({ page }) => {
    for (const path of ['/login', '/properties']) {
      await page.goto(path)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    }
  })

  test('robots.txt lets crawlers fetch pages so they can see the noindex', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('text/plain')
    const body = await response.text()
    expect(body).toContain('User-agent: *')
    expect(body).not.toMatch(/^Disallow: \/$/m)
  })
})
