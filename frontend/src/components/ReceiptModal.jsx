'use client';

import { Printer, X } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/format';

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="printable-receipt bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between border-b border-dashed border-slate-300 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">BistroPOS</h2>
            <p className="text-xs text-slate-500">Tax Invoice / Order Receipt</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="no-print text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 text-xs text-slate-600 space-y-1 border-b border-dashed border-slate-300">
          <div className="flex justify-between">
            <span>Order #</span>
            <span className="font-semibold text-slate-900">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Type</span>
            <span>
              {order.orderType}
              {order.tableNumber ? ` (Table ${order.tableNumber})` : ''}
            </span>
          </div>
          {order.customerName && (
            <div className="flex justify-between">
              <span>Customer</span>
              <span>{order.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Payment</span>
            <span>
              {order.paymentStatus}
              {order.paymentMethod ? ` via ${order.paymentMethod}` : ''}
            </span>
          </div>
        </div>

        <table className="w-full text-xs my-3">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="text-left py-1.5 font-medium">Item</th>
              <th className="text-center py-1.5 font-medium">Qty</th>
              <th className="text-right py-1.5 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <tr key={`${item.menuItem}-${idx}`}>
                <td className="py-1.5 text-slate-800">
                  <div>{item.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {formatCurrency(item.unitPrice)} each
                  </div>
                </td>
                <td className="py-1.5 text-center text-slate-700">{item.quantity}</td>
                <td className="py-1.5 text-right font-medium text-slate-900">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tax ({order.taxRatePercent}%)</span>
            <span>{formatCurrency(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Thank you for dining with us!
        </p>

        <div className="no-print mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
