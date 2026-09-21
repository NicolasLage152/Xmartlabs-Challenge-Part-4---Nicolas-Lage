import { type Page, type Locator, expect } from '@playwright/test';


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


  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
    await expect(this.removeButton).toBeVisible();
  }

  async goBackToProducts(): Promise<void> {
    await this.backToProductsButton.click();
    await expect(this.page).toHaveURL(/inventory\.html$/);
  }
}

