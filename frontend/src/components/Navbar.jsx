'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, ShoppingBag, UtensilsCrossed, ClipboardList } from 'lucide-react';
import { clearSession } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'New Order', icon: ShoppingBag },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
];

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-600 text-white text-sm">
              POS
            </span>
            <span>BistroPOS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 leading-none">{user.name}</p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                  user.role === 'Admin'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {user.role}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <nav className="md:hidden border-t border-slate-100 px-2 py-1.5 flex items-center justify-around bg-slate-50">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${
                active ? 'bg-orange-100 text-orange-700' : 'text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
