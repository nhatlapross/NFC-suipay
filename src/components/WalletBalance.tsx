import React from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export default function WalletBalance() {
  const { wallet, loading } = useWallet();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Wallet className="w-5 h-5 text-gray-400" />
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Wallet className="w-5 h-5 text-blue-600" />
      <div>
        <p className="text-sm text-gray-600">Số dư</p>
        <p className="text-lg font-bold text-blue-600">
          {wallet?.balance || 0} SUI
        </p>
      </div>
    </div>
  );
}