import { type Page, type Locator, expect } from '@playwright/test';

/**
 * CartPage — Encapsulates the SauceDemo shopping cart page (/cart.html).
 *
 * Provides methods to inspect cart contents and proceed to checkout.
 */
export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-test="inventory-item"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.pageTitle = page.locator('[data-test="title"]');
  }

  /**
   * Assert that the cart page is visible and loaded.
   */
  async expectToBeVisible(): Promise<void> {
    await expect(this.pageTitle).toHaveText('Your Cart');
  }

  /**
   * Verify that a specific product is present in the cart.
   *
   * @param productName - The product name to look for
   */
  async expectProductInCart(productName: string): Promise<void> {
    const item = this.cartItems.filter({ hasText: productName });
    await expect(item).toBeVisible();
  }

  /**
   * Get the number of items currently in the cart.
   */
  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/checkout-step-one/);
  }
}

