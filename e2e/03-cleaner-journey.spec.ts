/**
 * TEST SUITE 3 — Cleaner Journey
 * ================================
 * Auth protection, login, assigned bookings portal, and availability editor.
 */

import { test, expect } from '@playwright/test'

test.setTimeout(30_000)

// ─── 1. Auth protection ───────────────────────────────────────────────────────
// The cleaner-journey project sets storageState at project level, so we must
// clear it here to test unauthenticated behaviour.

test.describe('🔒 Cleaner — Auth Protection', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated /cleaner/bookings redirects to cleaner login', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/cleaner\/login/, { timeout: 15000 })
  })

  test('unauthenticated /cleaner/availability redirects to cleaner login', async ({ page }) => {
    await page.goto('/cleaner/availability', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/cleaner\/login/, { timeout: 15000 })
  })

  test('unauthenticated /cleaner redirects to cleaner login', async ({ page }) => {
    await page.goto('/cleaner', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/cleaner\/login/, { timeout: 15000 })
  })
})

// ─── 2. Cleaner login page ────────────────────────────────────────────────────

test.describe('🔑 Cleaner — Login Page', () => {
  test('renders Cleaner Portal heading and form fields', async ({ page }) => {
    await page.goto('/cleaner/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /cleaner portal/i })).toBeVisible()
    await expect(page.getByText(/sign in to view your assigned bookings/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('login HTML has current-password autocomplete', async ({ request }) => {
    const res = await request.get('/cleaner/login')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toContain('current-password')
  })

  test('invalid credentials shows error message', async ({ page }) => {
    await page.goto('/cleaner/login', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/email/i).fill('fakecleaner@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 })
  })

  test('correct credentials redirect to /cleaner/bookings', async ({ page }) => {
    await page.goto('/cleaner/login', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/email/i).fill('cleaner@sparkleclean.com')
    await page.getByLabel(/password/i).fill('Cleaner123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/cleaner\/bookings/, { timeout: 15000 })
  })
})

// ─── 3. Cleaner bookings portal ───────────────────────────────────────────────

test.describe('📋 Cleaner — My Bookings', () => {
  test.use({ storageState: '.auth/cleaner.json' })

  test('bookings page renders without redirecting to login', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/\/cleaner\/login/)
    await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible()
  })

  test('shows description text about assigned bookings', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/bookings assigned to you/i)).toBeVisible()
  })

  test('Upcoming section heading is present', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /upcoming/i })).toBeVisible()
  })

  test('nav shows My Bookings and Availability links', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('link', { name: /my bookings/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /availability/i })).toBeVisible()
  })

  test('cleaner identity shown in nav', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/cleaner@sparkleclean\.com|test cleaner/i)).toBeVisible()
  })

  test('sign out button visible', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('booking list or empty state renders', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    const hasBooking = await page.getByText('SC-E2ETEST1').count()
    const hasEmpty   = await page.getByText(/no upcoming bookings assigned/i).count()
    expect(hasBooking + hasEmpty).toBeGreaterThan(0)
  })
})

// ─── 4. Cleaner availability ──────────────────────────────────────────────────

test.describe('🗓️ Cleaner — Availability', () => {
  test.use({ storageState: '.auth/cleaner.json' })

  test('availability page renders heading', async ({ page }) => {
    await page.goto('/cleaner/availability', { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/\/cleaner\/login/)
    await expect(page.getByRole('heading', { name: /my availability/i })).toBeVisible()
  })

  test('shows all 7 days of the week', async ({ page }) => {
    await page.goto('/cleaner/availability', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/monday/i)).toBeVisible()
    await expect(page.getByText(/tuesday/i)).toBeVisible()
    await expect(page.getByText(/wednesday/i)).toBeVisible()
    await expect(page.getByText(/thursday/i)).toBeVisible()
    await expect(page.getByText(/friday/i)).toBeVisible()
    await expect(page.getByText(/saturday/i)).toBeVisible()
    await expect(page.getByText(/sunday/i)).toBeVisible()
  })

  test('Save Availability button present', async ({ page }) => {
    await page.goto('/cleaner/availability', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /save availability/i })).toBeVisible()
  })

  test('navigating to Availability from nav works', async ({ page }) => {
    await page.goto('/cleaner/bookings', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: /availability/i }).click()
    await expect(page).toHaveURL(/\/cleaner\/availability/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /my availability/i })).toBeVisible()
  })
})

// ─── 5. Cleaner API security ──────────────────────────────────────────────────
// Must clear project-level storageState so requests are unauthenticated.

test.describe('🛡️ Cleaner — API Security', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('GET /api/cleaner/availability returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/cleaner/availability')
    expect([401, 403]).toContain(res.status())
  })

  test('PUT /api/cleaner/availability returns 401 without auth', async ({ request }) => {
    const res = await request.put('/api/cleaner/availability', {
      data: { availability: [] },
    })
    expect([401, 403]).toContain(res.status())
  })
})
