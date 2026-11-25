import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { MenuItem } from '../src/models/MenuItem.js';
import { Order } from '../src/models/Order.js';

const TEST_MONGO_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_pos_test';

let server;
let baseUrl;
let adminToken;
let staffToken;
let availableItem;
let unavailableItem;
let createdOrderId;

before(async () => {
  await connectDB(TEST_MONGO_URI);
  await Promise.all([
    User.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
  ]);

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const staffHash = await bcrypt.hash('Staff@123', 10);

  await User.create([
    { name: 'Test Admin', email: 'admin@test.local', passwordHash: adminHash, role: 'Admin' },
    { name: 'Test Staff', email: 'staff@test.local', passwordHash: staffHash, role: 'Staff' },
  ]);

  availableItem = await MenuItem.create({
    name: 'Test Pizza',
    category: 'Mains',
    price: 200,
    isAvailable: true,
  });

  unavailableItem = await MenuItem.create({
    name: 'Sold Out Cake',
    category: 'Desserts',
    price: 150,
    isAvailable: false,
  });

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });

  const adminLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.local', password: 'Admin@123' }),
  }).then((r) => r.json());
  adminToken = adminLogin.token;

  const staffLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@test.local', password: 'Staff@123' }),
  }).then((r) => r.json());
  staffToken = staffLogin.token;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('Staff is blocked from creating menu items (403) while Admin succeeds (201)', async () => {
  const staffRes = await fetch(`${baseUrl}/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ name: 'Cola', category: 'Beverages', price: 60 }),
  });
  assert.equal(staffRes.status, 403);

  const adminRes = await fetch(`${baseUrl}/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ name: 'Cola', category: 'Beverages', price: 60 }),
  });
  assert.equal(adminRes.status, 201);
  const data = await adminRes.json();
  assert.equal(data.item.name, 'Cola');
});

test('Unavailable menu items cannot be added to new orders', async () => {
  const res = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      orderType: 'Takeaway',
      items: [{ menuItemId: unavailableItem._id.toString(), quantity: 1 }],
    }),
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.message, /unavailable/i);
});

test('Server calculates authoritative totals and ignores tampered client totals', async () => {
  const res = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      orderType: 'Dine-In',
      tableNumber: 'T-05',
      items: [{ menuItemId: availableItem._id.toString(), quantity: 2, unitPrice: 1 }],
      discountAmount: 50,
      subtotal: 1,
      totalAmount: 1,
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  createdOrderId = body.order._id;

  // 2 * 200 = 400 subtotal; -50 discount = 350 taxable; 5% tax = 17.5; total = 367.5
  assert.equal(body.order.subtotal, 400);
  assert.equal(body.order.discountAmount, 50);
  assert.equal(body.order.taxAmount, 17.5);
  assert.equal(body.order.totalAmount, 367.5);
  assert.equal(body.order.status, 'Pending');
  assert.equal(body.order.paymentStatus, 'Unpaid');
});

test('Order workflow transitions sequentially and records payment once', async () => {
  // Invalid jump: Pending -> Ready should fail
  const invalidRes = await fetch(`${baseUrl}/orders/${createdOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: 'Ready' }),
  });
  assert.equal(invalidRes.status, 400);

  // Valid transitions: Pending -> Preparing -> Ready -> Completed
  for (const nextStatus of ['Preparing', 'Ready', 'Completed']) {
    const res = await fetch(`${baseUrl}/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.order.status, nextStatus);
  }

  // Record payment via UPI
  const payRes = await fetch(`${baseUrl}/orders/${createdOrderId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ paymentMethod: 'UPI' }),
  });
  assert.equal(payRes.status, 200);
  const payData = await payRes.json();
  assert.equal(payData.order.paymentStatus, 'Paid');
  assert.equal(payData.order.paymentMethod, 'UPI');

  // Duplicate payment rejected
  const dupPayRes = await fetch(`${baseUrl}/orders/${createdOrderId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ paymentMethod: 'Cash' }),
  });
  assert.equal(dupPayRes.status, 400);

  // Daily sales summary reflects the order
  const reportRes = await fetch(`${baseUrl}/reports/daily-sales`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert.equal(reportRes.status, 200);
  const reportData = await reportRes.json();
  assert.equal(reportData.summary.totalOrders, 1);
  assert.equal(reportData.summary.completedOrders, 1);
  assert.equal(reportData.summary.dailySales, 367.5);
  assert.equal(reportData.summary.paymentBreakdown.UPI, 367.5);
});
