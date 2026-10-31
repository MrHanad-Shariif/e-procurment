const { chromium, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const folder = path.resolve(__dirname, '../../.local/browser');
  fs.mkdirSync(folder, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5175/login', { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill('superadmin@tender.com');
    await page.locator('#password').fill('superadminpass');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL('**/super-admin', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
    await expect(navigation.locator('[data-nav-section]')).toHaveCount(4);
    await expect(navigation.locator('[data-nav-leaf]')).toHaveCount(0);

    // Exactly three levels; only the selected section and module stay open.
    await navigation.getByRole('button', { name: 'Procurement', exact: true }).click();
    await navigation.getByRole('button', { name: 'Purchase orders', exact: true }).click();
    await expect(navigation.locator('[data-nav-leaf="orders-list"]')).toBeVisible();
    await expect(navigation.locator('[data-nav-leaf="orders-new"]')).toBeVisible();
    await navigation.locator('[data-nav-leaf="orders-list"]').click();
    await page.waitForURL('**/purchase-orders', { waitUntil: 'domcontentloaded' });
    await expect(navigation.locator('[data-nav-leaf="orders-list"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('navigation', { name: 'Current location' })).toContainText('Procurement');
    await expect(page.getByRole('navigation', { name: 'Current location' })).toContainText('Purchase orders');

    await navigation.getByRole('button', { name: 'Finance', exact: true }).click();
    await expect(navigation.getByRole('button', { name: 'Procurement', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await navigation.getByRole('button', { name: 'Budgets', exact: true }).click();
    await navigation.locator('[data-nav-leaf="budgets-list"]').click();
    await page.waitForURL('**/budgets', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(navigation.getByRole('button', { name: 'Finance', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(navigation.getByRole('button', { name: 'Budgets', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await page.screenshot({ path: path.join(folder, 'sidebar-desktop.png'), fullPage: true });

    // A create route selects the more specific leaf; browser history restores parents.
    await page.goto('http://127.0.0.1:5175/purchase-orders/new', { waitUntil: 'domcontentloaded' });
    await expect(navigation.locator('[data-nav-leaf="orders-new"]')).toHaveAttribute('aria-current', 'page');
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(navigation.locator('[data-nav-leaf="budgets-list"]')).toHaveAttribute('aria-current', 'page');

    // Compact desktop rail expands into the selected branch.
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    await expect(page.locator('aside')).toHaveAttribute('data-state', 'collapsed');
    await navigation.getByRole('button', { name: 'Sourcing', exact: true }).click();
    await expect(page.locator('aside')).toHaveAttribute('data-state', 'expanded');
    await expect(navigation.getByRole('button', { name: 'Sourcing', exact: true })).toHaveAttribute('aria-expanded', 'true');

    // Keyboard disclosure and mobile drawer behavior.
    await navigation.getByRole('button', { name: 'Tenders', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(navigation.locator('[data-nav-leaf="tenders-list"]')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: path.join(folder, 'sidebar-mobile.png'), fullPage: true });
    await navigation.locator('[data-nav-leaf="tenders-list"]').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Navigation is localized, with logical indentation on the RTL side.
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('button', { name: 'المشتريات', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'المشتريات', exact: true }).click();
    await page.screenshot({ path: path.join(folder, 'sidebar-arabic.png'), fullPage: true });
    await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('button', { name: 'Achats', exact: true })).toBeVisible();
    if (errors.length) throw new Error(errors.join('; '));
    await context.close();

    const supplierContext = await browser.newContext();
    const supplier = await supplierContext.newPage();
    await supplier.goto('http://127.0.0.1:5175/login', { waitUntil: 'domcontentloaded' });
    await supplier.locator('#email').fill('supplier@tender.com');
    await supplier.locator('#password').fill('supplierpass');
    await supplier.getByRole('button', { name: 'Login', exact: true }).click();
    await supplier.waitForURL('**/supplier', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const supplierNavigation = supplier.getByRole('navigation', { name: 'Main navigation', exact: true });
    await expect(supplierNavigation.locator('[data-nav-section]')).toHaveCount(1);
    await expect(supplierNavigation.locator('[data-nav-section="administration"]')).toHaveCount(0);
    await expect(supplierNavigation.locator('[data-nav-section="finance"]')).toHaveCount(0);
    await supplierNavigation.getByRole('button', { name: 'Supplier portal', exact: true }).click();
    await supplierNavigation.getByRole('button', { name: 'Opportunities', exact: true }).click();
    await supplierNavigation.locator('[data-nav-leaf="open-tenders"]').click();
    await supplier.waitForURL('**/supplier/tenders', { waitUntil: 'domcontentloaded' });
    await supplierContext.close();
    console.log('PASS: three-level menu, single open branch, active routes, persistence, history, keyboard, compact rail, mobile drawer, EN/FR/AR and supplier permissions.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
