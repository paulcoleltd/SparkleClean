import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('homepage loads and shows hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/sparkleclean/i)
    await expect(page.getByRole('heading', { name: /your home deserves to sparkle/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /book a cleaning today/i })).toBeVisible()
  })

  test('nav links navigate to correct pages', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Services' }).first().click()
    await expect(page).toHaveURL('/services')
    await expect(page.getByRole('heading', { name: /our services/i })).toBeVisible()

    await page.getByRole('link', { name: 'About' }).first().click()
    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: /about sparkleclean/i })).toBeVisible()

    await page.getByRole('link', { name: 'Contact' }).first().click()
    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { name: /contact us/i })).toBeVisible()
  })

  test('"Book Now" nav link goes to booking page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Book Now' }).first().click()
    await expect(page).toHaveURL('/booking')
  })
})

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('hamburger opens and closes the mobile menu', async ({ page }) => {
    await page.goto('/')

    // Desktop nav links hidden on mobile
    const desktopLinks = page.locator('nav ul.hidden')
    await expect(desktopLinks).toBeHidden()

    // Open menu — scope to nav to avoid strict mode violation with footer link
    await page.getByRole('button', { name: /open menu/i }).click()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Services' })).toBeVisible()

    // Close with same button
    await page.getByRole('button', { name: /close menu/i }).click()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Services' })).toBeHidden()
  })

  test('clicking a nav link closes the mobile menu', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /open menu/i }).click()
    await page.getByRole('navigation').getByRole('link', { name: 'Services' }).click()
    await expect(page).toHaveURL('/services')
  })

  test('Escape key closes the mobile menu', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /open menu/i }).click()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Services' })).toBeVisible()
    await page.keyboard.press('Escape')
    // After escape the menu should not be expanded
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible()
  })
})
