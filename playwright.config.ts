import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite for the Don Zanahorio demo (Astro + React islands + Supabase).
 * Run against the local dev server: `pnpm test:e2e`.
 *
 * Some specs write real rows to Supabase (orders, POS sales, surveys, wholesale
 * quotes, job applications/referrals, admin price edits). Those are tagged
 * `@writes-data` in their titles. Use `pnpm test:e2e:safe` to skip them.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:4321",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
