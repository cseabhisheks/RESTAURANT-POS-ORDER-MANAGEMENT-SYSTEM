import crypto from 'node:crypto';
import { Order } from '../models/Order.js';

export async function generateUniqueOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const datePart = `${y}${m}${d}`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomPart = crypto.randomInt(1000, 9999);
    const candidate = `ORD-${datePart}-${randomPart}`;
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) {
      return candidate;
    }
  }

  const fallback = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${datePart}-${fallback}`;
}

