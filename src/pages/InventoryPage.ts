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
   * Asserts the cart badge shows the expected item count.
   *
   * Uses Playwright's auto-retrying assertions (toHaveText / toBeHidden),
   * which respect the global expect timeout from playwright.config.ts.
   * This handles the performance_glitch_user's delayed renders without
   * hardcoded timeouts or silent try/catch blocks.
   *
   * @param expected - The number of items expected in the cart badge
   */
  async expectCartBadgeCount(expected: number): Promise<void> {
    if (expected === 0) {
      await expect(this.shoppingCartBadge).toBeHidden();
    } else {
      await expect(this.shoppingCartBadge).toHaveText(String(expected));
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


