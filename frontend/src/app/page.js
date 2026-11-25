'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
      Redirecting...
    </div>
  );
}
