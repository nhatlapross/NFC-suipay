'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Globe } from 'lucide-react';

interface ExchangeRate {
  usdToVnd: number;
  vndToUsd: number;
  timestamp: number;
  source: string;
  formatted: {
    usdToVnd: string;
    vndToUsd: string;
  };
}

interface RateDisplayProps {
  className?: string;
}

export default function RateDisplay({ className }: RateDisplayProps) {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch exchange rate
  const fetchExchangeRate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'}/oracle/rate`);
      const data = await response.json();
      
      if (data.success) {
        setExchangeRate(data.data);
        setLastUpdate(new Date());
        setError('');
      } else {
        setError('Failed to fetch exchange rate');
      }
    } catch (err) {
      setError('Network error - Please check if backend is running');
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Get trend indicator
  const getTrendIcon = () => {
    // This would need historical data to determine trend
    // For now, just show a neutral trend
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Exchange Rate
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchExchangeRate}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error ? (
          <div className="text-center text-red-500 py-4">
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExchangeRate}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : exchangeRate ? (
          <>
            {/* Main Rate Display */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {exchangeRate.formatted.usdToVnd} VND
              </div>
              <div className="text-sm text-muted-foreground">
                per 1 USD
              </div>
            </div>

            {/* Rate Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">USD → VND</div>
                <div className="text-lg font-bold text-green-600">
                  {exchangeRate.formatted.usdToVnd}
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">VND → USD</div>
                <div className="text-lg font-bold text-blue-600">
                  {exchangeRate.formatted.vndToUsd}
                </div>
              </div>
            </div>

            {/* Source and Timestamp */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {exchangeRate.source}
                </Badge>
                {getTrendIcon()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {getTimeAgo(exchangeRate.timestamp)}
              </div>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-xs text-center text-muted-foreground">
                Last updated: {lastUpdate.toLocaleString()}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
