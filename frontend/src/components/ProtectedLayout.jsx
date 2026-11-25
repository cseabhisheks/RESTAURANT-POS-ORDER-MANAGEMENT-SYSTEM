'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { clearSession, getStoredUser, getToken, saveSession } from '@/lib/auth';
import Navbar from './Navbar';

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function verifyAuth() {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const cachedUser = getStoredUser();
      if (cachedUser && mounted) {
        setUser(cachedUser);
      }

      try {
        const res = await apiRequest('/auth/me');
        if (mounted) {
          saveSession(token, res.user);
          setUser(res.user);
          setChecking(false);
        }
      } catch {
        clearSession();
        if (mounted) {
          router.replace('/login');
        }
      }
    }

    verifyAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500 font-medium">Loading POS workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {typeof children === 'function' ? children(user) : children}
      </main>
    </div>
  );
}
