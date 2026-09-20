import { type Page, type Locator, expect } from '@playwright/test';

/**
 * ProductDetailPage — Encapsulates the SauceDemo individual product page.
 *
 * Reached by clicking a product name from the inventory grid.
 * Provides actions for the product detail view: add to cart, go back.
 */
export class ProductDetailPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('[data-test="inventory-item-name"]');
    this.productDescription = page.locator('[data-test="inventory-item-desc"]');
    this.productPrice = page.locator('[data-test="inventory-item-price"]');
    this.addToCartButton = page.locator('[data-test="add-to-cart"]');
    this.removeButton = page.locator('[data-test="remove"]');
    this.backToProductsButton = page.locator('[data-test="back-to-products"]');
  }

  /**
   * Assert that the product detail page is visible and shows the expected product.
   *
   * @param expectedName - The product name to verify
   */
  async expectProductName(expectedName: string): Promise<void> {
    await expect(this.productName).toHaveText(expectedName);
  }

  /**
   * Add the currently viewed product to the cart.
   * After clicking, verifies the button text changes to "Remove",
   * confirming the product was successfully added.
   */
  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
    // Verify button changed — confirms add-to-cart succeeded
    await expect(this.removeButton).toBeVisible();
  }

  /**
   * Navigate back to the inventory (products list) page.
   * Waits for the inventory URL to confirm navigation completed.
   */
  async goBackToProducts(): Promise<void> {
    await this.backToProductsButton.click();
    await expect(this.page).toHaveURL(/inventory\.html$/);
  }
}

