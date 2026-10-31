import { expect, test, type Page } from "@playwright/test";

const api = process.env.API_BASE_URL || "http://localhost:5000/api/v1";
let accessToken: string;
let refreshToken: string;

test.beforeAll(async ({ request }) => {
  const response = await request.post(`${api}/auth/login`, {
    data: {
      email: process.env.TEST_ADMIN_EMAIL || "admin@example.com",
      password: process.env.TEST_ADMIN_PASSWORD || "admin123",
      org_slug: "default",
    },
  });
  expect(response.ok()).toBeTruthy();
  const { data } = await response.json();
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("org_slug", "default");
      localStorage.setItem("i18nextLng", "en");
    },
    { accessToken, refreshToken }
  );
});

test.afterAll(async ({ request }) => {
  if (accessToken && refreshToken)
    await request.post(`${api}/auth/logout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { refreshToken },
    });
});

async function loaded(page: Page) {
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh dashboard" })).toBeEnabled();
}

test("live dashboard, sidebar, quick actions, and account menu", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dashboard");
  await loaded(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Procurement activity", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(page.locator('[data-slot="sidebar"][data-state="collapsed"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "New requisition", exact: true }).first().click();
  await expect(page).toHaveURL(/purchase-requisitions\/new/);
  await page.goto("/dashboard");
  await loaded(page);
  await page.getByRole("button", { name: "My account", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Logout" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile drawer, navigation, and no page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await loaded(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  ).toBeTruthy();
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Suppliers", exact: true }).click();
  await expect(page).toHaveURL(/\/suppliers$/);
  await expect(drawer).toHaveCount(0);
});

test("French and Arabic translations and right-to-left layout", async ({ page }) => {
  await page.goto("/dashboard");
  await loaded(page);
  await page.getByLabel("Language", { exact: true }).selectOption("fr");
  await expect(page.getByRole("heading", { name: "Tableau de bord", exact: true })).toBeVisible();
  await page.getByLabel("Langue", { exact: true }).selectOption("ar");
  await expect(page.getByRole("heading", { name: "لوحة التحكم", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('[data-slot="sidebar-container"]')).toHaveAttribute(
    "data-side",
    "right"
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  ).toBeTruthy();
  await page.screenshot({ path: "test-results/dashboard-arabic.png", fullPage: true });
});

test("paginated data, currencies, request filtering, and chart period", async ({ page }) => {
  const now = new Date().toISOString();
  const requests = Array.from({ length: 102 }, (_, index) => ({
    id: `test-${index}`,
    title: index === 0 ? "Office equipment" : `Request ${index}`,
    prNumber: `PR-${index}`,
    status: index < 2 ? "SUBMITTED" : "APPROVED",
    totalEstimate: 250,
    currency: "USD",
    createdAt: now,
  }));
  await page.route("**/api/v1/purchase-requisitions/?*", async (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page"));
    await route.fulfill({
      json: {
        data: requests.slice((pageNumber - 1) * 100, pageNumber * 100),
        error: null,
        meta: { page: pageNumber, total: 102, totalPages: 2, perPage: 100 },
      },
    });
  });
  await page.route("**/api/v1/purchase-orders/?*", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            id: "one",
            totalAmount: 100,
            currency: "USD",
            status: "PENDING_APPROVAL",
            createdAt: now,
          },
          { id: "two", totalAmount: 500, currency: "EUR", status: "COMPLETED", createdAt: now },
          { id: "three", totalAmount: 1000, currency: "USD", status: "CANCELLED", createdAt: now },
        ],
        error: null,
        meta: { totalPages: 1 },
      },
    })
  );
  await page.route("**/api/v1/suppliers/?*", (route) =>
    route.fulfill({
      json: {
        data: [{ status: "APPROVED" }, { status: "APPROVED" }, { status: "PENDING" }],
        error: null,
        meta: { totalPages: 1 },
      },
    })
  );
  await page.goto("/dashboard");
  await loaded(page);
  const stats = page.getByRole("region", { name: "Overview", exact: true });
  await expect(stats.getByText("102", { exact: true })).toBeVisible();
  await expect(stats.getByText("3", { exact: true })).toBeVisible();
  await expect(stats.getByText("2", { exact: true })).toBeVisible();
  await expect(stats.getByText("$100", { exact: true })).toBeVisible();
  await page.getByLabel("Order currency").selectOption("EUR");
  await expect(stats.getByText("€500", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /Needs review/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByLabel("Search requisitions…").fill("Office equipment");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Office equipment/ })).toHaveAttribute("href", "/purchase-requisitions/test-0");
  await page.getByLabel("Search requisitions…").fill("");
  await page.getByRole("tab", { name: "All requests", exact: true }).click();
  await page.getByRole("combobox", { name: "Procurement activity", exact: true }).selectOption("30");
  await expect(page.getByRole("combobox", { name: "Procurement activity", exact: true })).toHaveValue("30");
  await page.screenshot({ path: "test-results/dashboard-populated-fixtures.png", fullPage: true });
});
