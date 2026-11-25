'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, IndianRupee, Plus, Receipt, ShoppingBag } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout';
import ReceiptModal from '@/components/ReceiptModal';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';

function getTodayInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DashboardPage() {
  const [date, setDate] = useState(getTodayInputValue);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadSummary = useCallback(async (selectedDate) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/reports/daily-sales?date=${selectedDate}`);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message || 'Failed to load daily sales summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(date);
  }, [date, loadSummary]);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Sales Dashboard</h1>
            <p className="text-sm text-slate-500">
              Overview of orders, completed tickets, and collected revenue
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Order
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadSummary(date)}
              className="font-medium underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse p-5"
              />
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between text-slate-500 text-sm">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {summary.totalOrders}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Active in kitchen: {summary.activeOrders}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between text-slate-500 text-sm">
                  <span>Completed Orders</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {summary.completedOrders}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Paid tickets: {summary.paidOrders}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between text-slate-500 text-sm">
                  <span>Daily Sales (Paid)</span>
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(summary.dailySales)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Cash {formatCurrency(summary.paymentBreakdown.Cash)} · UPI{' '}
                  {formatCurrency(summary.paymentBreakdown.UPI)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between text-slate-500 text-sm">
                  <span>Unpaid Bills</span>
                  <Receipt className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {formatCurrency(summary.unpaidAmount)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Card collected: {formatCurrency(summary.paymentBreakdown.Card)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  Recent Orders ({summary.date})
                </h2>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Manage all orders →
                </Link>
              </div>

              {summary.recentOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No orders recorded for {summary.date}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="text-left px-5 py-3">Order #</th>
                        <th className="text-left px-5 py-3">Type</th>
                        <th className="text-left px-5 py-3">Items</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-left px-5 py-3">Payment</th>
                        <th className="text-right px-5 py-3">Total</th>
                        <th className="text-right px-5 py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900">
                            <div>{order.orderNumber}</div>
                            <div className="text-xs text-slate-400">
                              {formatDateTime(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-700">
                            {order.orderType}
                            {order.tableNumber ? ` (${order.tableNumber})` : ''}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                          </td>
                          <td className="px-5 py-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-5 py-3">
                            <PaymentStatusBadge
                              status={order.paymentStatus}
                              method={order.paymentMethod}
                            />
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="text-xs font-medium text-orange-600 hover:underline cursor-pointer"
                            >
                              View Bill
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      <ReceiptModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </ProtectedLayout>
  );
}
