import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { calculateOrderTotals } from '../utils/billing.js';

const SAMPLE_MENU = [
  {
    name: 'Crispy Paneer Tikka',
    category: 'Starters',
    price: 220,
    description: 'Char-grilled cottage cheese cubes with mint chutney',
    isAvailable: true,
  },
  {
    name: 'Garlic Herb Bread',
    category: 'Starters',
    price: 130,
    description: 'Toasted baguette slices with roasted garlic butter',
    isAvailable: true,
  },
  {
    name: 'Margherita Pizza',
    category: 'Mains',
    price: 320,
    description: 'Classic tomato sauce, mozzarella, and fresh basil',
    isAvailable: true,
  },
  {
    name: 'Paneer Butter Masala Bowl',
    category: 'Mains',
    price: 290,
    description: 'Rich tomato gravy served with fragrant jeera rice',
    isAvailable: true,
  },
  {
    name: 'Grilled Chicken Burger',
    category: 'Mains',
    price: 260,
    description: 'Herb-marinated chicken patty with cheddar and slaw',
    isAvailable: true,
  },
  {
    name: 'Peri Peri Fries',
    category: 'Sides',
    price: 140,
    description: 'Crispy skin-on fries tossed in spicy peri peri seasoning',
    isAvailable: true,
  },
  {
    name: 'Cold Brew Coffee',
    category: 'Beverages',
    price: 150,
    description: 'Slow-steeped iced coffee served over crystal ice',
    isAvailable: true,
  },
  {
    name: 'Fresh Lime Soda',
    category: 'Beverages',
    price: 90,
    description: 'Refreshing sweet and salted sparkling lime cooler',
    isAvailable: true,
  },
  {
    name: 'Chocolate Lava Cake',
    category: 'Desserts',
    price: 180,
    description: 'Warm chocolate sponge with molten fudge center',
    isAvailable: true,
  },
  {
    name: 'Seasonal Mango Cheesecake',
    category: 'Desserts',
    price: 210,
    description: 'Temporarily out of stock',
    isAvailable: false,
  },
];

async function seed() {
  await connectDB(env.mongoUri);
  console.log('Connected to MongoDB for seeding...');

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);

  const admin = await User.findOneAndUpdate(
    { email: 'admin@pos.local' },
    {
      name: 'Restaurant Admin',
      email: 'admin@pos.local',
      passwordHash: adminPasswordHash,
      role: 'Admin',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const staff = await User.findOneAndUpdate(
    { email: 'staff@pos.local' },
    {
      name: 'Counter Staff',
      email: 'staff@pos.local',
      passwordHash: staffPasswordHash,
      role: 'Staff',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const seededMenu = [];
  for (const entry of SAMPLE_MENU) {
    const doc = await MenuItem.findOneAndUpdate(
      { name: entry.name },
      entry,
      { upsert: true, new: true }
    );
    seededMenu.push(doc);
  }

  const existingOrderCount = await Order.countDocuments();
  if (existingOrderCount === 0) {
    const pizza = seededMenu.find((m) => m.name === 'Margherita Pizza');
    const fries = seededMenu.find((m) => m.name === 'Peri Peri Fries');
    const coffee = seededMenu.find((m) => m.name === 'Cold Brew Coffee');
    const burger = seededMenu.find((m) => m.name === 'Grilled Chicken Burger');
    const soda = seededMenu.find((m) => m.name === 'Fresh Lime Soda');

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `ORD-${y}${m}${d}`;

    const bill1 = calculateOrderTotals({
      items: [
        { menuItem: pizza._id, name: pizza.name, unitPrice: pizza.price, quantity: 1 },
        { menuItem: coffee._id, name: coffee.name, unitPrice: coffee.price, quantity: 2 },
      ],
      taxRatePercent: env.taxRatePercent,
      discountAmount: 20,
    });

    const bill2 = calculateOrderTotals({
      items: [
        { menuItem: burger._id, name: burger.name, unitPrice: burger.price, quantity: 2 },
        { menuItem: fries._id, name: fries.name, unitPrice: fries.price, quantity: 1 },
      ],
      taxRatePercent: env.taxRatePercent,
      discountAmount: 0,
    });

    const bill3 = calculateOrderTotals({
      items: [
        { menuItem: soda._id, name: soda.name, unitPrice: soda.price, quantity: 2 },
      ],
      taxRatePercent: env.taxRatePercent,
      discountAmount: 0,
    });

    await Order.insertMany([
      {
        orderNumber: `${prefix}-1001`,
        orderType: 'Dine-In',
        tableNumber: 'T-04',
        customerName: 'Aarav',
        ...bill1,
        status: 'Completed',
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        paidAt: new Date(),
        createdBy: staff._id,
      },
      {
        orderNumber: `${prefix}-1002`,
        orderType: 'Takeaway',
        tableNumber: '',
        customerName: 'Neha',
        ...bill2,
        status: 'Preparing',
        paymentStatus: 'Unpaid',
        createdBy: staff._id,
      },
      {
        orderNumber: `${prefix}-1003`,
        orderType: 'Dine-In',
        tableNumber: 'T-02',
        customerName: 'Rohan',
        ...bill3,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        createdBy: admin._id,
      },
    ]);
  }

  console.log('Seed completed successfully.');
  console.log('Demo Accounts:');
  console.log('  Admin -> admin@pos.local / Admin@123');
  console.log('  Staff -> staff@pos.local / Staff@123');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
