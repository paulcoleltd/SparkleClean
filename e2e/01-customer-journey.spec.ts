/**
 * TEST SUITE 1 — Customer / User Journey
 * =========================================
 * Tests the full experience for a member of the public and a signed-in customer.
 */

import { test, expect, type Page } from '@playwright/test'

test.setTimeout(30_000)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0] as string
}

async function fillBookingForm(page: Page) {
  await page.getByLabel('Full Name').fill('Jane Smith')
  await page.getByLabel('Email Address').fill('jane@example.com')
  await page.getByLabel('Phone Number').fill('07700 900123')
  await page.getByLabel('Street Address').fill('123 High Street')
  await page.getByLabel('City').fill('London')
  await page.getByLabel('County').fill('Greater London')
  await page.getByLabel('Postcode').fill('SW1A 1AA')
  await page.getByLabel('Service Type').selectOption('RESIDENTIAL')
  await page.getByLabel('Frequency').selectOption('ONE_TIME')
  await page.getByLabel('Property Size').selectOption('MEDIUM')
  await page.getByLabel('Preferred Date').fill(tomorrow())
  await page.getByLabel('Time Slot').selectOption('MORNING')
}

// ─── 1. Public homepage ────────────────────────────────────────────────────────

test.describe('🌐 Public — Homepage', () => {
  test('loads with hero, CTA and navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/sparkleclean/i)
    await expect(page.getByRole('heading', { name: /your home deserves to sparkle/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /book a cleaning today/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Book Now' }).first()).toBeVisible()
  })

  test('Services nav link goes to services page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Services' }).first().click()
    await expect(page).toHaveURL('/services')
    await expect(page.getByRole('heading', { name: /our services/i })).toBeVisible()
  })

  test('About nav link goes to about page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'About' }).first().click()
    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: /about sparkleclean/i })).toBeVisible()
  })

  test('Book Now button goes to booking page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Book Now' }).first().click()
    await expect(page).toHaveURL('/booking')
  })
})

// ─── 2. Booking form ───────────────────────────────────────────────────────────

test.describe('📅 Customer — Booking Form', () => {
  // Use 'load' so React hydrates before form interactions
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking', { waitUntil: 'load' })
  })

  test('renders booking page with form and summary panel', async ({ page }) => {
    await expect(page).toHaveTitle(/book a cleaning/i)
    await expect(page.getByRole('heading', { name: /book your cleaning/i })).toBeVisible()
    await expect(page.getByText('Booking Summary')).toBeVisible()
  })

  test('price updates when service type is selected', async ({ page }) => {
    await page.getByLabel('Service Type').selectOption('RESIDENTIAL')
    await expect(page.getByText('£150', { exact: true })).toBeVisible()
  })

  test('price updates when window-cleaning extra is checked', async ({ page }) => {
    await page.getByLabel('Service Type').selectOption('RESIDENTIAL')
    // The extras checkboxes use react-hook-form register('extras') with value attribute
    await page.locator('input[value="WINDOWS"]').check()
    await expect(page.getByText('£200', { exact: true })).toBeVisible()
  })

  test('validation error shown for missing name', async ({ page }) => {
    await page.getByRole('button', { name: /book & pay now/i }).click()
    await expect(page.getByText(/must be at least 2/i)).toBeVisible({ timeout: 10000 })
  })

  test('validation error shown for invalid email', async ({ page }) => {
    await page.getByLabel('Email Address').fill('not-an-email')
    await page.getByLabel('Email Address').blur()
    await page.getByRole('button', { name: /book & pay now/i }).click()
    await expect(page.getByText(/valid email/i)).toBeVisible({ timeout: 10000 })
  })

  test('validation error shown for past date', async ({ page }) => {
    await fillBookingForm(page)
    await page.getByLabel('Preferred Date').fill('2020-01-01')
    await page.getByRole('button', { name: /book & pay now/i }).click()
    await expect(page.getByText(/future date/i)).toBeVisible()
  })

  test('booking form is usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: /book your cleaning/i })).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByRole('button', { name: /book & pay now/i })).toBeVisible()
  })
})

// ─── 3. Account registration ───────────────────────────────────────────────────

test.describe('✍️ Customer — Registration', () => {
  test('register page renders all required fields', async ({ page }) => {
    await page.goto('/account/register', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible()
  })

  test('shows error for password shorter than 8 characters', async ({ page }) => {
    await page.goto('/account/register', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill('jane@example.com')
    await page.getByLabel(/password/i).first().fill('short')
    await page.getByRole('button', { name: /create account|register/i }).click()
    await expect(page.getByText(/password.*8|at least 8/i)).toBeVisible()
  })

  test('shows conflict error when email already exists (mocked)', async ({ page }) => {
    await page.route('/api/account/register', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'An account with this email already exists.' } }),
      })
    })
    // Use 'load' so React hydrates before we interact with the form
    await page.goto('/account/register', { waitUntil: 'load' })
    await page.getByLabel(/name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill('existing@example.com')
    await page.getByLabel(/password/i).first().fill('Password123!')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 10000 })
  })
})

// ─── 4. Account login ──────────────────────────────────────────────────────────

test.describe('🔑 Customer — Login', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/account/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /forgot.*password/i })).toBeVisible()
    // Register link text is "Create one" — not "Create account"
    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible()
  })

  test('shows error message for wrong credentials', async ({ request }) => {
    const res = await request.get('/account/login?error=CredentialsSignin')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toMatch(/invalid email or password|incorrect/i)
  })

  test('unauthenticated visit to /account/bookings redirects to login', async ({ page }) => {
    // Use default waitUntil ('load') — 'domcontentloaded' resolves before the
    // server-side redirect fires on force-dynamic pages.
    await page.goto('/account/bookings')
    await expect(page).toHaveURL(/\/account\/login/, { timeout: 10000 })
  })

  test('unauthenticated visit to /account/profile redirects to login', async ({ page }) => {
    await page.goto('/account/profile', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/account\/login/, { timeout: 15000 })
  })
})

// ─── 5. Password reset ─────────────────────────────────────────────────────────

test.describe('🔓 Customer — Password Reset', () => {
  test('forgot password page renders email field and send button', async ({ page }) => {
    await page.goto('/account/forgot-password', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset/i })).toBeVisible()
  })

  test('shows success message after submitting (mocked)', async ({ page }) => {
    await page.route('/api/account/forgot-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reset email sent' }),
      })
    })
    // Use 'load' so React hydrates, enabling the submit button when email is filled
    await page.goto('/account/forgot-password', { waitUntil: 'load' })
    await page.getByLabel(/email/i).fill('jane@example.com')
    await page.getByRole('button', { name: /send reset/i }).click()
    await expect(page.getByText(/check your email|email sent|link sent/i)).toBeVisible({ timeout: 10000 })
  })
})

// ─── 6. Contact page ───────────────────────────────────────────────────────────

test.describe('✉️ Customer — Contact Page', () => {
  test('contact page renders heading', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible()
  })

  test('contact page has at least one input field', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' })
    const inputs = page.locator('input, textarea')
    await expect(inputs.first()).toBeVisible()
  })
})

// ─── 7. Promo code API ─────────────────────────────────────────────────────────

test.describe('🏷️ Customer — Promo Code API', () => {
  test('returns 400 for missing code param', async ({ request }) => {
    const res = await request.get('/api/promo/validate?total=10000')
    expect(res.status()).toBe(400)
  })

  test('returns 400 for negative total', async ({ request }) => {
    const res = await request.get('/api/promo/validate?code=TEST&total=-100')
    expect(res.status()).toBe(400)
  })
})

// ─── 8. Service area API ──────────────────────────────────────────────────────

test.describe('📍 Customer — Service Area API', () => {
  test('returns 400 for missing postcode', async ({ request }) => {
    const res = await request.get('/api/service-areas/check')
    expect(res.status()).toBe(400)
  })

  test('returns 200 with serviced boolean for a postcode', async ({ request }) => {
    const res = await request.get('/api/service-areas/check?postcode=SW1A1AA')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(typeof json.serviced).toBe('boolean')
  })
})
