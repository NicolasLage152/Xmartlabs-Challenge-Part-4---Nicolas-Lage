import { test, expect } from '../fixtures/pomFixtures';
import { ENV } from '../config/env.config';

/**
 * ============================================================================
 * MANDATORY TEST SCENARIO — E2E Purchase Flow with performance_glitch_user
 * ============================================================================
 *
 * This test validates the complete purchase journey using the
 * `performance_glitch_user` account, which intentionally injects latency
 * (~5s delays) into various application interactions.
 *
 * PERFORMANCE STRATEGY:
 * We handle the glitch user's slowness exclusively through Playwright's
 * native mechanisms — NO static sleeps (page.waitForTimeout, setTimeout):
 *
 * 1. Extended timeouts in playwright.config.ts (action: 15s, expect: 15s)
 * 2. Auto-retrying assertions (toHaveURL, toBeVisible, toHaveText) that
 *    poll until the condition is met or the timeout expires
 * 3. Playwright's built-in auto-waiting on actions (click, fill) that
 *    waits for elements to be actionable before interacting
 *
 * Flow:
 *   Login → Open Product Detail → Add to Cart → Back to Products →
 *   Go to Cart → Checkout Info → Overview → Finish → Confirmation
 */

// We use a specific product to make the test deterministic and readable
const TARGET_PRODUCT = 'Sauce Labs Backpack';

const CHECKOUT_INFO = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '10001',
} as const;

test.describe('Mandatory: E2E Purchase Flow @mandatory', () => {
  test('should complete a full purchase using the performance_glitch_user', async ({
    loginPage,
    inventoryPage,
    productDetailPage,
    cartPage,
    checkoutPage,
  }) => {
    // ── Step 0: Login ──────────────────────────────────────────────
    // The performance_glitch_user has a ~5s delay on login.
    // We handle it via the auto-retrying `toHaveURL(/inventory/)` assertion
    // inside loginPage.login().
    await test.step('Login with performance_glitch_user', async () => {
      await loginPage.goto();
      await loginPage.login(ENV.GLITCH_USER, ENV.PASSWORD);
      await inventoryPage.expectToBeVisible();
    });

    // ── Step 1: Open Product Detail Page ───────────────────────────
    await test.step('Select a product and open its detail page', async () => {
      await inventoryPage.openProductDetail(TARGET_PRODUCT);
      await productDetailPage.expectProductName(TARGET_PRODUCT);
    });

    // ── Step 2: Add to cart from Product Detail Page ───────────────
    await test.step('Add product to cart from the detail page', async () => {
      await productDetailPage.addToCart();
    });

    // ── Step 3: Navigate back to Products ──────────────────────────
    await test.step('Return to inventory via "Back to products" button', async () => {
      await productDetailPage.goBackToProducts();
      await inventoryPage.expectToBeVisible();

      // Verify cart badge shows 1 item
      const badgeCount = await inventoryPage.getCartBadgeCount();
      expect(badgeCount).toBe(1);
    });

    // ── Step 4: Complete the checkout flow ──────────────────────────
    await test.step('Navigate to cart and verify product is present', async () => {
      await inventoryPage.goToCart();
      await cartPage.expectToBeVisible();
      await cartPage.expectProductInCart(TARGET_PRODUCT);
    });

    await test.step('Fill checkout information', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.fillInformation(
        CHECKOUT_INFO.firstName,
        CHECKOUT_INFO.lastName,
        CHECKOUT_INFO.postalCode,
      );
    });

    await test.step('Review order overview and finish purchase', async () => {
      await checkoutPage.expectOverviewVisible();
      await checkoutPage.finishOrder();
    });

    await test.step('Verify order confirmation', async () => {
      await checkoutPage.expectOrderComplete();
    });
  });
});

