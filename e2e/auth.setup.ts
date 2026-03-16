/**
 * Auth setup — runs as a Playwright "setup" project before authenticated tests.
 *
 * Logs in as admin and saves the session cookie to .auth/admin.json so that
 * authenticated test suites (admin-authenticated.spec.ts, calendar.spec.ts)
 * can reuse the session without logging in on every test.
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')

setup('authenticate as admin', async ({ page }) => {
  const adminEmail    = process.env.ADMIN_SEED_EMAIL    ?? 'admin@sparkleclean.com'
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'TestAdmin123!'

  await page.goto('/admin/login')

  await page.getByLabel('Email').fill(adminEmail)
  await page.getByLabel('Password').fill(adminPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // NextAuth redirects to /admin/bookings on success
  await expect(page).toHaveURL(/\/admin/)
  await expect(page.getByRole('link', { name: /bookings/i })).toBeVisible()

  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})
