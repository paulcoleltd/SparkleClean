import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// ─── Load .env.test (then .env.test.local overrides) into process.env ─────────
// This makes env vars available to globalSetup, auth.setup.ts, and all specs.
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

const ADMIN_AUTH_FILE = path.join(root, '.auth/admin.json')

export default defineConfig({
  testDir:       './e2e',
  fullyParallel: true,
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 2 : 0,
  workers:       process.env.CI ? 1 : undefined,
  reporter:      'html',

  globalSetup:    './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL:    process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ── Auth setup must run before any authenticated project ─────────────────
    {
      name:      'setup',
      testMatch: /auth\.setup\.ts/,
      use:       { ...devices['Desktop Chrome'] },
    },

    // ── Unauthenticated tests ────────────────────────────────────────────────
    {
      name:       'chromium',
      use:        { ...devices['Desktop Chrome'] },
      testIgnore: [/admin-authenticated/, /calendar\.spec/],
    },
    {
      name:       'mobile',
      use:        { ...devices['iPhone 14'] },
      testIgnore: [/admin-authenticated/, /calendar\.spec/],
    },

    // ── Admin-authenticated tests (depend on setup project) ──────────────────
    {
      name:         'admin-authenticated',
      use:          { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
      testMatch:    [/admin-authenticated\.spec/, /calendar\.spec/],
      dependencies: ['setup'],
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command:             'pnpm dev',
        url:                 'http://localhost:3000',
        reuseExistingServer: true,
        timeout:             120_000,
      },
})
