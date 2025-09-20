'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUpDown, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface SwapTransaction {
  id: string;
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  transactionHash?: string;
}

interface SwapHistoryProps {
  className?: string;
}

export default function SwapHistory({ className }: SwapHistoryProps) {
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Mock data for demonstration
  const mockTransactions: SwapTransaction[] = [
    {
      id: 'swap_001',
      fromAmount: 100,
      fromCurrency: 'USD',
      toAmount: 2639300,
      toCurrency: 'VND',
      rate: 26393,
      status: 'completed',
      timestamp: Date.now() - 300000, // 5 minutes ago
      transactionHash: '0x1234...5678'
    },
    {
      id: 'swap_002',
      fromAmount: 5000000,
      fromCurrency: 'VND',
      toAmount: 189.65,
      toCurrency: 'USD',
      rate: 26393,
      status: 'completed',
      timestamp: Date.now() - 900000, // 15 minutes ago
      transactionHash: '0x2345...6789'
    },
    {
      id: 'swap_003',
      fromAmount: 50,
      fromCurrency: 'USD',
      toAmount: 1319650,
      toCurrency: 'VND',
      rate: 26393,
      status: 'pending',
      timestamp: Date.now() - 60000, // 1 minute ago
    },
    {
      id: 'swap_004',
      fromAmount: 1000000,
      fromCurrency: 'VND',
      toAmount: 37.89,
      toCurrency: 'USD',
      rate: 26393,
      status: 'failed',
      timestamp: Date.now() - 1800000, // 30 minutes ago
    }
  ];

  // Fetch swap history
  const fetchSwapHistory = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/swap/history');
      // const data = await response.json();
      
      // For now, use mock data
      setTimeout(() => {
        setTransactions(mockTransactions);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch swap history');
      setLoading(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    fetchSwapHistory();
  }, []);

  // Format amount with currency
  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'VND') {
      return `${amount.toLocaleString()} VND`;
    }
    return `${amount.toFixed(2)} USD`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Swap History
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSwapHistory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="text-center text-red-500 py-4">
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSwapHistory}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No swap transactions yet</p>
            <p className="text-sm">Start swapping to see your history here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {formatAmount(tx.fromAmount, tx.fromCurrency)} → {formatAmount(tx.toAmount, tx.toCurrency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rate: 1 {tx.fromCurrency} = {tx.rate.toLocaleString()} {tx.toCurrency}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(tx.status)}
                  {tx.transactionHash && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {tx.transactionHash.slice(0, 8)}...{tx.transactionHash.slice(-8)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
