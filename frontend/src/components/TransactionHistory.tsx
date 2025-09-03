import React from 'react';
import { Transaction } from '@/types';
import { CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'topup':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chưa có giao dịch nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
          <div className="flex items-center space-x-3">
            {getTypeIcon(tx.type)}
            <div>
              <p className="font-medium">
                {tx.type === 'payment' ? 'Thanh toán' : 'Nạp tiền'}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-bold">
                {tx.type === 'payment' ? '-' : '+'}{tx.amount} SUI
              </p>
              <p className="text-xs text-gray-500">
                Gas: {tx.gasFee} SUI
              </p>
            </div>
            {getStatusIcon(tx.status)}
          </div>
        </div>
      ))}
    </div>
  );
}