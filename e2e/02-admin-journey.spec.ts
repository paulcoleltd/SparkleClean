/**
 * TEST SUITE 2 — Admin Journey
 * ==============================
 * Full admin experience: auth, dashboard, bookings, cleaners,
 * promo codes, service areas, calendar, referrals, messages.
 */

import { test, expect } from '@playwright/test'

test.setTimeout(30_000)

// ─── 1. Auth protection ───────────────────────────────────────────────────────
// The admin-journey project sets storageState at project level, so we must
// clear it here to test unauthenticated behaviour.

test.describe('🔒 Admin — Auth Protection', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated /admin redirects to admin login', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 })
  })

  test('unauthenticated /admin/bookings redirects to admin login', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 })
  })

  test('unauthenticated /admin/cleaners redirects to admin login', async ({ page }) => {
    await page.goto('/admin/cleaners', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 })
  })

  test('admin login page HTML contains sign in content', async ({ request }) => {
    const res = await request.get('/admin/login')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toContain('admin@sparkleclean.com')
    expect(html).toContain('Sign in')
  })

  test('shows error for wrong credentials via query param', async ({ request }) => {
    const res = await request.get('/admin/login?error=CredentialsSignin')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toContain('Invalid email or password')
  })

  test('PATCH /api/bookings/:id returns 401 without session', async ({ request }) => {
    const res = await request.patch('/api/bookings/00000000-0000-0000-0000-000000000000', {
      data: { status: 'CONFIRMED' },
    })
    expect(res.status()).toBe(401)
  })
})

// ─── 2. Admin login flow ──────────────────────────────────────────────────────

test.describe('🔑 Admin — Login Flow', () => {
  test('login page shows SparkleClean Admin heading', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /sparkleclean admin/i })).toBeVisible()
  })

  test('invalid credentials shows error message', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/email/i).fill('wrong@sparkleclean.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 })
  })

  test('correct credentials redirect to /admin/bookings', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/email/i).fill('admin@sparkleclean.com')
    await page.getByLabel(/password/i).fill('MiahAdekoya123!!!!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/bookings/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /bookings/i })).toBeVisible()
  })
})

// ─── 3. Admin dashboard ───────────────────────────────────────────────────────

test.describe('📊 Admin — Dashboard', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('renders stat cards without redirecting to login', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/\/admin\/login/)
    await expect(page.getByText(/bookings this month/i)).toBeVisible()
    await expect(page.getByText(/revenue this month/i)).toBeVisible()
    await expect(page.getByText(/awaiting confirmation/i)).toBeVisible()
  })

  test('all nav section links present', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    // Use .first() in case a link appears in both nav and page content
    await expect(page.getByRole('link', { name: 'Bookings' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendar' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cleaners' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Promos' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Areas' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Referrals' }).first()).toBeVisible()
  })

  test('sign out button visible', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })
})

// ─── 4. Admin bookings ────────────────────────────────────────────────────────

test.describe('📋 Admin — Bookings', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('bookings page renders table or empty state', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/bookings/i)
    const hasTable = await page.locator('table').count()
    const hasEmpty = await page.getByText(/no bookings/i).count()
    expect(hasTable + hasEmpty).toBeGreaterThan(0)
  })

  test('search input accepts text', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    const search = page.getByPlaceholder(/search/i)
    await expect(search).toBeVisible()
    await search.fill('paul')
    await expect(search).toHaveValue('paul')
  })

  test('status filter dropdown present', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('combobox').first()).toBeVisible()
  })

  test('Export CSV link present', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('link', { name: /export csv/i })).toBeVisible()
  })

  test('seeded booking SC-E2ETEST1 appears', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('SC-E2ETEST1')).toBeVisible({ timeout: 15000 })
  })

  test('View link on SC-E2ETEST1 navigates to detail', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('SC-E2ETEST1')).toBeVisible({ timeout: 15000 })
    // Click the View → link in the same row
    const row = page.locator('tr', { hasText: 'SC-E2ETEST1' })
    await row.getByRole('link', { name: /view/i }).click()
    await expect(page).toHaveURL(/\/admin\/bookings\//, { timeout: 15000 })
  })

  test('booking detail shows E2E Test Customer', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('SC-E2ETEST1')).toBeVisible({ timeout: 15000 })
    const row = page.locator('tr', { hasText: 'SC-E2ETEST1' })
    await row.getByRole('link', { name: /view/i }).click()
    await expect(page).toHaveURL(/\/admin\/bookings\//, { timeout: 15000 })
    await expect(page.getByText(/E2E Test Customer/i)).toBeVisible({ timeout: 10000 })
  })

  test('status action buttons present on detail page', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('SC-E2ETEST1')).toBeVisible({ timeout: 15000 })
    const row = page.locator('tr', { hasText: 'SC-E2ETEST1' })
    await row.getByRole('link', { name: /view/i }).click()
    await expect(page).toHaveURL(/\/admin\/bookings\//, { timeout: 15000 })
    await expect(page.getByRole('button', { name: /confirm|complete|cancel/i }).first()).toBeVisible({ timeout: 10000 })
  })
})

// ─── 5. Admin cleaners ────────────────────────────────────────────────────────

test.describe('🧹 Admin — Cleaners', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('cleaners list page renders heading and add button', async ({ page }) => {
    await page.goto('/admin/cleaners', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /cleaners/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /add cleaner/i })).toBeVisible()
  })

  test('add cleaner form has name, email and password fields', async ({ page }) => {
    await page.goto('/admin/cleaners/new', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('empty submission stays on the form page', async ({ page }) => {
    await page.goto('/admin/cleaners/new', { waitUntil: 'domcontentloaded' })
    // Button text is "Create Cleaner" in the form
    await page.getByRole('button', { name: /create cleaner/i }).click()
    await expect(page).toHaveURL(/\/admin\/cleaners\/new/, { timeout: 10000 })
  })
})

// ─── 6. Admin promo codes ─────────────────────────────────────────────────────

test.describe('🏷️ Admin — Promo Codes', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('promo codes page renders heading and create form', async ({ page }) => {
    await page.goto('/admin/promos', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /promo codes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /create code/i })).toBeVisible()
  })

  test('code input placeholder visible', async ({ page }) => {
    await page.goto('/admin/promos', { waitUntil: 'domcontentloaded' })
    await expect(page.getByPlaceholder(/WELCOME20/i)).toBeVisible()
  })
})

// ─── 7. Admin service areas ───────────────────────────────────────────────────

test.describe('📍 Admin — Service Areas', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('service areas page heading renders', async ({ page }) => {
    await page.goto('/admin/service-areas', { waitUntil: 'domcontentloaded' })
    // Give extra time for cold-start page loads
    await expect(page.getByRole('heading', { name: /service areas/i })).toBeVisible({ timeout: 15000 })
  })

  test('add area button present', async ({ page }) => {
    await page.goto('/admin/service-areas', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /add area/i })).toBeVisible()
  })

  test('area name input present', async ({ page }) => {
    await page.goto('/admin/service-areas', { waitUntil: 'domcontentloaded' })
    await expect(page.getByPlaceholder(/central london/i)).toBeVisible()
  })
})

// ─── 8. Admin calendar ────────────────────────────────────────────────────────

test.describe('📅 Admin — Calendar', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('calendar renders with Today button', async ({ page }) => {
    await page.goto('/admin/calendar', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /booking calendar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /today/i })).toBeVisible()
  })

  test('legend shows Pending and Confirmed labels', async ({ page }) => {
    await page.goto('/admin/calendar', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/pending/i)).toBeVisible()
    await expect(page.getByText(/confirmed/i)).toBeVisible()
  })
})

// ─── 9. Admin messages ────────────────────────────────────────────────────────

test.describe('📨 Admin — Messages', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('messages inbox renders', async ({ page }) => {
    await page.goto('/admin/messages', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /messages|inbox/i })).toBeVisible()
  })
})

// ─── 10. Admin referrals ──────────────────────────────────────────────────────

test.describe('🔗 Admin — Referrals', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('referrals page renders', async ({ page }) => {
    await page.goto('/admin/referrals', { waitUntil: 'domcontentloaded' })
    // Heading is "Referral Programme" — match partial word
    await expect(page.getByRole('heading', { name: /referral/i })).toBeVisible({ timeout: 10000 })
  })
})

// ─── 11. Admin reviews ────────────────────────────────────────────────────────

test.describe('⭐ Admin — Reviews', () => {
  test.use({ storageState: '.auth/admin.json' })

  test('reviews page renders', async ({ page }) => {
    await page.goto('/admin/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /reviews/i })).toBeVisible()
  })
})

// ─── 12. API security ─────────────────────────────────────────────────────────
// Must clear project-level storageState so requests are unauthenticated.

test.describe('🛡️ Admin — API Security', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('PATCH /api/bookings returns 401 without auth', async ({ request }) => {
    const res = await request.patch('/api/bookings/00000000-0000-0000-0000-000000000000', {
      data: { status: 'CONFIRMED' },
    })
    expect(res.status()).toBe(401)
  })
})
