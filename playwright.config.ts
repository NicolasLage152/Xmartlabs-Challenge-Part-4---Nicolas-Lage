import { defineConfig, devices } from '@playwright/test';
import './src/config/env.config';


/**
 * Playwright configuration optimized for the SauceDemo application.
 *
 * Key design decision: Extended timeouts across the board to accommodate
 * the `performance_glitch_user`, which intentionally injects latency into
 * the application. Rather than using static sleeps, we rely on Playwright's
 * built-in auto-waiting and auto-retrying assertions with generous timeouts.
 */
export default defineConfig({
  testDir: './src',
  testMatch: ['tests/**/*.spec.ts', 'utils/__tests__/**/*.spec.ts'],

  /* Run tests sequentially for predictable execution and clearer reports */
  fullyParallel: false,

  /* Fail CI if test.only is accidentally left in */
  forbidOnly: !!process.env.CI,

  /* Retry once to handle genuine transient glitches */
  retries: process.env.CI ? 1 : 0,

  /* Single worker — sequential execution is more predictable for E2E flows */
  workers: 1,

  /* HTML reporter for rich test reports */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    /* SauceDemo base URL */
    baseURL: 'https://www.saucedemo.com',

    /**
     * Extended action timeout (15s) to handle performance_glitch_user delays.
     * The glitch user adds ~5s latency to various actions. We set 15s to give
     * ample room without using static waits.
     */
    actionTimeout: 15_000,

    /**
     * Extended navigation timeout (30s) for the same performance reasons.
     */
    navigationTimeout: 30_000,

    /* Capture trace on first retry for debugging failures */
    trace: 'on-first-retry',

    /* Capture screenshot on failure for visual debugging */
    screenshot: 'only-on-failure',

    /* Record video on first retry */
    video: 'on-first-retry',
  },

  /**
   * Global expect timeout set to 15s. This is critical for the
   * performance_glitch_user: Playwright's auto-retrying assertions
   * (like toBeVisible, toHaveURL, toContainText) will keep polling
   * until this timeout, effectively handling the glitch without sleeps.
   */
  expect: {
    timeout: 15_000,
  },

  /* Global test timeout — generous to accommodate cumulative glitch delays */
  timeout: 120_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});

