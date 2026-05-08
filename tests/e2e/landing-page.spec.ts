import { test, expect } from '@playwright/test';

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for React to hydrate
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);
  });

  test('landing page loads with hero section', async ({ page }) => {
    // Check for BisaFit branding
    await expect(page.locator('text=BisaFit').first()).toBeVisible();
    
    // Check for hero section content
    await expect(page.locator('text=Transform Your').first()).toBeVisible();
    await expect(page.locator('text=Body & Mind').first()).toBeVisible();
    
    // Check for Get Started button
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
    
    // Check for Sign In button
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
    
    await page.screenshot({ path: 'landing-hero.jpeg', quality: 20 });
  });

  test('landing page has navigation links', async ({ page }) => {
    // Check for navigation links
    await expect(page.locator('a[href="#features"]').first()).toBeVisible();
    await expect(page.locator('a[href="#pricing"]').first()).toBeVisible();
    await expect(page.locator('a[href="#testimonials"]').first()).toBeVisible();
    await expect(page.locator('a[href="#faq"]').first()).toBeVisible();
  });

  test('landing page has features section', async ({ page }) => {
    // Scroll to features section
    await page.locator('a[href="#features"]').first().click();
    await page.waitForTimeout(500);
    
    // Check for features
    await expect(page.locator('text=AI-Powered Workouts').first()).toBeVisible();
    await expect(page.locator('text=Smart Nutrition').first()).toBeVisible();
    await expect(page.locator('text=Progress Analytics').first()).toBeVisible();
    await expect(page.locator('text=Smart Scheduling').first()).toBeVisible();
    await expect(page.locator('text=Health Sync').first()).toBeVisible();
    await expect(page.locator('text=Goal Tracking').first()).toBeVisible();
    
    await page.screenshot({ path: 'landing-features.jpeg', quality: 20 });
  });

  test('landing page has pricing section with correct prices', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('a[href="#pricing"]').first().click();
    await page.waitForTimeout(500);
    
    // Check for pricing plans
    await expect(page.locator('text=Monthly').first()).toBeVisible();
    await expect(page.locator('text=Annual').first()).toBeVisible();
    await expect(page.locator('text=$14.99').first()).toBeVisible();
    await expect(page.locator('text=$11.24').first()).toBeVisible();
    await expect(page.locator('text=BEST VALUE').first()).toBeVisible();
    
    await page.screenshot({ path: 'landing-pricing.jpeg', quality: 20 });
  });

  test('landing page has testimonials section', async ({ page }) => {
    // Scroll to testimonials section
    await page.locator('a[href="#testimonials"]').first().click();
    await page.waitForTimeout(500);
    
    // Check for testimonials
    await expect(page.locator('text=Sarah Mitchell').first()).toBeVisible();
    await expect(page.locator('text=James Rodriguez').first()).toBeVisible();
    await expect(page.locator('text=Emily Chen').first()).toBeVisible();
    
    await page.screenshot({ path: 'landing-testimonials.jpeg', quality: 20 });
  });

  test('landing page has FAQ section', async ({ page }) => {
    // Scroll to FAQ section
    await page.locator('a[href="#faq"]').first().click();
    await page.waitForTimeout(500);
    
    // Check for FAQ questions
    await expect(page.locator('text=How does the AI workout generation work?').first()).toBeVisible();
    await expect(page.locator('text=Can I use BisaFit without any equipment?').first()).toBeVisible();
    
    // Test FAQ accordion
    await page.locator('text=How does the AI workout generation work?').first().click();
    await expect(page.locator('text=Our AI analyzes your fitness goals').first()).toBeVisible();
    
    await page.screenshot({ path: 'landing-faq.jpeg', quality: 20 });
  });

  test('landing page has footer with Bisa Group LLC', async ({ page }) => {
    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Check for company info
    await expect(page.locator('text=Bisa Group LLC').first()).toBeVisible();
    await expect(page.locator('text=Terms of Service').first()).toBeVisible();
    await expect(page.locator('text=Privacy Policy').first()).toBeVisible();
    await expect(page.locator('text=Contact Us').first()).toBeVisible();
    
    await page.screenshot({ path: 'landing-footer.jpeg', quality: 20 });
  });

  test('Get Started button navigates to auth page', async ({ page }) => {
    await page.getByRole('button', { name: /Get Started/i }).first().click();
    await page.waitForURL('**/auth');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('Sign In button navigates to auth page', async ({ page }) => {
    await page.getByRole('button', { name: /Sign In/i }).first().click();
    await page.waitForURL('**/auth');
    await expect(page).toHaveURL(/\/auth/);
  });
});
