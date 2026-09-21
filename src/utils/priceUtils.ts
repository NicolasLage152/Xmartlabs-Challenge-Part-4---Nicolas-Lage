
export function parsePrice(priceText: string | null): number {
  if (!priceText) throw new Error('Price text is null or undefined');
  return parseFloat(priceText.replace(/[^0-9.]/g, ''));
}

