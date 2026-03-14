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

test.describe('Payment flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking')
  })

  test('submit redirects to Stripe checkout URL (mocked)', async ({ page }) => {
    // Mock API — return a fake Stripe checkout URL pointing back to our app
    const fakeCheckoutUrl = `${page.url().split('/booking')[0]}/booking/success?reference=SC-ABCD1234`

    await page.route('/api/bookings', async route => {
      await route.fulfill({
        status:      201,
        contentType: 'application/json',
        body:        JSON.stringify({
          data: {
            id:          'test-uuid',
            reference:   'SC-ABCD1234',
            total:       15000,
            status:      'PENDING_PAYMENT',
            checkoutUrl: fakeCheckoutUrl,
          },
        }),
      })
    })

    await fillBookingForm(page)
    await page.getByRole('button', { name: /book & pay now/i }).click()

    // Should redirect to the checkoutUrl (our mocked success page)
    await expect(page).toHaveURL(/\/booking\/success\?reference=SC-ABCD1234/)
    await expect(page.getByText(/booking confirmed/i)).toBeVisible()
    await expect(page.getByText('SC-ABCD1234')).toBeVisible()
  })

  test('success page shows reference number', async ({ page }) => {
    await page.goto('/booking/success?reference=SC-TEST1234')
    await expect(page.getByText(/booking confirmed/i)).toBeVisible()
    await expect(page.getByText('SC-TEST1234')).toBeVisible()
    await expect(page.getByRole('link', { name: /book another/i })).toBeVisible()
  })

  test('success page works without a reference', async ({ page }) => {
    await page.goto('/booking/success')
    await expect(page.getByText(/booking confirmed/i)).toBeVisible()
  })

  test('cancelled page shows and links back to booking', async ({ page }) => {
    await page.goto('/booking/cancelled?reference=SC-TEST1234')
    await expect(page.getByText(/payment cancelled/i)).toBeVisible()
    await expect(page.getByText('SC-TEST1234')).toBeVisible()
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
  })

  test('shows Stripe error when API fails to create session', async ({ page }) => {
    await page.route('/api/bookings', async route => {
      await route.fulfill({
        status:      500,
        contentType: 'application/json',
        body:        JSON.stringify({
          error: { message: 'Failed to create payment session. Please try again.', code: 'STRIPE_ERROR' },
        }),
      })
    })

    await fillBookingForm(page)
    await page.getByRole('button', { name: /book & pay now/i }).click()
    // Form should remain visible — not redirected
    await expect(page.getByRole('button', { name: /book & pay now/i })).toBeVisible()
  })
})
