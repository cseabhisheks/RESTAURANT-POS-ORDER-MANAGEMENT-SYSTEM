'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, ShieldAlert } from 'lucide-react';
import ProtectedLayout from '@/components/ProtectedLayout';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

const CATEGORIES = ['Starters', 'Mains', 'Sides', 'Beverages', 'Desserts'];
const EMPTY_FORM = {
  name: '',
  category: 'Mains',
  price: '',
  description: '',
  isAvailable: true,
};

function MenuManagementContent({ user }) {
  const isAdmin = user?.role === 'Admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());

      const data = await apiRequest(`/menu?${params.toString()}`);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load menu.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      description: item.description || '',
      isAvailable: item.isAvailable,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setFormError('');
    setFeedback('');

    const trimmedName = form.name.trim();
    const numericPrice = Number(form.price);

    if (trimmedName.length < 2) {
      setFormError('Item name must be at least 2 characters.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setFormError('Price must be a valid non-negative number.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        category: form.category,
        price: numericPrice,
        description: form.description.trim(),
        isAvailable: form.isAvailable,
      };

      if (editingId) {
        const data = await apiRequest(`/menu/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setItems((prev) =>
          prev.map((item) => (item._id === editingId ? data.item : item))
        );
        setFeedback(`Updated "${data.item.name}".`);
      } else {
        const data = await apiRequest('/menu', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setItems((prev) => [...prev, data.item]);
        setFeedback(`Added "${data.item.name}" to the menu.`);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message || 'Failed to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    setError('');
    setFeedback('');
    try {
      const data = await apiRequest(`/menu/${item._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      setItems((prev) =>
        prev.map((m) => (m._id === item._id ? data.item : m))
      );
      setFeedback(
        `"${data.item.name}" marked as ${data.item.isAvailable ? 'Available' : 'Unavailable'}.`
      );
    } catch (err) {
      setError(err.message || 'Failed to update availability.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-sm text-slate-500">
            Browse dishes, filter by category, and manage availability
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 self-start bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            You are signed in as <strong>Staff</strong>. Menu creation, editing,
            and deactivation require Admin access.
          </span>
        </div>
      )}

      {feedback && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          {feedback}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      {showForm && isAdmin && (
        <form
          onSubmit={handleSaveItem}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          noValidate
        >
          <h2 className="font-semibold text-slate-900">
            {editingId ? 'Edit Menu Item' : 'New Menu Item'}
          </h2>

          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Masala Chai"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="150"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the dish"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) =>
                setForm({ ...form, isAvailable: e.target.checked })
              }
              className="rounded border-slate-300"
            />
            Item is available for ordering
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
            >
              {saving ? 'Saving...' : editingId ? 'Update Item' : 'Create Item'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          No menu items found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Item</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-right px-5 py-3">Price</th>
                  <th className="text-center px-5 py-3">Status</th>
                  {isAdmin && <th className="text-right px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-slate-400">{item.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{item.category}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                            item.isAvailable
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {item.isAvailable ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <ProtectedLayout>
      {(user) => <MenuManagementContent user={user} />}
    </ProtectedLayout>
  );
}
