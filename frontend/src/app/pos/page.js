'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Search, Trash2 } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout';
import ReceiptModal from '@/components/ReceiptModal';
import { apiRequest, CLIENT_TAX_RATE } from '@/lib/api';
import { formatCurrency, roundCurrency } from '@/lib/format';

const CATEGORIES = ['All', 'Starters', 'Mains', 'Sides', 'Beverages', 'Desserts'];

export default function PosOrderPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState('');

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const [orderType, setOrderType] = useState('Dine-In');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountInput, setDiscountInput] = useState('0');
  const [cart, setCart] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    async function fetchMenu() {
      setLoadingMenu(true);
      setMenuError('');
      try {
        const data = await apiRequest('/menu');
        setMenuItems(data.items || []);
      } catch (err) {
        setMenuError(err.message || 'Failed to load menu items.');
      } finally {
        setLoadingMenu(false);
      }
    }
    fetchMenu();
  }, []);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, category, search]);

  const addToCart = (item) => {
    if (!item.isAvailable) return;
    setSubmitError('');
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item._id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const subtotal = useMemo(
    () =>
      roundCurrency(
        cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      ),
    [cart]
  );

  const parsedDiscount = Number(discountInput);
  const validDiscount =
    Number.isFinite(parsedDiscount) && parsedDiscount >= 0 ? parsedDiscount : 0;
  const taxableAmount = Math.max(0, roundCurrency(subtotal - validDiscount));
  const taxAmount = roundCurrency((taxableAmount * CLIENT_TAX_RATE) / 100);
  const previewTotal = roundCurrency(taxableAmount + taxAmount);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setCreatedOrder(null);

    if (cart.length === 0) {
      setSubmitError('Please add at least one item to the order.');
      return;
    }

    if (orderType === 'Dine-In' && !tableNumber.trim()) {
      setSubmitError('Please enter a table number for Dine-In orders.');
      return;
    }

    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
      setSubmitError('Discount must be a valid non-negative number.');
      return;
    }

    if (parsedDiscount > subtotal) {
      setSubmitError('Discount cannot exceed the order subtotal.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        orderType,
        tableNumber: orderType === 'Dine-In' ? tableNumber.trim() : '',
        customerName: customerName.trim(),
        discountAmount: roundCurrency(parsedDiscount),
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
        })),
      };

      const data = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreatedOrder(data.order);
      setCart([]);
      setTableNumber('');
      setCustomerName('');
      setDiscountInput('0');
    } catch (err) {
      setSubmitError(err.message || 'Could not create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Menu Selection */}
        <section className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    category === cat
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {menuError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
              {menuError}
            </div>
          )}

          {loadingMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              No menu items match your filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredMenu.map((item) => (
                <div
                  key={item._id}
                  className={`bg-white rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                    item.isAvailable
                      ? 'border-slate-200 hover:border-orange-300'
                      : 'border-slate-200 bg-slate-50 opacity-65'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {item.name}
                      </h3>
                      <span className="font-bold text-slate-900 text-sm shrink-0">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.category}
                      {item.description ? ` · ${item.description}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>

                    <button
                      type="button"
                      disabled={!item.isAvailable}
                      onClick={() => addToCart(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Current Order & Bill */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 lg:sticky lg:top-22">
          <h2 className="text-lg font-bold text-slate-900">Current Order</h2>

          {createdOrder && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-sm text-emerald-800 space-y-2">
              <p className="font-semibold">
                Order {createdOrder.orderNumber} created!
              </p>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setReceiptOrder(createdOrder)}
                  className="font-semibold underline cursor-pointer"
                >
                  Print Bill
                </button>
                <Link href="/orders" className="font-semibold underline">
                  Go to Orders
                </Link>
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-2">
              {['Dine-In', 'Takeaway'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition cursor-pointer ${
                    orderType === type
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {orderType === 'Dine-In' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. T-04"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className={orderType === 'Takeaway' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Customer Name (optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-3 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Cart is empty. Add items from the menu.
                </p>
              ) : (
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li
                      key={item.menuItemId}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(item.unitPrice)} × {item.quantity} ={' '}
                          <span className="font-medium text-slate-700">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="w-7 h-7 rounded-md text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Discount Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>-{formatCurrency(validDiscount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({CLIENT_TAX_RATE}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Estimated Total</span>
                <span>{formatCurrency(previewTotal)}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Final bill is verified and calculated by the server.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition cursor-pointer"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </section>
      </div>

      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </ProtectedLayout>
  );
}
