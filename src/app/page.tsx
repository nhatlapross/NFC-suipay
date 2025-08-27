'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Shield, Zap, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          NFC Payment với Sui Blockchain
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Thanh toán nhanh chóng, an toàn và chi phí thấp
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/payment">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
              Bắt đầu thanh toán
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-8 py-4 bg-white text-gray-800 rounded-lg font-semibold hover:shadow-lg border border-gray-200">
              Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
          <CreditCard className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Thanh toán NFC</h3>
          <p className="text-gray-600">Chạm thẻ để thanh toán nhanh chóng</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
          <Shield className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Bảo mật cao</h3>
          <p className="text-gray-600">Private key được mã hóa an toàn</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
          <Zap className="w-12 h-12 text-yellow-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Siêu nhanh</h3>
          <p className="text-gray-600">Giao dịch hoàn tất trong 2 giây</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
          <DollarSign className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chi phí thấp</h3>
          <p className="text-gray-600">Gas fee chỉ ~0.001 SUI</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Thống kê hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">1,234</p>
            <p className="text-gray-600">Người dùng</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">5,678</p>
            <p className="text-gray-600">Giao dịch</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">12,345 SUI</p>
            <p className="text-gray-600">Tổng khối lượng</p>
          </div>
        </div>
      </div>
    </div>
  );
}