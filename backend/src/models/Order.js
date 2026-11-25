import mongoose from 'mongoose';
import { ORDER_STATUSES } from '../utils/orderWorkflow.js';

export const ORDER_TYPES = ['Dine-In', 'Takeaway'];
export const PAYMENT_STATUSES = ['Unpaid', 'Paid'];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card'];

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    orderType: { type: String, enum: ORDER_TYPES, required: [true, 'Order type is required'] },
    tableNumber: { type: String, default: '', trim: true, maxlength: 20 },
    customerName: { type: String, default: '', trim: true, maxlength: 80 },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    taxRatePercent: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Unpaid' },
    paymentMethod: { type: String, enum: [...PAYMENT_METHODS, null], default: null },
    paidAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
