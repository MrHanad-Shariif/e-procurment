import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.UI_BASE_URL || "http://localhost:5173",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1100 },
  },
});
