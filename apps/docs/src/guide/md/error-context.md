# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> SaaS Telemetry Dashboard E2E Tests >> should render the dashboard header correctly
- Location: e2e/dashboard.spec.ts:12:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost/
Call log:
  - navigating to "http://localhost/", waiting until "load"

```

# Test source

```ts
  1  | // apps/web/e2e/dashboard.spec.ts
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('SaaS Telemetry Dashboard E2E Tests', () => {
  5  |   
  6  |   test.beforeEach(async ({ page }) => {
  7  |     // Nginx root adresine git
> 8  |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost/
  9  |   });
  10 | 
  11 | 
  12 | test('should render the dashboard header correctly', async ({ page }) => {
  13 |   // .shadow() fonksiyonunu silip doğrudan locator üzerinden metni kontrol ediyoruz
  14 |   const header = page.locator('h1');
  15 |   await expect(header).toContainText('SaaS Core Telemetry Panel');
  16 | });
  17 | 
  18 | 
  19 |   test('should load the premium canvas sparkline widgets', async ({ page }) => {
  20 |     // CPU ve RAM canvas elementlerinin DOM üzerinde var olduğunu doğrula
  21 |     const cpuCanvas = page.locator('#canvas-cpu-widget');
  22 |     const ramCanvas = page.locator('#canvas-ram-widget');
  23 |     
  24 |     await expect(cpuCanvas).toBeVisible();
  25 |     await expect(ramCanvas).toBeVisible();
  26 |   });
  27 | 
  28 |   test('should streaming system logs inside hacker terminal console', async ({ page }) => {
  29 |     // Canlı log akış konsolunun başlığını kontrol et
  30 |     await expect(page.locator('text=Live Stream Security & Event Logs')).toBeVisible();
  31 | 
  32 |     // En az bir log satırının düştüğünü veya "Streaming" badge'inin orada olduğunu doğrula
  33 |     const streamingBadge = page.locator('text=Streaming');
  34 |     await expect(streamingBadge).toBeVisible();
  35 |   });
  36 |   
  37 |   
  38 |   // apps/web/e2e/dashboard.spec.ts dosyasına eklenebilir
  39 | 
  40 | test('should trigger rate limiting (429) under heavy load', async ({ request }) => {
  41 |   // Saniyede 5r/s limitimiz var, arka arkaya 15 istek göndererek limiti patlatıyoruz
  42 |   let hitLimit = false;
  43 | 
  44 |   for (let i = 0; i < 15; i++) {
  45 |     const response = await request.get('/api/telemetry/snapshot');
  46 |     if (response.status() === 429) {
  47 |       hitLimit = true;
  48 |       break;
  49 |     }
  50 |   }
  51 | 
  52 |   // Nginx koruma kalkanının başarıyla devreye girdiğini doğrula!
  53 |   expect(hitLimit).toBe(true);
  54 | });
  55 | 
  56 |   
  57 | });
  58 | 
  59 | 
```