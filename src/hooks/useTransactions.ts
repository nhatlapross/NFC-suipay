import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@/types';
import { getTransactionsAPI } from '@/lib/api-client';

export function useTransactions(userId?: string) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => getTransactionsAPI(userId),
    enabled: !!userId,
  });

  const stats = {
    totalSpent: transactions
      .filter((tx: Transaction) => tx.type === 'payment' && tx.status === 'completed')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0),
    todayCount: transactions
      .filter((tx: Transaction) => {
        const today = new Date().toDateString();
        const txDate = new Date(tx.createdAt).toDateString();
        return today === txDate;
      }).length,
  };

  return {
    transactions,
    isLoading,
    stats,
  };
}