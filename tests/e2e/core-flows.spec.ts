import { test, expect } from '@playwright/test';

/**
 * Core Flow Tests for BisaFit
 * Tests the main public pages and navigation
 */
test.describe('BisaFit Core Flows', () => {
  
  test('landing page loads with all key sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    
    // Check for BisaFit branding
    const bisafitCount = await page.locator('text=BisaFit').count();
    expect(bisafitCount).toBeGreaterThan(0);
    
    // Check for hero section
    await expect(page.locator('text=Transform Your').first()).toBeVisible();
    await expect(page.locator('text=Body & Mind').first()).toBeVisible();
    
    // Check for Get Started button
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
    
    // Check for Sign In button
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
    
    // Check for navigation items
    await expect(page.locator('text=Features').first()).toBeVisible();
    await expect(page.locator('text=Pricing').first()).toBeVisible();
    await expect(page.locator('text=Reviews').first()).toBeVisible();
    await expect(page.locator('text=FAQ').first()).toBeVisible();
    
    await page.screenshot({ path: 'core-landing.jpeg', quality: 20 });
  });

  test('landing page features section is visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    
    // Scroll down to features
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);
    
    // Check for feature cards
    await expect(page.locator('text=AI-Powered Workouts').first()).toBeVisible();
    await expect(page.locator('text=Smart Nutrition').first()).toBeVisible();
    await expect(page.locator('text=Progress Analytics').first()).toBeVisible();
    
    await page.screenshot({ path: 'core-features.jpeg', quality: 20 });
  });

  test('landing page pricing section shows correct prices', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    
    // Scroll to pricing
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(500);
    
    // Check for pricing
    await expect(page.locator('text=Monthly').first()).toBeVisible();
    await expect(page.locator('text=Annual').first()).toBeVisible();
    await expect(page.locator('text=$14.99').first()).toBeVisible();
    await expect(page.locator('text=$11.24').first()).toBeVisible();
    
    await page.screenshot({ path: 'core-pricing.jpeg', quality: 20 });
  });

  test('landing page footer shows Bisa Group LLC', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Check for footer content
    await expect(page.locator('text=Bisa Group LLC').first()).toBeVisible();
    await expect(page.locator('text=Terms of Service').first()).toBeVisible();
    await expect(page.locator('text=Privacy Policy').first()).toBeVisible();
    
    await page.screenshot({ path: 'core-footer.jpeg', quality: 20 });
  });

  test('auth page loads with sign in form', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    
    // Check for BisaFit branding
    await expect(page.locator('text=BisaFit').first()).toBeVisible();
    
    // Check for sign in form
    await expect(page.locator('text=Sign In').first()).toBeVisible();
    await expect(page.locator('text=Sign Up').first()).toBeVisible();
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    
    await page.screenshot({ path: 'core-auth.jpeg', quality: 20 });
  });

  test('terms of service page loads', async ({ page }) => {
    await page.goto('/terms', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    
    // Check for terms content
    await expect(page.locator('text=Terms of Service').first()).toBeVisible();
    
    await page.screenshot({ path: 'core-terms.jpeg', quality: 20 });
  });

  test('Get Started button navigates to auth', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    
    // Click Get Started
    await page.getByRole('button', { name: /Get Started/i }).first().click();
    
    // Wait for navigation
    await page.waitForURL('**/auth', { timeout: 10000 });
    
    // Verify we're on auth page
    await expect(page).toHaveURL(/\/auth/);
  });
});
