'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { getToken, saveSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      saveSession(data.token, data.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setError('');
    if (role === 'Admin') {
      setEmail('admin@pos.local');
      setPassword('Admin@123');
    } else {
      setEmail('staff@pos.local');
      setPassword('Staff@123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-600 text-white font-bold text-lg mb-3">
            POS
          </div>
          <h1 className="text-2xl font-bold text-slate-900">BistroPOS Sign In</h1>
          <p className="text-sm text-slate-500 mt-1">
            Restaurant Order & Billing Management
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@pos.local"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Quick Demo Credentials (after seeding DB):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('Admin')}
              className="text-xs py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
            >
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('Staff')}
              className="text-xs py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
            >
              Fill Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
