import { test, expect } from '@playwright/test';

test.describe('Authentication Page Tests', () => {
  test('auth page loads with sign in form', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);
    
    // Check for BisaFit branding
    await expect(page.locator('text=BisaFit').first()).toBeVisible();
    await expect(page.locator('text=Your fitness journey starts here').first()).toBeVisible();
    
    // Check for sign in/sign up tabs
    await expect(page.locator('text=Sign In').first()).toBeVisible();
    await expect(page.locator('text=Sign Up').first()).toBeVisible();
    
    // Check for email and password fields
    await expect(page.locator('input[type="email"], input[placeholder*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    
    // Check for Sign In button
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
    
    // Check for forgot password link
    await expect(page.locator('text=Forgot your password?').first()).toBeVisible();
    
    // Check for terms and privacy links
    await expect(page.locator('text=Terms of Service').first()).toBeVisible();
    await expect(page.locator('text=Privacy Policy').first()).toBeVisible();
    
    await page.screenshot({ path: 'auth-signin.jpeg', quality: 20 });
  });

  test('auth page can switch to sign up tab', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    
    // Click on Sign Up tab
    await page.locator('text=Sign Up').first().click();
    await page.waitForTimeout(500);
    
    // Check for sign up form elements
    await expect(page.locator('input[type="email"], input[placeholder*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    
    await page.screenshot({ path: 'auth-signup.jpeg', quality: 20 });
  });

  test('login page accessible via /login route', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);
    
    // Should show auth page
    await expect(page.locator('text=BisaFit').first()).toBeVisible();
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });
});

test.describe('Terms of Service Page Tests', () => {
  test('terms page loads correctly', async ({ page }) => {
    await page.goto('/terms', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);
    
    // Check for terms content
    await expect(page.locator('text=Terms of Service').first()).toBeVisible();
    await expect(page.locator('text=BisaFit').first()).toBeVisible();
    
    // Check for back button
    await expect(page.locator('text=Back').first()).toBeVisible();
    
    await page.screenshot({ path: 'terms-page.jpeg', quality: 20 });
  });
});
