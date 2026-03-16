/**
 * Admin authenticated E2E tests.
 * storageState is injected by playwright.config.ts via the 'admin-authenticated' project.
 * These tests run after auth.setup.ts has saved the admin session to .auth/admin.json.
 */

import { test, expect } from '@playwright/test'

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

test.describe('Admin dashboard', () => {
  test('renders stat cards and nav links', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveTitle(/admin/i)

    // Should NOT redirect to login when authenticated
    await expect(page).not.toHaveURL(/\/admin\/login/)

    // Stat cards
    await expect(page.getByText(/bookings this month/i)).toBeVisible()
    await expect(page.getByText(/revenue this month/i)).toBeVisible()
    await expect(page.getByText(/awaiting confirmation/i)).toBeVisible()

    // Nav links
    await expect(page.getByRole('link', { name: 'Bookings' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cleaners' })).toBeVisible()
  })
})

// ─── Admin Bookings list ───────────────────────────────────────────────────────

test.describe('Admin bookings list', () => {
  test('renders the bookings table', async ({ page }) => {
    await page.goto('/admin/bookings')
    await expect(page).toHaveTitle(/bookings.*admin|admin.*bookings/i)
    // Table or empty state — either is valid
    const hasTable    = await page.locator('table').count()
    const hasEmpty    = await page.getByText(/no bookings/i).count()
    expect(hasTable + hasEmpty).toBeGreaterThan(0)
  })

  test('search input is present', async ({ page }) => {
    await page.goto('/admin/bookings')
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('status filter dropdown is present', async ({ page }) => {
    await page.goto('/admin/bookings')
    await expect(page.getByRole('combobox').first()).toBeVisible()
  })

  test('Export CSV link is present', async ({ page }) => {
    await page.goto('/admin/bookings')
    await expect(page.getByRole('link', { name: /export csv/i })).toBeVisible()
  })

  test('shows seeded test booking SC-E2ETEST1', async ({ page }) => {
    await page.goto('/admin/bookings')
    // The booking seeded in global-setup.ts should appear
    const row = page.getByText('SC-E2ETEST1')
    await expect(row).toBeVisible()
  })

  test('clicking a booking row navigates to detail page', async ({ page }) => {
    await page.goto('/admin/bookings')
    const link = page.getByRole('link', { name: /SC-E2ETEST1/ })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/admin\/bookings\//)
  })
})

// ─── Admin Booking detail ─────────────────────────────────────────────────────

test.describe('Admin booking detail', () => {
  test('renders booking detail for seeded booking', async ({ page }) => {
    // Navigate via bookings list → detail link
    await page.goto('/admin/bookings')
    const link = page.getByRole('link', { name: /SC-E2ETEST1/ })
    await expect(link).toBeVisible()
    await link.click()

    // Detail page must show key fields
    await expect(page.getByText('SC-E2ETEST1')).toBeVisible()
    await expect(page.getByText(/E2E Test Customer/i)).toBeVisible()
    await expect(page.getByText(/residential/i)).toBeVisible()
  })

  test('status updater section is present', async ({ page }) => {
    await page.goto('/admin/bookings')
    const link = page.getByRole('link', { name: /SC-E2ETEST1/ })
    await link.click()
    // StatusUpdater renders status buttons
    await expect(page.getByRole('button', { name: /confirm|complete|cancel/i }).first()).toBeVisible()
  })
})

// ─── Admin Cleaners ───────────────────────────────────────────────────────────

test.describe('Admin cleaners', () => {
  test('cleaners page renders with add button', async ({ page }) => {
    await page.goto('/admin/cleaners')
    await expect(page.getByRole('heading', { name: /cleaners/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /add cleaner/i })).toBeVisible()
  })

  test('add cleaner form renders required fields', async ({ page }) => {
    await page.goto('/admin/cleaners/new')
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })
})

// ─── Admin Messages ───────────────────────────────────────────────────────────

test.describe('Admin messages', () => {
  test('messages inbox page renders', async ({ page }) => {
    await page.goto('/admin/messages')
    await expect(page.getByRole('heading', { name: /messages|inbox/i })).toBeVisible()
  })
})

// ─── Admin Reviews ────────────────────────────────────────────────────────────

test.describe('Admin reviews', () => {
  test('reviews moderation page renders', async ({ page }) => {
    await page.goto('/admin/reviews')
    await expect(page.getByRole('heading', { name: /reviews/i })).toBeVisible()
  })
})

// ─── Admin Referrals ─────────────────────────────────────────────────────────

test.describe('Admin referrals', () => {
  test('referrals page renders', async ({ page }) => {
    await page.goto('/admin/referrals')
    await expect(page.getByRole('heading', { name: /referrals/i })).toBeVisible()
  })
})

// ─── Sign out ─────────────────────────────────────────────────────────────────

test.describe('Admin sign out', () => {
  test('sign out button is visible in admin header', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })
})
