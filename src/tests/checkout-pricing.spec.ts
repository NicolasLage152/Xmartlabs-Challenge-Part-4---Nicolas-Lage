import { test, expect } from '../fixtures/pomFixtures';

/**
 * ============================================================================
 * BONUS TEST — Checkout Price Calculation Validation
 * ============================================================================
 *
 * HIGH BUSINESS VALUE:
 * This test validates the mathematical integrity of the checkout pricing.
 * A pricing bug (wrong subtotal, incorrect tax, rounding error) directly
 * impacts revenue and customer trust. This is the kind of regression that
 * can slip through visual testing but is caught perfectly by automation.
 *
 * What it verifies:
 * 1. Individual item prices sum correctly to the displayed "Item total" (subtotal)
 * 2. Subtotal + Tax equals the displayed "Total"
 * 3. Prices are correctly parsed from their string representation ($XX.XX)
 *
 * Uses `standard_user` instead of `performance_glitch_user` for the bonus test
 * to keep it focused on the pricing logic rather than performance handling.
 * The mandatory test already demonstrates glitch-user handling.
 */

const CREDENTIALS = {
  username: 'standard_user',
  password: 'secret_sauce',
} as const;

// Select two products with different prices to make the math validation meaningful
const PRODUCTS_TO_ADD = [
  'Sauce Labs Backpack',      // $29.99
  'Sauce Labs Bike Light',    // $9.99
] as const;

const CHECKOUT_INFO = {
  firstName: 'Jane',
  lastName: 'Smith',
  postalCode: '90210',
} as const;

test.describe('Bonus: Checkout Price Calculation @bonus', () => {
  test('should validate that checkout pricing math is correct', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    // ── Setup: Login and add multiple products ─────────────────────
    await test.step('Login and add products to cart', async () => {
      await loginPage.goto();
      await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
      await inventoryPage.expectToBeVisible();

      for (const product of PRODUCTS_TO_ADD) {
        await inventoryPage.addProductToCart(product);
      }

      // Verify cart badge reflects the correct item count
      const badgeCount = await inventoryPage.getCartBadgeCount();
      expect(badgeCount).toBe(PRODUCTS_TO_ADD.length);
    });

    // ── Navigate to checkout overview ──────────────────────────────
    await test.step('Proceed through cart and checkout info to overview', async () => {
      await inventoryPage.goToCart();
      await cartPage.expectToBeVisible();

      // Verify all products are in the cart
      for (const product of PRODUCTS_TO_ADD) {
        await cartPage.expectProductInCart(product);
      }

      await cartPage.proceedToCheckout();
      await checkoutPage.fillInformation(
        CHECKOUT_INFO.firstName,
        CHECKOUT_INFO.lastName,
        CHECKOUT_INFO.postalCode,
      );
      await checkoutPage.expectOverviewVisible();
    });

    // ── Extract and validate pricing ───────────────────────────────
    await test.step('Validate item prices sum to the subtotal', async () => {
      const itemPrices = await checkoutPage.getItemPrices();
      const subtotal = await checkoutPage.getSubtotal();

      // Sum individual item prices
      const calculatedSubtotal = itemPrices.reduce((sum, price) => sum + price, 0);

      // Use toFixed(2) comparison to handle floating-point precision
      // (e.g., 29.99 + 9.99 could yield 39.980000000000004 in JS)
      expect(
        parseFloat(calculatedSubtotal.toFixed(2)),
        `Sum of item prices (${itemPrices.join(' + ')} = ${calculatedSubtotal.toFixed(2)}) ` +
        `should equal displayed subtotal ($${subtotal.toFixed(2)})`,
      ).toBe(subtotal);
    });

    await test.step('Validate subtotal + tax equals the total', async () => {
      const subtotal = await checkoutPage.getSubtotal();
      const tax = await checkoutPage.getTax();
      const total = await checkoutPage.getTotal();

      const calculatedTotal = parseFloat((subtotal + tax).toFixed(2));

      expect(
        calculatedTotal,
        `Subtotal ($${subtotal.toFixed(2)}) + Tax ($${tax.toFixed(2)}) = ` +
        `$${calculatedTotal.toFixed(2)} should equal displayed Total ($${total.toFixed(2)})`,
      ).toBe(total);
    });
  });
});

