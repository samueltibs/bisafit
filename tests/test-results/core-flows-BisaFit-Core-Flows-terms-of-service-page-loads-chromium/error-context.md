# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-flows.spec.ts >> BisaFit Core Flows >> terms of service page loads
- Location: e2e/core-flows.spec.ts:112:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Terms of Service').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Terms of Service').first()

```

# Test source

```ts
  18  |     // Check for hero section
  19  |     await expect(page.locator('text=Transform Your').first()).toBeVisible();
  20  |     await expect(page.locator('text=Body & Mind').first()).toBeVisible();
  21  |     
  22  |     // Check for Get Started button
  23  |     await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
  24  |     
  25  |     // Check for Sign In button
  26  |     await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
  27  |     
  28  |     // Check for navigation items
  29  |     await expect(page.locator('text=Features').first()).toBeVisible();
  30  |     await expect(page.locator('text=Pricing').first()).toBeVisible();
  31  |     await expect(page.locator('text=Reviews').first()).toBeVisible();
  32  |     await expect(page.locator('text=FAQ').first()).toBeVisible();
  33  |     
  34  |     await page.screenshot({ path: 'core-landing.jpeg', quality: 20 });
  35  |   });
  36  | 
  37  |   test('landing page features section is visible', async ({ page }) => {
  38  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  39  |     await page.waitForSelector('#root', { state: 'attached' });
  40  |     await page.waitForTimeout(3000);
  41  |     
  42  |     // Scroll down to features
  43  |     await page.evaluate(() => window.scrollBy(0, 800));
  44  |     await page.waitForTimeout(500);
  45  |     
  46  |     // Check for feature cards
  47  |     await expect(page.locator('text=AI-Powered Workouts').first()).toBeVisible();
  48  |     await expect(page.locator('text=Smart Nutrition').first()).toBeVisible();
  49  |     await expect(page.locator('text=Progress Analytics').first()).toBeVisible();
  50  |     
  51  |     await page.screenshot({ path: 'core-features.jpeg', quality: 20 });
  52  |   });
  53  | 
  54  |   test('landing page pricing section shows correct prices', async ({ page }) => {
  55  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  56  |     await page.waitForSelector('#root', { state: 'attached' });
  57  |     await page.waitForTimeout(3000);
  58  |     
  59  |     // Scroll to pricing
  60  |     await page.evaluate(() => window.scrollBy(0, 2000));
  61  |     await page.waitForTimeout(500);
  62  |     
  63  |     // Check for pricing
  64  |     await expect(page.locator('text=Monthly').first()).toBeVisible();
  65  |     await expect(page.locator('text=Annual').first()).toBeVisible();
  66  |     await expect(page.locator('text=$14.99').first()).toBeVisible();
  67  |     await expect(page.locator('text=$11.24').first()).toBeVisible();
  68  |     
  69  |     await page.screenshot({ path: 'core-pricing.jpeg', quality: 20 });
  70  |   });
  71  | 
  72  |   test('landing page footer shows Bisa Group LLC', async ({ page }) => {
  73  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  74  |     await page.waitForSelector('#root', { state: 'attached' });
  75  |     await page.waitForTimeout(3000);
  76  |     
  77  |     // Scroll to bottom
  78  |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  79  |     await page.waitForTimeout(500);
  80  |     
  81  |     // Check for footer content
  82  |     await expect(page.locator('text=Bisa Group LLC').first()).toBeVisible();
  83  |     await expect(page.locator('text=Terms of Service').first()).toBeVisible();
  84  |     await expect(page.locator('text=Privacy Policy').first()).toBeVisible();
  85  |     
  86  |     await page.screenshot({ path: 'core-footer.jpeg', quality: 20 });
  87  |   });
  88  | 
  89  |   test('auth page loads with sign in form', async ({ page }) => {
  90  |     await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  91  |     await page.waitForSelector('#root', { state: 'attached' });
  92  |     await page.waitForTimeout(3000);
  93  |     
  94  |     // Check for BisaFit branding
  95  |     await expect(page.locator('text=BisaFit').first()).toBeVisible();
  96  |     
  97  |     // Check for sign in form
  98  |     await expect(page.locator('text=Sign In').first()).toBeVisible();
  99  |     await expect(page.locator('text=Sign Up').first()).toBeVisible();
  100 |     
  101 |     // Check for email input
  102 |     const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
  103 |     await expect(emailInput).toBeVisible();
  104 |     
  105 |     // Check for password input
  106 |     const passwordInput = page.locator('input[type="password"]').first();
  107 |     await expect(passwordInput).toBeVisible();
  108 |     
  109 |     await page.screenshot({ path: 'core-auth.jpeg', quality: 20 });
  110 |   });
  111 | 
  112 |   test('terms of service page loads', async ({ page }) => {
  113 |     await page.goto('/terms', { waitUntil: 'domcontentloaded' });
  114 |     await page.waitForSelector('#root', { state: 'attached' });
  115 |     await page.waitForTimeout(3000);
  116 |     
  117 |     // Check for terms content
> 118 |     await expect(page.locator('text=Terms of Service').first()).toBeVisible();
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  119 |     
  120 |     await page.screenshot({ path: 'core-terms.jpeg', quality: 20 });
  121 |   });
  122 | 
  123 |   test('Get Started button navigates to auth', async ({ page }) => {
  124 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  125 |     await page.waitForSelector('#root', { state: 'attached' });
  126 |     await page.waitForTimeout(3000);
  127 |     
  128 |     // Click Get Started
  129 |     await page.getByRole('button', { name: /Get Started/i }).first().click();
  130 |     
  131 |     // Wait for navigation
  132 |     await page.waitForURL('**/auth', { timeout: 10000 });
  133 |     
  134 |     // Verify we're on auth page
  135 |     await expect(page).toHaveURL(/\/auth/);
  136 |   });
  137 | });
  138 | 
```