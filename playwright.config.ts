import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// ─── Load env files into process.env ──────────────────────────────────────────
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key   = trimmed.slice(0, eqIdx).trim()
    const raw   = trimmed.slice(eqIdx + 1).trim()
    const value = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
    if (!(key in process.env)) process.env[key] = value
  }
}

const root = path.resolve(__dirname)
loadEnvFile(path.join(root, '.env.test'))
loadEnvFile(path.join(root, '.env.test.local'))
loadEnvFile(path.join(root, '.env.local'))   // fallback: Supabase credentials

const ADMIN_AUTH_FILE    = path.join(root, '.auth/admin.json')
const CUSTOMER_AUTH_FILE = path.join(root, '.auth/customer.json')
const CLEANER_AUTH_FILE  = path.join(root, '.auth/cleaner.json')

export default defineConfig({
  testDir:       './e2e',
  fullyParallel: false,
  forbidOnly:    !!process.env.CI,
  retries:       1,
  workers:       1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile:   'playwright-report/results.json'  }],
    ['list'],
  ],

  globalSetup:    './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL:    process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace:      'retain-on-failure',
    screenshot: 'on',              // capture screenshot for every test
    video:      'retain-on-failure',
  },

  projects: [
    // ── 0. Auth setup — saves 3 session files ────────────────────────────────
    {
      name:      'setup',
      testMatch: /auth\.setup\.ts/,
      use:       { ...devices['Desktop Chrome'] },
    },

    // ── 1. Customer journey (unauthenticated + public APIs) ──────────────────
    {
      name:         'customer-journey',
      testMatch:    /01-customer-journey\.spec\.ts/,
      use:          { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // ── 2. Admin journey (authenticated as admin) ────────────────────────────
    {
      name:         'admin-journey',
      testMatch:    /02-admin-journey\.spec\.ts/,
      use:          { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['setup'],
    },

    // ── 3. Cleaner journey (authenticated as cleaner) ────────────────────────
    {
      name:         'cleaner-journey',
      testMatch:    /03-cleaner-journey\.spec\.ts/,
      use:          { ...devices['Desktop Chrome'], storageState: CLEANER_AUTH_FILE },
      dependencies: ['setup'],
    },

    // ── Legacy specs (kept for backward compatibility) ───────────────────────
    {
      name:       'chromium',
      use:        { ...devices['Desktop Chrome'] },
      testIgnore: [
        /admin-authenticated/, /calendar\.spec/,
        /auth\.setup/,
        /01-customer-journey/, /02-admin-journey/, /03-cleaner-journey/,
      ],
    },
    {
      name:         'admin-authenticated',
      use:          { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
      testMatch:    [/admin-authenticated\.spec/, /calendar\.spec/],
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command:             'npm run dev',
    url:                 'http://localhost:3000',
    reuseExistingServer: true,
    timeout:             120_000,
  },
})
