'use client';

import { useCallback, useEffect, useState } from 'react';
import { Printer, RefreshCw, Search } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout';
import ReceiptModal from '@/components/ReceiptModal';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';

const STATUS_FILTERS = ['All', 'Pending', 'Preparing', 'Ready', 'Completed'];
const NEXT_STATUS = {
  Pending: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Completed',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [paymentChoice, setPaymentChoice] = useState({});
  const [receiptOrder, setReceiptOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const data = await apiRequest(`/orders?${params.toString()}`);
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleAdvanceStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setBusyId(order._id);
    setError('');
    setMessage('');
    try {
      const data = await apiRequest(`/orders/${order._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? data.order : o))
      );
      setMessage(`Order ${order.orderNumber} moved to ${nextStatus}.`);
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    } finally {
      setBusyId('');
    }
  };

  const handleRecordPayment = async (order) => {
    const method = paymentChoice[order._id] || 'Cash';
    setBusyId(order._id);
    setError('');
    setMessage('');
    try {
      const data = await apiRequest(`/orders/${order._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod: method }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? data.order : o))
      );
      setMessage(
        `Recorded ${method} payment for ${order.orderNumber} (${formatCurrency(order.totalAmount)}).`
      );
    } catch (err) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Orders & Billing</h1>
            <p className="text-sm text-slate-500">
              Track kitchen workflow, record payments, and print receipts
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 self-start px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, table, guest..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {message && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            No orders found for the current filter.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const nextStatus = NEXT_STATUS[order.status];
              const isBusy = busyId === order._id;

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge
                          status={order.paymentStatus}
                          method={order.paymentMethod}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {order.orderType}
                        {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                        {order.customerName ? ` · ${order.customerName}` : ''} ·{' '}
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Sub {formatCurrency(order.subtotal)} · Tax{' '}
                        {formatCurrency(order.taxAmount)}
                        {order.discountAmount > 0
                          ? ` · Disc -${formatCurrency(order.discountAmount)}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <span
                        key={`${item.menuItem}-${idx}`}
                        className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md"
                      >
                        {item.quantity}× {item.name} ({formatCurrency(item.lineTotal)})
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {nextStatus && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAdvanceStatus(order)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
                        >
                          Move to {nextStatus}
                        </button>
                      )}

                      {order.paymentStatus === 'Unpaid' && (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={paymentChoice[order._id] || 'Cash'}
                            onChange={(e) =>
                              setPaymentChoice((prev) => ({
                                ...prev,
                                [order._id]: e.target.value,
                              }))
                            }
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                          >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                          </select>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRecordPayment(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setReceiptOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Bill
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </ProtectedLayout>
  );
}
