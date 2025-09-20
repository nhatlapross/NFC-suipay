'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, RefreshCw, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useSuiSwap } from '@/hooks/useSuiSwap';
import { SwapRequest } from '@/lib/sui-swap.service';

interface SwapInterfaceProps {
  onSwapSuccess?: (transactionDigest: string) => void;
}

export default function SwapInterface({ walletAddress, privateKey, onSwapSuccess }: SwapInterfaceProps) {
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('VND');
  const [error, setError] = useState<string>('');

  // Use SuiSwap hook
  const {
    exchangeRate,
    loadingRate,
    rateError,
    refreshRate,
    usdCoins,
    vndCoins,
    loadingCoins,
    coinsError,
    refreshCoins,
    poolStatus,
    loadingPool,
    poolError,
    refreshPool,
    executeSwap,
    swapLoading,
    swapError,
    totalUsdBalance,
    totalVndBalance
  } = useSuiSwap();

  // Calculate conversion
  const calculateConversion = (amount: string, from: string, to: string) => {
    if (!amount || !exchangeRate) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    let result = 0;
    if (from === 'USD' && to === 'VND') {
      result = numAmount * exchangeRate;
    } else if (from === 'VND' && to === 'USD') {
      result = numAmount / exchangeRate;
    }

    setToAmount(result.toFixed(2));
  };

  // Handle amount change
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    calculateConversion(value, fromCurrency, toCurrency);
  };

  // Handle currency change
  const handleFromCurrencyChange = (value: string) => {
    setFromCurrency(value);
    setToCurrency(value === 'USD' ? 'VND' : 'USD');
    calculateConversion(fromAmount, value, value === 'USD' ? 'VND' : 'USD');
  };

  // Handle swap currencies
  const handleSwapCurrencies = () => {
    const tempFrom = fromCurrency;
    const tempTo = toCurrency;
    const tempAmount = fromAmount;
    const tempToAmount = toAmount;

    setFromCurrency(tempTo);
    setToCurrency(tempFrom);
    setFromAmount(tempToAmount);
    setToAmount(tempAmount);
  };

  // Handle swap
  const handleSwap = async () => {
    if (!fromAmount || !toAmount || !walletAddress || !privateKey) {
      setError('Missing wallet address or private key');
      return;
    }
    
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    // Convert amount to smallest unit (6 decimals for both USD and VND)
    const amountInSmallestUnit = Math.floor(amount * 1000000);

    const swapRequest: SwapRequest = {
      fromAmount: amountInSmallestUnit,
      fromCurrency: fromCurrency as 'USD' | 'VND',
      toCurrency: toCurrency as 'USD' | 'VND',
      walletAddress,
      privateKey
    };

    const result = await executeSwap(swapRequest);
    
    if (result.success && result.transactionDigest) {
      setError('');
      onSwapSuccess?.(result.transactionDigest);
      // Clear form
      setFromAmount('');
      setToAmount('');
    } else {
      setError(result.error || 'Swap failed');
    }
  };

  // Load data on mount
  useEffect(() => {
    if (walletAddress) {
      refreshCoins(walletAddress);
    }
  }, [walletAddress, refreshCoins]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Swap VND/USD</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRate}
            disabled={loadingRate}
          >
            <RefreshCw className={`h-4 w-4 ${loadingRate ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Exchange Rate Display */}
        {exchangeRate && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <span className="font-medium">1 USD = </span>
              <span className="text-green-600 font-bold">
                {exchangeRate.toLocaleString()} VND
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Oracle
            </Badge>
          </div>
        )}

        {/* Wallet Balance Display */}
        {walletAddress && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Wallet Balance</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">USD:</span>
                <span className="ml-1 font-medium">{(totalUsdBalance / 1000000).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">VND:</span>
                <span className="ml-1 font-medium">{(totalVndBalance / 1000000).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(error || rateError || swapError) && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{error || rateError || swapError}</span>
          </div>
        )}

        {/* From Amount */}
        <div className="space-y-2">
          <Label htmlFor="from-amount">From</Label>
          <div className="flex gap-2">
            <Input
              id="from-amount"
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="flex-1"
            />
            <Select value={fromCurrency} onValueChange={handleFromCurrencyChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="VND">VND</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="rounded-full p-2"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Amount */}
        <div className="space-y-2">
          <Label htmlFor="to-amount">To</Label>
          <div className="flex gap-2">
            <Input
              id="to-amount"
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="flex-1 bg-muted"
            />
            <Select value={toCurrency} disabled>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || loadingRate || swapLoading || !walletAddress || !privateKey}
          className="w-full"
        >
          {(loadingRate || swapLoading) ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {swapLoading ? 'Swapping...' : `Swap ${fromAmount} ${fromCurrency} to ${toAmount} ${toCurrency}`}
        </Button>

        {/* Pool Status */}
        {poolStatus && (
          <div className="text-xs text-muted-foreground text-center">
            Pool: {(poolStatus.usdBalance / 1000000).toFixed(2)} USD, {(poolStatus.vndBalance / 1000000).toFixed(2)} VND
          </div>
        )}
      </CardContent>
    </Card>
  );
}
