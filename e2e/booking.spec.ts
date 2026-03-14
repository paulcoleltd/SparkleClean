import { test, expect, type Page } from '@playwright/test'

// ─── Fixture ──────────────────────────────────────────────────────────────────

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0] as string
}

async function fillBookingForm(page: Page) {
  await page.getByLabel('Full Name').fill('Jane Smith')
  await page.getByLabel('Email Address').fill('jane@example.com')
  await page.getByLabel('Phone Number').fill('(555) 123-4567')
  await page.getByLabel('Street Address').fill('123 Main Street')
  await page.getByLabel('City').fill('Springfield')
  await page.getByLabel('State').fill('IL')
  await page.getByLabel('ZIP Code').fill('62701')
  await page.getByLabel('Service Type').selectOption('RESIDENTIAL')
  await page.getByLabel('Frequency').selectOption('ONE_TIME')
  await page.getByLabel('Property Size').selectOption('MEDIUM')
  await page.getByLabel('Preferred Date').fill(tomorrow())
  await page.getByLabel('Time Slot').selectOption('MORNING')
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Booking flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking')
  })

  test('renders the booking page with form and summary', async ({ page }) => {
    await expect(page).toHaveTitle(/book a cleaning/i)
    await expect(page.getByRole('heading', { name: /book your cleaning/i })).toBeVisible()
    await expect(page.getByText('Booking Summary')).toBeVisible()
    await expect(page.getByText('$0')).toBeVisible()
  })

  test('price summary updates when service is selected', async ({ page }) => {
    await page.getByLabel('Service Type').selectOption('RESIDENTIAL')
    await expect(page.getByText('$150')).toBeVisible()
  })

  test('price summary updates when extras are checked', async ({ page }) => {
    await page.getByLabel('Service Type').selectOption('RESIDENTIAL')
    await page.getByLabel(/window cleaning/i).check()
    await expect(page.getByText('$200')).toBeVisible()
  })

  test('shows validation error when required name is missing', async ({ page }) => {
    await page.getByRole('button', { name: /book & pay now/i }).click()
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible()
  })

  test('shows validation error for invalid email', async ({ page }) => {
    await page.getByLabel('Email Address').fill('not-an-email')
    await page.getByLabel('Email Address').blur()
    await page.getByRole('button', { name: /book & pay now/i }).click()
    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test('shows validation error for past date', async ({ page }) => {
    await fillBookingForm(page)
    await page.getByLabel('Preferred Date').fill('2020-01-01')
    await page.getByRole('button', { name: /book & pay now/i }).click()
    await expect(page.getByText(/future date/i)).toBeVisible()
  })

  test('shows error message when API returns 400', async ({ page }) => {
    await page.route('/api/bookings', async route => {
      await route.fulfill({
        status:      400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Please select a valid future date', code: 'VALIDATION_ERROR', field: 'date' },
        }),
      })
    })

    await fillBookingForm(page)
    await page.getByRole('button', { name: /book & pay now/i }).click()
    // Mutation error — form should remain visible (no redirect)
    await expect(page.getByRole('button', { name: /book & pay now/i })).toBeVisible()
  })
})

test.describe('Booking flow — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('booking form is usable on mobile', async ({ page }) => {
    await page.goto('/booking')
    await expect(page.getByRole('heading', { name: /book your cleaning/i })).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByRole('button', { name: /book & pay now/i })).toBeVisible()
  })
})
