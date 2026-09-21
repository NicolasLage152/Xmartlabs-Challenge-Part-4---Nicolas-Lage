/**
 * Utility: Parse a price string like "$29.99" into a float (29.99).
 * Removes the dollar sign and any whitespace.
 *
 * Centralized here to avoid coupling between page objects that
 * need price parsing (InventoryPage, CheckoutPage).
 */
export function parsePrice(priceText: string | null): number {
  if (!priceText) throw new Error('Price text is null or undefined');
  return parseFloat(priceText.replace(/[^0-9.]/g, ''));
}

