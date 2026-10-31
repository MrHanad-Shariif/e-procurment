const { chromium } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const artifacts = path.resolve(__dirname, '../../.local/browser');
  fs.mkdirSync(artifacts, { recursive: true });
  try {
    const publicPage = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await publicPage.goto('http://127.0.0.1:5175/', { waitUntil: 'domcontentloaded' });
    await publicPage.getByText('TenderRank', { exact: true }).first().waitFor();
    await publicPage.screenshot({ path: path.join(artifacts, 'landing.png'), fullPage: true });
    await publicPage.close();

    const accounts = [
      { email: 'superadmin@tender.com', password: 'superadminpass', home: '/super-admin', routes: ['/purchase-requisitions', '/rfq', '/purchase-orders', '/goods-receipts', '/invoices', '/budgets', '/contracts', '/suppliers', '/users', '/roles', '/super-admin/tenders', '/super-admin/queue', '/super-admin/messages', '/super-admin/inquiries'] },
      { email: 'admin@tender.com', password: 'adminpass', home: '/dashboard', routes: ['/tenders', '/create-tender', '/purchase-orders'] },
      { email: 'supplier@tender.com', password: 'supplierpass', home: '/supplier', routes: ['/supplier/tenders', '/profile'] },
    ];
    for (const account of accounts) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.url().includes('/api/') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto('http://127.0.0.1:5175/login', { waitUntil: 'domcontentloaded' });
      await page.locator('#email').fill(account.email);
      await page.locator('#password').fill(account.password);
      const login = page.waitForResponse(response => response.url().includes('/v1/auth/login'));
      await page.getByRole('button', { name: 'Login', exact: true }).click();
      const loginResponse = await login;
      if (loginResponse.status() !== 200) {
        const failure = await loginResponse.json().catch(() => ({}));
        throw new Error(`Login failed for ${account.email}: ${loginResponse.status()} ${failure.error || ''}`);
      }
      await page.waitForURL(`**${account.home}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.screenshot({ path: path.join(artifacts, `${account.email.split('@')[0]}.png`), fullPage: true });
      for (const route of account.routes) {
        await page.goto(`http://127.0.0.1:5175${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        if ((await page.locator('body').innerText()).includes('Page not found')) throw new Error(`Missing route ${route}`);
        console.log(`PASS ${account.email}: ${route}`);
      }
      if (account.home === '/super-admin') {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('http://127.0.0.1:5175/purchase-orders', { waitUntil: 'domcontentloaded' });
        await page.screenshot({ path: path.join(artifacts, 'mobile-orders.png'), fullPage: true });
      }
      if (errors.length) throw new Error(`${account.email}: ${errors.join('; ')}`);
      await context.close();
    }
    console.log('Shared browser checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
