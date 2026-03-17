/**
 * Auth setup — runs as a Playwright "setup" project before authenticated tests.
 *
 * Saves 3 session cookies:
 *   .auth/admin.json   — admin session
 *   .auth/customer.json — customer session
 *   .auth/cleaner.json  — cleaner session
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const AUTH_DIR         = path.join(__dirname, '../.auth')
const ADMIN_AUTH_FILE  = path.join(AUTH_DIR, 'admin.json')
const CUSTOMER_AUTH_FILE = path.join(AUTH_DIR, 'customer.json')
const CLEANER_AUTH_FILE  = path.join(AUTH_DIR, 'cleaner.json')

// Ensure .auth directory exists
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true })

// ─── Admin session ────────────────────────────────────────────────────────────

setup('authenticate as admin', async ({ page }) => {
  const email    = process.env.ADMIN_SEED_EMAIL    ?? 'admin@sparkleclean.com'
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'MiahAdekoya123!!!!'

  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
  await expect(page.getByRole('link', { name: /bookings/i })).toBeVisible()

  await page.context().storageState({ path: ADMIN_AUTH_FILE })
  console.log('✓ Admin session saved')
})

// ─── Customer session ─────────────────────────────────────────────────────────

setup('authenticate as customer', async ({ page }) => {
  await page.goto('/account/login')
  await page.getByLabel(/email/i).fill('customer@example.com')
  await page.getByLabel(/password/i).fill('Customer123!')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/account/, { timeout: 10000 })

  await page.context().storageState({ path: CUSTOMER_AUTH_FILE })
  console.log('✓ Customer session saved')
})

// ─── Cleaner session ──────────────────────────────────────────────────────────

setup('authenticate as cleaner', async ({ page }) => {
  await page.goto('/cleaner/login')
  await page.getByLabel(/email/i).fill('cleaner@sparkleclean.com')
  await page.getByLabel(/password/i).fill('Cleaner123!')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/cleaner\/bookings/, { timeout: 10000 })

  await page.context().storageState({ path: CLEANER_AUTH_FILE })
  console.log('✓ Cleaner session saved')
})
