import { test, expect } from '@playwright/test'

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
  })

  test('renders heading, contact details, and form', async ({ page }) => {
    await expect(page).toHaveTitle(/contact/i)
    await expect(page.getByRole('heading', { name: /contact us/i })).toBeVisible()
    // Contact info sidebar
    await expect(page.getByText(/info@sparkleclean.com/i)).toBeVisible()
    // Form fields
    await expect(page.getByLabel(/your name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/message/i)).toBeVisible()
  })

  test('shows validation errors when form is submitted empty', async ({ page }) => {
    await page.getByRole('button', { name: /send message/i }).click()
    // At least one validation error should appear
    await expect(page.locator('form')).toContainText(/required|must be|at least/i)
  })

  test('shows validation error for invalid email', async ({ page }) => {
    await page.getByLabel(/your name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByLabel(/email/i).blur()
    await page.getByRole('button', { name: /send message/i }).click()
    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test('shows success state after successful submission (mocked API)', async ({ page }) => {
    await page.route('/api/contact', async route => {
      await route.fulfill({
        status:      201,
        contentType: 'application/json',
        body:        JSON.stringify({ data: { id: 'msg-1' } }),
      })
    })

    await page.getByLabel(/your name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill('jane@example.com')
    await page.getByLabel(/subject/i).fill('Test enquiry')
    await page.getByLabel(/message/i).fill('This is a test message for the contact form.')
    await page.getByRole('button', { name: /send message/i }).click()

    await expect(page.getByText(/message sent|thank you|we.ll be in touch/i)).toBeVisible()
  })

  test('shows error banner when API returns 500 (mocked)', async ({ page }) => {
    await page.route('/api/contact', async route => {
      await route.fulfill({
        status:      500,
        contentType: 'application/json',
        body:        JSON.stringify({ error: { message: 'Internal error' } }),
      })
    })

    await page.getByLabel(/your name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill('jane@example.com')
    await page.getByLabel(/subject/i).fill('Test enquiry')
    await page.getByLabel(/message/i).fill('Test message content here.')
    await page.getByRole('button', { name: /send message/i }).click()

    // Form should remain visible (not replaced by success state)
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible()
  })
})

test.describe('Contact page — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('contact form is usable on mobile', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByRole('heading', { name: /contact us/i })).toBeVisible()
    await expect(page.getByLabel(/your name/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible()
  })
})
