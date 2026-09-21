import { test, expect } from '@playwright/test';
import { parsePrice } from '../priceUtils';

/**
 * Unit tests for parsePrice() — the centralized price parsing utility.
 *
 * OBS-6 fix: parsePrice is a pure function with business-critical logic
 * (pricing calculations depend on it). It deserves its own test suite
 * covering edge cases that E2E tests don't exercise.
 */
test.describe('parsePrice() utility', () => {
  test('parses standard dollar format "$29.99"', () => {
    expect(parsePrice('$29.99')).toBe(29.99);
  });

  test('parses price without dollar sign "29.99"', () => {
    expect(parsePrice('29.99')).toBe(29.99);
  });

  test('parses zero price "$0.00"', () => {
    expect(parsePrice('$0.00')).toBe(0);
  });

  test('parses price with label text "Item total: $39.98"', () => {
    expect(parsePrice('Item total: $39.98')).toBe(39.98);
  });

  test('parses price with "Tax: $3.20" prefix', () => {
    expect(parsePrice('Tax: $3.20')).toBe(3.2);
  });

  test('parses whole number price "$10"', () => {
    expect(parsePrice('$10')).toBe(10);
  });

  test('throws descriptive error on null input', () => {
    expect(() => parsePrice(null)).toThrow('Price text is null or undefined');
  });

  test('throws descriptive error on empty string', () => {
    expect(() => parsePrice('')).toThrow('Price text is null or undefined');
  });

  test('throws descriptive error on non-numeric text "Free"', () => {
    expect(() => parsePrice('Free')).toThrow('Failed to parse price from text: "Free"');
  });

  test('throws descriptive error on text with no digits "N/A"', () => {
    expect(() => parsePrice('N/A')).toThrow('Failed to parse price from text');
  });
});

