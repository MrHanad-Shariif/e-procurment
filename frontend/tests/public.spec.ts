import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("i18nextLng", "en"));
  await page.emulateMedia({ colorScheme: "light" });
});

test("landing page links and a persistent light/dark theme", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Better procurement.");
  await page.screenshot({ path: "test-results/landing-light.png", fullPage: true });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: "test-results/landing-dark.png", fullPage: true });
  await page.getByRole("link", { name: "Sign in", exact: true }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back.", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: "test-results/login-dark.png", fullPage: true });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.screenshot({ path: "test-results/login-light.png", fullPage: true });
  await page.getByRole("link", { name: "Create a workspace", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Create your workspace.", exact: true })
  ).toBeVisible();
  await page.screenshot({ path: "test-results/signup-light.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("mobile landing and auth pages fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/login", "/signup"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/public-mobile-${path.replaceAll("/", "") || "landing"}.png`,
      fullPage: true,
    });
  }
});

test("failed login stays on the form and password visibility works", async ({ page }) => {
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({ status: 401, json: { data: null, error: "Invalid credentials", meta: null } })
  );
  await page.goto("/login");
  await page.getByLabel("Work email", { exact: true }).fill("wrong@example.com");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Check your workspace address");
  await expect(page).toHaveURL(/\/login$/);
});

test("signup submits a separate workspace and opens its dashboard", async ({ page }) => {
  const user = {
    id: "signup-user",
    orgId: "signup-org",
    firstName: "Mina",
    lastName: "Ali",
    email: "mina@example.com",
    preferredLanguage: "EN",
    isActive: true,
    roles: [{ id: "admin", name: "Admin", slug: "admin" }],
    permissions: [
      "purchase_request.view_all",
      "purchase_request.create",
      "purchase_order.view_all",
      "supplier.view",
      "settings.view",
    ],
  };
  let submitted: Record<string, string> = {};
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/signup") {
      submitted = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        json: {
          data: {
            accessToken: "fixture-access",
            refreshToken: "fixture-refresh",
            user,
            organization: { id: "signup-org", name: "Northstar Test", slug: "northstar-test" },
          },
          error: null,
          meta: null,
        },
      });
    }
    if (path.startsWith("/api/v1/org/"))
      return route.fulfill({
        json: {
          data: {
            name: "Northstar Test",
            slug: "northstar-test",
            systemName: "E-Procurement",
            defaultLanguage: "EN",
          },
          error: null,
          meta: null,
        },
      });
    if (path === "/api/v1/auth/me")
      return route.fulfill({ json: { data: user, error: null, meta: null } });
    return route.fulfill({ json: { data: [], error: null, meta: { totalPages: 1, total: 0 } } });
  });
  await page.goto("/signup");
  await page.getByLabel("First name", { exact: true }).fill("Mina");
  await page.getByLabel("Last name", { exact: true }).fill("Ali");
  await page.getByLabel("Organization name", { exact: true }).fill("Northstar Test");
  await expect(page.getByLabel("Workspace address", { exact: true })).toHaveValue("northstar-test");
  await page.getByLabel("Work email", { exact: true }).fill("mina@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password-2026");
  await page.getByRole("button", { name: "Create a workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("Northstar Test", { exact: true })).toBeVisible();
  expect(submitted.org_slug).toBe("northstar-test");
  expect(submitted.organization_name).toBe("Northstar Test");
  expect(submitted.first_name).toBe("Mina");
  expect(submitted).not.toHaveProperty("role_ids");
  expect(await page.evaluate(() => localStorage.getItem("org_slug"))).toBe("northstar-test");
});

test("live login reaches a dark dashboard and logout preserves the theme", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.getByLabel("Workspace address", { exact: true }).fill("default");
  await page
    .getByLabel("Work email", { exact: true })
    .fill(process.env.TEST_ADMIN_EMAIL || "admin@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.TEST_ADMIN_PASSWORD || "admin123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  try {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh dashboard" })).toBeEnabled();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.screenshot({ path: "test-results/dashboard-dark.png", fullPage: true });
    await page.getByRole("button", { name: "My account", exact: true }).click();
    await page.getByRole("menuitem", { name: "Logout", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem("access_token"))).toBeNull();
    await expect(page.locator("html")).toHaveClass(/dark/);
  } finally {
    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem("access_token"),
      refresh: localStorage.getItem("refresh_token"),
    }));
    if (tokens.access && tokens.refresh)
      await request.post(
        `${process.env.API_BASE_URL || "http://localhost:5000/api/v1"}/auth/logout`,
        {
          headers: { Authorization: `Bearer ${tokens.access}` },
          data: { refreshToken: tokens.refresh },
        }
      );
  }
});
