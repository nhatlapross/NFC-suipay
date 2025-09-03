'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/contexts/AuthContext';
import TransactionHistory from '@/components/TransactionHistory';
import { Calendar, Download, Filter } from 'lucide-react';

export default function HistoryPage() {
  const { user } = useAuth();
  const { transactions, isLoading } = useTransactions(user?.id);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredTransactions = transactions.filter((tx:any) => {
    if (filter !== 'all' && tx.type !== filter) return false;
    
    if (dateRange.start) {
      const txDate = new Date(tx.createdAt);
      const startDate = new Date(dateRange.start);
      if (txDate < startDate) return false;
    }
    
    if (dateRange.end) {
      const txDate = new Date(tx.createdAt);
      const endDate = new Date(dateRange.end);
      if (txDate > endDate) return false;
    }
    
    return true;
  });

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Status', 'TX Hash'],
      ...filteredTransactions.map((tx:any) => [
        new Date(tx.createdAt).toLocaleDateString('vi-VN'),
        tx.type,
        tx.amount.toString(),
        tx.status,
        tx.txHash,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lịch sử giao dịch</h1>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="payment">Thanh toán</option>
              <option value="topup">Nạp tiền</option>
              <option value="withdraw">Rút tiền</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span>đến</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Transactions */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : (
          <TransactionHistory transactions={filteredTransactions} />
        )}
      </div>
    </div>
  );
}