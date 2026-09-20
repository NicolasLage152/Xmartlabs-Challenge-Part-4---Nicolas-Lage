import { type Page, type Locator, expect } from '@playwright/test';

/**
 * InventoryPage — Encapsulates the SauceDemo product listing page (/inventory.html).
 *
 * Provides methods to interact with the product grid: selecting products,
 * adding items to cart, and navigating to the cart.
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

  /**
   * Assert that we are on the inventory page and it has loaded.
   */
  async expectToBeVisible(): Promise<void> {
    await expect(this.pageTitle).toHaveText('Products');
  }

  /**
   * Click on a product's name/image link to navigate to its detail page.
   * Uses the item name for a readable, intention-revealing selector.
   *
   * @param productName - The exact display name of the product (e.g., "Sauce Labs Backpack")
   */
  async openProductDetail(productName: string): Promise<void> {
    const productLink = this.page.locator('[data-test="inventory-item"]')
      .filter({ hasText: productName })
      .locator('[data-test="inventory-item-name"]');

    await productLink.click();

    // Wait for the product detail page to load
    await expect(this.page.locator('[data-test="back-to-products"]')).toBeVisible();
  }

  /**
   * Add a product to the cart directly from the inventory grid.
   *
   * @param productName - The exact display name of the product
   */
  async addProductToCart(productName: string): Promise<void> {
    const productCard = this.page.locator('[data-test="inventory-item"]')
      .filter({ hasText: productName });

    // Click the "Add to cart" button within this specific product card
    await productCard.getByRole('button', { name: 'Add to cart' }).click();
  }

  /**
   * Navigate to the shopping cart page.
   */
  async goToCart(): Promise<void> {
    await this.shoppingCartLink.click();
    await expect(this.page).toHaveURL(/cart/);
  }

  /**
   * Get the current cart badge count. Returns 0 if badge is not visible.
   */
  async getCartBadgeCount(): Promise<number> {
    if (await this.shoppingCartBadge.isVisible()) {
      const text = await this.shoppingCartBadge.textContent();
      return parseInt(text ?? '0', 10);
    }
    return 0;
  }

  /**
   * Retrieves the price of a product by its name from the inventory grid.
   *
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

/**
 * Utility: Parse a price string like "$29.99" into a float (29.99).
 * Removes the dollar sign and any whitespace.
 */
export function parsePrice(priceText: string | null): number {
  if (!priceText) throw new Error('Price text is null or undefined');
  return parseFloat(priceText.replace(/[^0-9.]/g, ''));
}

