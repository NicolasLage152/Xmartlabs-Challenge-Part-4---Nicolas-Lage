import { type Page, type Locator, expect } from '@playwright/test';

/**
 * LoginPage — Encapsulates the SauceDemo login screen.
 *
 * Uses data-test attributes provided by SauceDemo for robust,
 * refactor-resistant selectors.
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  /**
   * Navigate to the login page and wait for it to be ready.
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Perform login with the given credentials.
   * Uses Playwright's built-in auto-waiting — no static sleeps needed.
   * After submitting, waits for the URL to change to /inventory,
   * which naturally handles the performance_glitch_user delay.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    // Auto-retrying assertion: polls until URL matches or timeout expires.
    // This elegantly handles the ~5s delay from performance_glitch_user.
    await expect(this.page).toHaveURL(/inventory/);
  }
}

