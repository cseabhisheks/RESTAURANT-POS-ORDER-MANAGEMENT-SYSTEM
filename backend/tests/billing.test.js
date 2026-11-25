import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals } from '../src/utils/billing.js';

test('calculateOrderTotals computes subtotal, tax, discount, and final total', () => {
  const result = calculateOrderTotals({
    items: [
      { name: 'Margherita Pizza', unitPrice: 320, quantity: 2 },
      { name: 'Fresh Lime Soda', unitPrice: 90, quantity: 1 },
    ],
    taxRatePercent: 5,
    discountAmount: 30,
  });

  // Subtotal = (320*2) + 90 = 730
  // Taxable = 730 - 30 = 700
  // Tax (5%) = 35
  // Total = 735
  assert.equal(result.subtotal, 730);
  assert.equal(result.discountAmount, 30);
  assert.equal(result.taxAmount, 35);
  assert.equal(result.totalAmount, 735);
  assert.equal(result.items[0].lineTotal, 640);
  assert.equal(result.items[1].lineTotal, 90);
});

test('calculateOrderTotals handles rounding cleanly', () => {
  const result = calculateOrderTotals({
    items: [{ name: 'Espresso', unitPrice: 125.5, quantity: 1 }],
    taxRatePercent: 5,
    discountAmount: 0,
  });

  assert.equal(result.subtotal, 125.5);
  assert.equal(result.taxAmount, 6.28);
  assert.equal(result.totalAmount, 131.78);
});

test('calculateOrderTotals rejects empty items array', () => {
  assert.throws(
    () => calculateOrderTotals({ items: [], taxRatePercent: 5 }),
    /at least one menu item/i
  );
});

test('calculateOrderTotals rejects discount greater than subtotal', () => {
  assert.throws(
    () =>
      calculateOrderTotals({
        items: [{ name: 'Fries', unitPrice: 100, quantity: 1 }],
        taxRatePercent: 5,
        discountAmount: 150,
      }),
    /exceed the order subtotal/i
  );
});

test('calculateOrderTotals rejects non-integer or non-positive quantities', () => {
  assert.throws(
    () =>
      calculateOrderTotals({
        items: [{ name: 'Fries', unitPrice: 100, quantity: 0 }],
        taxRatePercent: 5,
      }),
    /whole number/i
  );
});
