import { type Page, type Locator, expect } from '@playwright/test';
import { parsePrice } from '../utils/priceUtils';

/**
 * CheckoutPage — Encapsulates the entire SauceDemo checkout flow.
 *
 * The checkout consists of three steps:
 * 1. Checkout: Your Information (step-one) — fill in personal details
 * 2. Checkout: Overview (step-two) — review order and pricing
 * 3. Checkout: Complete (complete) — order confirmation
 *
 * This page object handles all three steps, keeping the test code clean.
 */
export class CheckoutPage {
  readonly page: Page;

  // Step One: Your Information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;

  // Step Two: Overview
  readonly summaryItems: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly pageTitle: Locator;

  // Complete
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step One
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');

    // Step Two
    this.summaryItems = page.locator('[data-test="inventory-item"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.pageTitle = page.locator('[data-test="title"]');

    // Complete
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.completeText = page.locator('[data-test="complete-text"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  /**
   * Fill in the checkout information form and proceed to the overview.
   *
   * @param firstName - Customer first name
   * @param lastName - Customer last name
   * @param postalCode - Customer postal/zip code
   */
  async fillInformation(
    firstName: string,
    lastName: string,
    postalCode: string,
  ): Promise<void> {
    await expect(this.pageTitle).toHaveText('Checkout: Your Information');

    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();

    // Wait for step-two page to load
    await expect(this.page).toHaveURL(/checkout-step-two/);
  }

  /**
   * Assert that the checkout overview page is visible.
   */
  async expectOverviewVisible(): Promise<void> {
    await expect(this.pageTitle).toHaveText('Checkout: Overview');
  }

  /**
   * Extract individual item prices from the checkout overview summary.
   * Returns an array of numbers (e.g., [29.99, 9.99]).
   */
  async getItemPrices(): Promise<number[]> {
    const priceLocators = this.summaryItems.locator('[data-test="inventory-item-price"]');
    const priceTexts = await priceLocators.allTextContents();

    return priceTexts.map((text) => parsePrice(text));
  }

  /**
   * Extract the "Item total" (subtotal) value from the checkout overview.
   * The label format is: "Item total: $XX.XX"
   */
  async getSubtotal(): Promise<number> {
    const text = await this.subtotalLabel.textContent();
    return parsePrice(text);
  }

  /**
   * Extract the "Tax" value from the checkout overview.
   * The label format is: "Tax: $X.XX"
   */
  async getTax(): Promise<number> {
    const text = await this.taxLabel.textContent();
    return parsePrice(text);
  }

  /**
   * Extract the "Total" value from the checkout overview.
   * The label format is: "Total: $XX.XX"
   */
  async getTotal(): Promise<number> {
    const text = await this.totalLabel.textContent();
    return parsePrice(text);
  }

  /**
   * Click the "Finish" button to complete the order.
   * Verifies the confirmation page loads.
   */
  async finishOrder(): Promise<void> {
    await this.finishButton.click();
    await expect(this.page).toHaveURL(/checkout-complete/);
  }

  /**
   * Assert that the order completion page shows the expected success message.
   */
  async expectOrderComplete(): Promise<void> {
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}

