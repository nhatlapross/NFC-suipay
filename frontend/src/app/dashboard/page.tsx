'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletContext';
import { getUserCardsAPI, getPaymentHistoryAPI } from '@/lib/api-client';
import TransactionHistory from '@/components/TransactionHistory';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, CreditCard, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, refreshBalance, createWallet } = useWalletContext();
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    todayCount: 0,
    monthlySpent: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load user cards
      try {
        const cardsResponse = await getUserCardsAPI();
        if (cardsResponse.success) {
          setCards(cardsResponse.cards || []);
        }
      } catch (err) {
        console.warn('Failed to load cards:', err);
      }

      // Load transactions
      try {
        const transactionsResponse = await getPaymentHistoryAPI({ limit: 10 });
        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.transactions || []);
          
          // Calculate stats
          const today = new Date().toDateString();
          const thisMonth = new Date().getMonth();
          
          const todayTransactions = transactionsResponse.transactions?.filter((tx: any) => 
            new Date(tx.createdAt).toDateString() === today
          ) || [];
          
          const monthlyTransactions = transactionsResponse.transactions?.filter((tx: any) => 
            new Date(tx.createdAt).getMonth() === thisMonth
          ) || [];
          
          setStats({
            totalSpent: monthlyTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0),
            todayCount: todayTransactions.length,
            monthlySpent: monthlyTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)
          });
        }
      } catch (err) {
        console.warn('Failed to load transactions:', err);
      }

      // Refresh wallet balance
      try {
        await refreshBalance();
      } catch (err) {
        console.warn('Failed to refresh wallet balance:', err);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      await createWallet();
      await refreshBalance();
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  // Generate chart data from transactions
  const chartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        name: days[date.getDay()],
        amount: 0,
        date: date.toDateString()
      };
    });

    // Calculate daily spending from transactions
    transactions.forEach((tx: any) => {
      const txDate = new Date(tx.createdAt).toDateString();
      const dayData = last7Days.find(day => day.date === txDate);
      if (dayData) {
        dayData.amount += tx.amount || 0;
      }
    });

    return last7Days.map(({ name, amount }) => ({ name, amount }));
  }, [transactions]);

  if (loading || walletLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Đang tải dữ liệu...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h1>
          <a href="/auth" className="text-blue-600 hover:text-blue-500">
            Đi đến trang đăng nhập
          </a>
        </div>
      </div>
    );
  }

  // Handle case where user doesn't have a wallet yet
  if (!wallet && !walletLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Chào mừng đến với NFC Payment</h1>
          <p className="text-gray-600 mb-8">Bạn cần tạo ví để bắt đầu sử dụng dịch vụ</p>
          <button
            onClick={handleCreateWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Tạo ví mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-green-600 font-semibold">+12.5%</span>
          </div>
          <p className="text-2xl font-bold">{wallet?.balance || 0} SUI</p>
          <p className="text-gray-600 text-sm">Số dư hiện tại</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-sm text-green-600 font-semibold">+8.2%</span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalSpent || 0} SUI</p>
          <p className="text-gray-600 text-sm">Tổng chi tiêu tháng</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-purple-600" />
            <span className="text-sm text-gray-600">Active</span>
          </div>
          <p className="text-2xl font-bold">1</p>
          <p className="text-gray-600 text-sm">Thẻ NFC</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-orange-600" />
            <span className="text-sm text-blue-600 font-semibold">Today</span>
          </div>
          <p className="text-2xl font-bold">{stats?.todayCount || 0}</p>
          <p className="text-gray-600 text-sm">Giao dịch hôm nay</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Chi tiêu tuần này</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Giao dịch gần đây</h2>
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}