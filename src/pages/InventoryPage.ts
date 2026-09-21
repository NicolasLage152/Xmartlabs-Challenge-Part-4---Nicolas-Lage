import { type Page, type Locator, expect } from '@playwright/test';
import { parsePrice } from '../utils/priceUtils';

/**
 * InventoryPage — Encapsulates the SauceDemo product listing page (/inventory.html).
 */
export class InventoryPage {
  readonly page: Page;
  readonly inventoryItems: Locator;
  readonly shoppingCartLink: Locator;
  readonly shoppingCartBadge: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
    this.shoppingCartLink = page.locator('[data-test="shopping-cart-link"]');
    this.shoppingCartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.pageTitle = page.locator('[data-test="title"]');
  }

  async expectToBeVisible(): Promise<void> {
    await expect(this.pageTitle).toHaveText('Products');
  }

  /**
   * Uses the item name for a readable, intention-revealing selector.
   *
   * @param productName - The exact display name of the product (e.g., "Sauce Labs Backpack")
   */
  async openProductDetail(productName: string): Promise<void> {
    const productLink = this.page.locator('[data-test="inventory-item"]')
      .filter({ hasText: productName })
      .locator('[data-test="inventory-item-name"]');

    await productLink.click();
    await expect(this.page.locator('[data-test="back-to-products"]')).toBeVisible();
  }

  /**
   * @param productName - The exact display name of the product
   */
  async addProductToCart(productName: string): Promise<void> {
    const productCard = this.page.locator('[data-test="inventory-item"]')
      .filter({ hasText: productName });

    await productCard.getByRole('button', { name: 'Add to cart' }).click();
  }

  async goToCart(): Promise<void> {
    await this.shoppingCartLink.click();
    await expect(this.page).toHaveURL(/cart/);
  }

  /**
   * Uses waitFor() instead of isVisible() to leverage Playwright's auto-retry,
   * which is critical for the performance_glitch_user where the badge may
   * render with a delay.
   * Returns 0 if the badge does not appear within the configured timeout.
   */
  async getCartBadgeCount(): Promise<number> {
    try {
      await this.shoppingCartBadge.waitFor({ state: 'visible', timeout: 5_000 });
      const text = await this.shoppingCartBadge.textContent();
      return parseInt(text ?? '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * @param productName - The exact display name of the product
   * @returns The price as a number (e.g., 29.99)
   */
  async getProductPrice(productName: string): Promise<number> {
    const productCard = this.page.locator('[data-test="inventory-item"]')
      .filter({ hasText: productName });

    const priceText = await productCard
      .locator('[data-test="inventory-item-price"]')
      .textContent();

    return parsePrice(priceText);
  }
}

export { parsePrice } from '../utils/priceUtils';
