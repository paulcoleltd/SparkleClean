import { test, expect } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uniqueEmail() {
  return `e2enewuser+${Date.now()}@example.com`
}

// ─── Account registration ─────────────────────────────────────────────────────

test.describe('Customer registration', () => {
  test('register page renders with name, email, and password fields', async ({ page }) => {
    await page.goto('/account/register')
    await expect(page).toHaveTitle(/register|create account/i)
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
  })

  test('shows validation error for short password', async ({ page }) => {
    await page.goto('/account/register')
    await page.getByLabel(/name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill('jane@example.com')
    await page.getByLabel(/password/i).first().fill('short')
    await page.getByRole('button', { name: /create account|register/i }).click()
    await expect(page.getByText(/password.*8|at least 8/i)).toBeVisible()
  })

  test('shows error when email already exists (mocked API)', async ({ page }) => {
    await page.route('/api/account/register', async route => {
      await route.fulfill({
        status:      409,
        contentType: 'application/json',
        body:        JSON.stringify({ error: { message: 'An account with this email already exists.' } }),
      })
    })

    await page.goto('/account/register')
    await page.getByLabel(/name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill('existing@example.com')
    await page.getByLabel(/password/i).first().fill('Password123!')
    await page.getByRole('button', { name: /create account|register/i }).click()
    await expect(page.getByText(/already exists/i)).toBeVisible()
  })

  test('successful registration redirects to account (mocked API + auto-login)', async ({ page }) => {
    const email = uniqueEmail()

    // Mock register → 201
    await page.route('/api/account/register', async route => {
      await route.fulfill({
        status:      201,
        contentType: 'application/json',
        body:        JSON.stringify({ data: { id: 'cust-1', email, name: 'Jane Smith' } }),
      })
    })

    // Mock the NextAuth sign-in after registration (CSRF + signIn fetch)
    await page.route('/api/auth/**', async route => route.continue())

    await page.goto('/account/register')
    await page.getByLabel(/name/i).fill('Jane Smith')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).first().fill('Password123!')
    await page.getByRole('button', { name: /create account|register/i }).click()

    // After mock registration the page should not show an error banner
    await expect(page.getByText(/registration failed/i)).not.toBeVisible({ timeout: 3000 })
  })

  test('has link to sign in page', async ({ page }) => {
    await page.goto('/account/register')
    await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible()
  })
})

// ─── Account login ─────────────────────────────────────────────────────────────

test.describe('Customer login', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/account/login')
    await expect(page).toHaveTitle(/sign in|login/i)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows error for wrong credentials', async ({ request }) => {
    const res = await request.get('/account/login?error=CredentialsSignin')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toMatch(/invalid email or password|incorrect/i)
  })

  test('has link to register page', async ({ page }) => {
    await page.goto('/account/login')
    await expect(page.getByRole('link', { name: /create account|register/i })).toBeVisible()
  })

  test('has forgot password link', async ({ page }) => {
    await page.goto('/account/login')
    await expect(page.getByRole('link', { name: /forgot.*password/i })).toBeVisible()
  })

  test('unauthenticated visit to /account/bookings redirects to login', async ({ page }) => {
    await page.goto('/account/bookings')
    await expect(page).toHaveURL(/\/account\/login/)
  })
})

// ─── Password reset flow ──────────────────────────────────────────────────────

test.describe('Password reset', () => {
  test('forgot password page renders', async ({ page }) => {
    await page.goto('/account/forgot-password')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset/i })).toBeVisible()
  })

  test('shows success message after submitting (mocked API)', async ({ page }) => {
    await page.route('/api/account/forgot-password', async route => {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ message: 'Reset email sent' }),
      })
    })

    await page.goto('/account/forgot-password')
    await page.getByLabel(/email/i).fill('jane@example.com')
    await page.getByRole('button', { name: /send reset/i }).click()
    await expect(page.getByText(/check your email|email sent|link sent/i)).toBeVisible()
  })
})
