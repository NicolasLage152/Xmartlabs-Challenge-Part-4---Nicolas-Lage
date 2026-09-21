
/**
 * Parses a price string (e.g., "$29.99") into a numeric value.
 *
 * @param priceText - The raw price string from the UI
 * @returns The price as a number (e.g., 29.99)
 * @throws If priceText is null/undefined or cannot be parsed into a valid number
 */
export function parsePrice(priceText: string | null): number {
  if (!priceText) throw new Error('Price text is null or undefined');

  const value = parseFloat(priceText.replace(/[^0-9.]/g, ''));

  if (isNaN(value)) {
    throw new Error(`Failed to parse price from text: "${priceText}"`);
  }

  return value;
}

