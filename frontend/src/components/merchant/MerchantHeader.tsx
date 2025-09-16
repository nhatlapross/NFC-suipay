'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';

interface MerchantHeaderProps {
  containerClassName?: string;
}

export default function MerchantHeader({ containerClassName = 'max-w-7xl' }: MerchantHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-[#ff005c]">
      <div className={`relative ${containerClassName} mx-auto px-8 py-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <a href="/" className="bg-black p-2 rounded block">
            <img src="/panda.jpg" alt="Merchant Logo" className="h-12 w-12 object-cover rounded" />
          </a>
          <div>
            <div className="text-white font-bold text-3xl">MERCHANT</div>
            <div className="text-white text-xl">TERMINAL</div>
          </div>
        </div>
        <button onClick={() => setMenuOpen((v) => !v)} className="bg-black p-2 rounded block">
          <Menu className="h-6 w-6 text-white" />
        </button>

        {menuOpen && (
          <div className="absolute top-full right-8 mt-3 w-64 bg-white border-2 border-black shadow-xl z-50">
            <div className="p-2 border-b-2 border-black text-sm font-bold text-gray-700 uppercase">Quick Navigate</div>
            <nav className="p-2 space-y-2">
              <a href="/merchant/nfc" onClick={() => setMenuOpen(false)} className="block px-3 py-2 border border-black hover:bg-gray-50">NFC Payment</a>
              <a href="/payment" onClick={() => setMenuOpen(false)} className="block px-3 py-2 border border-black hover:bg-gray-50">QR Payment</a>
              <a href="/history" onClick={() => setMenuOpen(false)} className="block px-3 py-2 border border-black hover:bg-gray-50">Transactions</a>
              <a href="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2 border border-black hover:bg-gray-50">Profile / Settings</a>
              <a href="/merchant" onClick={() => setMenuOpen(false)} className="block px-3 py-2 border border-black hover:bg-gray-50">Back to Merchant</a>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}


