'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
// Real integration can use getPaymentHistoryAPI from lib when available

type Tx = {
  id: string;
  customer: string;
  amount: number;
  status: 'success' | 'failed';
};

export default function MerchantRecentTransactions() {
  const { data } = useQuery({
    queryKey: ['merchant:recentTx'],
    queryFn: async (): Promise<Tx[]> => {
      // Placeholder dataset; replace with payment history integration
      return [
        { id: 'TXN_001', customer: 'John Doe', amount: 45.5, status: 'success' },
        { id: 'TXN_002', customer: 'Jane Smith', amount: 120.75, status: 'success' },
        { id: 'TXN_003', customer: 'Mike Johnson', amount: 67.2, status: 'failed' },
      ];
    },
  });

  return (
    <div className="bg-white border border-gray-900 rounded-md shadow-sm">
      <div className="px-4 py-3 border-b border-gray-900 flex items-center justify-between">
        <div className="text-xs font-bold text-gray-800">RECENT TRANSACTIONS</div>
        <Link href="/history" className="text-xs px-2 py-1 border border-gray-900 rounded-sm">
          VIEW ALL
        </Link>
      </div>
      <ul className="divide-y divide-gray-200">
        {data?.map((tx) => (
          <li key={tx.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-sm border border-gray-900 flex items-center justify-center ${tx.status === 'success' ? 'bg-[#00e5ff]' : 'bg-[#ff007f]'}`}></div>
              <div>
                <div className="text-xs font-semibold">{tx.id}</div>
                <div className="text-[11px] text-gray-500">{tx.customer}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold">{tx.amount.toFixed(2)} SUI</div>
              <div className={`text-[10px] uppercase ${tx.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.status === 'success' ? 'Success' : 'Failed'}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


