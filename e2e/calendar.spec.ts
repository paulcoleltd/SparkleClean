/**
 * Admin Calendar E2E tests.
 * Runs as part of the 'admin-authenticated' project — requires admin session.
 */

import { test, expect } from '@playwright/test'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

test.describe('Admin calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/calendar')
  })

  test('renders heading and week grid', async ({ page }) => {
    await expect(page).toHaveTitle(/calendar.*admin|admin.*calendar/i)
    await expect(page.getByRole('heading', { name: /booking calendar/i })).toBeVisible()

    // All 7 day columns must appear
    for (const day of DAY_NAMES) {
      await expect(page.getByText(new RegExp(day, 'i')).first()).toBeVisible()
    }
  })

  test('prev/next week buttons are present and change the date range label', async ({ page }) => {
    const rangeBefore = await page.locator('h2').textContent()

    await page.getByRole('button', { name: /next week|›/i }).click()
    const rangeAfter = await page.locator('h2').textContent()

    expect(rangeBefore).not.toBe(rangeAfter)
  })

  test('"Today" button returns to current week', async ({ page }) => {
    const today = new Date()
    const todayMonthShort = today.toLocaleDateString('en-GB', { month: 'short' })

    // Go to next week first
    await page.getByRole('button', { name: /next week|›/i }).click()
    // Return to current week
    await page.getByRole('button', { name: 'Today' }).click()

    // Range label should mention the current month
    await expect(page.locator('h2')).toContainText(todayMonthShort)
  })

  test('clicking a booking card navigates to booking detail', async ({ page }) => {
    // Mock the calendar API to return our seeded test booking
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setUTCHours(8, 0, 0, 0)

    await page.route('/api/admin/calendar*', async route => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({
          bookings: [{
            id:          'test-booking-id',
            reference:   'SC-E2ETEST1',
            name:        'E2E Test Customer',
            service:     'RESIDENTIAL',
            timeSlot:    'MORNING',
            scheduledAt: tomorrow.toISOString(),
            status:      'CONFIRMED',
            total:       15000,
            cleaner:     null,
          }],
        }),
      })
    })

    await page.reload()
    const card = page.getByText('E2E Test Customer')
    await expect(card).toBeVisible()
    await card.click()
    await expect(page).toHaveURL(/\/admin\/bookings\//)
  })

  test('legend shows status dots', async ({ page }) => {
    await expect(page.getByText(/pending/i).first()).toBeVisible()
    await expect(page.getByText(/confirmed/i).first()).toBeVisible()
    await expect(page.getByText(/completed/i).first()).toBeVisible()
  })

  test('previous week navigation works', async ({ page }) => {
    const rangeBefore = await page.locator('h2').textContent()
    await page.getByRole('button', { name: /prev.*week|‹/i }).click()
    const rangeAfter = await page.locator('h2').textContent()
    expect(rangeBefore).not.toBe(rangeAfter)
  })
})

test.describe('Admin calendar — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('calendar renders on mobile', async ({ page }) => {
    await page.goto('/admin/calendar')
    await expect(page.getByRole('heading', { name: /booking calendar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible()
  })
})
