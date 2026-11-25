import { Order } from '../models/Order.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { roundCurrency } from '../utils/billing.js';

function getDayRange(dateStr) {
  let targetDate;
  if (dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new AppError('Date query must use YYYY-MM-DD format.', 400);
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    targetDate = new Date(year, month - 1, day);
    if (
      targetDate.getFullYear() !== year ||
      targetDate.getMonth() !== month - 1 ||
      targetDate.getDate() !== day
    ) {
      throw new AppError('Invalid calendar date.', 400);
    }
  } else {
    targetDate = new Date();
  }

  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');

  return { dateLabel: `${y}-${m}-${d}`, start, end };
}

export const getDailySalesReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const { dateLabel, start, end } = getDayRange(
    typeof date === 'string' && date.trim() ? date.trim() : undefined
  );

  const todaysOrders = await Order.find({
    createdAt: { $gte: start, $lte: end },
  })
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 });

  let completedOrders = 0;
  let paidOrders = 0;
  let dailySales = 0;
  let unpaidAmount = 0;
  const paymentBreakdown = { Cash: 0, UPI: 0, Card: 0 };

  for (const order of todaysOrders) {
    if (order.status === 'Completed') completedOrders += 1;

    if (order.paymentStatus === 'Paid') {
      paidOrders += 1;
      dailySales += order.totalAmount;
      if (order.paymentMethod && paymentBreakdown[order.paymentMethod] !== undefined) {
        paymentBreakdown[order.paymentMethod] = roundCurrency(
          paymentBreakdown[order.paymentMethod] + order.totalAmount
        );
      }
    } else {
      unpaidAmount += order.totalAmount;
    }
  }

  res.status(200).json({
    success: true,
    summary: {
      date: dateLabel,
      totalOrders: todaysOrders.length,
      completedOrders,
      activeOrders: todaysOrders.length - completedOrders,
      paidOrders,
      dailySales: roundCurrency(dailySales),
      unpaidAmount: roundCurrency(unpaidAmount),
      paymentBreakdown,
      recentOrders: todaysOrders.slice(0, 8),
    },
  });
});
