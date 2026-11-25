import { AppError } from './AppError.js';

export function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Computes authoritative order billing totals on the server.
 * Client-supplied totals or unit prices are never trusted.
 */
export function calculateOrderTotals({ items, taxRatePercent, discountAmount = 0 }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must include at least one menu item.', 400);
  }

  if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0 || taxRatePercent > 100) {
    throw new AppError('Tax rate must be between 0 and 100.', 400);
  }

  const parsedDiscount = Number(discountAmount);
  if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
    throw new AppError('Discount amount must be a non-negative number.', 400);
  }

  const normalizedItems = items.map((item) => {
    const unitPrice = Number(item.unitPrice);
    const quantity = Number(item.quantity);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new AppError(`Invalid price for item "${item.name || 'Unknown'}".`, 400);
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new AppError(
        `Quantity for "${item.name || 'item'}" must be a whole number between 1 and 100.`,
        400
      );
    }

    const lineTotal = roundCurrency(unitPrice * quantity);
    return {
      ...item,
      unitPrice: roundCurrency(unitPrice),
      quantity,
      lineTotal,
    };
  });

  const subtotal = roundCurrency(
    normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  );

  const normalizedDiscount = roundCurrency(parsedDiscount);
  if (normalizedDiscount > subtotal) {
    throw new AppError('Discount amount cannot exceed the order subtotal.', 400);
  }

  const taxableAmount = roundCurrency(subtotal - normalizedDiscount);
  const taxAmount = roundCurrency((taxableAmount * taxRatePercent) / 100);
  const totalAmount = roundCurrency(taxableAmount + taxAmount);

  return {
    items: normalizedItems,
    subtotal,
    taxRatePercent,
    taxAmount,
    discountAmount: normalizedDiscount,
    totalAmount,
  };
}

