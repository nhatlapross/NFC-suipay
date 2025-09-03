'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletContext';
import { Home, CreditCard, LayoutDashboard, Clock, Settings, LogOut, Wallet } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { wallet } = useWalletContext();

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  // Don't show navigation if user is not logged in or on auth page
  if (!user || pathname === '/auth') {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/payment', label: 'Thanh toán', icon: CreditCard },
    { href: '/history', label: 'Lịch sử', icon: Clock },
    { href: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl">NFC Payment</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Wallet Balance */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {wallet?.balance?.toFixed(4) || '0.0000'} SUI
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 hidden md:inline">
                Xin chào, {user.fullName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}