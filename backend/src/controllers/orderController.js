import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.js';
import { Order, ORDER_TYPES, PAYMENT_METHODS } from '../models/Order.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { calculateOrderTotals } from '../utils/billing.js';
import { generateUniqueOrderNumber } from '../utils/orderNumber.js';
import { ORDER_STATUSES, validateOrderStatusTransition } from '../utils/orderWorkflow.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderType,
    tableNumber = '',
    customerName = '',
    items,
    discountAmount = 0,
  } = req.body || {};

  if (!ORDER_TYPES.includes(orderType)) {
    throw new AppError(`Order type must be one of: ${ORDER_TYPES.join(', ')}.`, 400);
  }

  if (orderType === 'Dine-In' && (typeof tableNumber !== 'string' || !tableNumber.trim())) {
    throw new AppError('Table number is required for Dine-In orders.', 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one menu item.', 400);
  }

  const quantityById = new Map();
  for (const entry of items) {
    const rawId = entry?.menuItemId || entry?.menuItem;
    const qty = Number(entry?.quantity);

    if (!rawId || !mongoose.isValidObjectId(rawId)) {
      throw new AppError('Each order item must include a valid menuItemId.', 400);
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      throw new AppError('Item quantity must be a whole number between 1 and 100.', 400);
    }

    const key = String(rawId);
    quantityById.set(key, (quantityById.get(key) || 0) + qty);
  }

  const menuIds = Array.from(quantityById.keys());
  const menuItems = await MenuItem.find({ _id: { $in: menuIds } });

  if (menuItems.length !== menuIds.length) {
    throw new AppError('One or more selected menu items were not found.', 404);
  }

  const menuMap = new Map(menuItems.map((m) => [m._id.toString(), m]));
  const resolvedItems = [];

  for (const [id, quantity] of quantityById.entries()) {
    const menuItem = menuMap.get(id);
    if (!menuItem.isAvailable) {
      throw new AppError(
        `Menu item "${menuItem.name}" is currently unavailable and cannot be added to new orders.`,
        400
      );
    }

    resolvedItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      unitPrice: menuItem.price,
      quantity,
    });
  }

  const billing = calculateOrderTotals({
    items: resolvedItems,
    taxRatePercent: env.taxRatePercent,
    discountAmount,
  });

  const orderNumber = await generateUniqueOrderNumber();

  const order = await Order.create({
    orderNumber,
    orderType,
    tableNumber: orderType === 'Dine-In' ? tableNumber.trim() : '',
    customerName: typeof customerName === 'string' ? customerName.trim() : '',
    items: billing.items,
    subtotal: billing.subtotal,
    taxRatePercent: billing.taxRatePercent,
    taxAmount: billing.taxAmount,
    discountAmount: billing.discountAmount,
    totalAmount: billing.totalAmount,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    createdBy: req.user.id,
  });

  const populatedOrder = await Order.findById(order._id).populate('createdBy', 'name role');
  res.status(201).json({ success: true, order: populatedOrder });
});

export const getOrders = asyncHandler(async (req, res) => {
  const { status, search, orderType, paymentStatus, limit = '50' } = req.query;
  const filter = {};

  if (typeof status === 'string' && status.trim() && status !== 'All') {
    if (!ORDER_STATUSES.includes(status)) {
      throw new AppError(`Invalid status filter. Valid: ${ORDER_STATUSES.join(', ')}.`, 400);
    }
    filter.status = status;
  }

  if (typeof orderType === 'string' && orderType.trim() && orderType !== 'All') {
    filter.orderType = orderType;
  }

  if (typeof paymentStatus === 'string' && paymentStatus.trim() && paymentStatus !== 'All') {
    filter.paymentStatus = paymentStatus;
  }

  if (typeof search === 'string' && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ orderNumber: pattern }, { customerName: pattern }, { tableNumber: pattern }];
  }

  const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const orders = await Order.find(filter)
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(parsedLimit);

  res.status(200).json({ success: true, count: orders.length, orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid order ID.', 400);
  }

  const order = await Order.findById(id).populate('createdBy', 'name role');
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  res.status(200).json({ success: true, order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid order ID.', 400);
  }

  const { status } = req.body || {};
  if (typeof status !== 'string' || !status.trim()) {
    throw new AppError('Target status is required.', 400);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  validateOrderStatusTransition(order.status, status.trim());
  order.status = status.trim();
  await order.save();

  const populatedOrder = await Order.findById(order._id).populate('createdBy', 'name role');
  res.status(200).json({ success: true, order: populatedOrder });
});

export const recordOrderPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid order ID.', 400);
  }

  const { paymentMethod } = req.body || {};
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new AppError(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}.`, 400);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (order.paymentStatus === 'Paid') {
    throw new AppError('Payment has already been recorded for this order.', 400);
  }

  order.paymentMethod = paymentMethod;
  order.paymentStatus = 'Paid';
  order.paidAt = new Date();
  await order.save();

  const populatedOrder = await Order.findById(order._id).populate('createdBy', 'name role');
  res.status(200).json({ success: true, order: populatedOrder });
});
