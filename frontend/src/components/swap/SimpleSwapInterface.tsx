'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, RefreshCw, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from '@/config/sui';
import { suiSwapService } from '@/lib/sui-swap.service';

interface SimpleSwapInterfaceProps {
  onSwapSuccess?: (transactionDigest: string) => void;
}

export default function SimpleSwapInterface({ onSwapSuccess }: SimpleSwapInterfaceProps) {
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('VND');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending: isExecuting } = useSignAndExecuteTransaction();

  // Fetch exchange rate from oracle
  const fetchExchangeRate = useCallback(async () => {
    try {
      const oracleObject = await client.getObject({
        id: SUI_CONFIG.ORACLE_OBJECT_ID,
        options: { showContent: true }
      });

      const content = oracleObject.data?.content;
      if (content && 'fields' in content) {
        const rate = parseInt((content as any).fields.value);
        setExchangeRate(rate);
        setError('');
      } else {
        setError('Could not fetch exchange rate from oracle');
      }
    } catch (err) {
      setError('Failed to fetch exchange rate');
    }
  }, [client]);

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
    if (!fromAmount || !toAmount || !account) {
      setError('Please connect your wallet first');
      return;
    }
    
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      // Convert amount to smallest unit (9 decimals for both USD and VND)
      const amountInSmallestUnit = Math.floor(amount * 1000000000);

      // Get user's coins
      const { usd, vnd } = await suiSwapService.getUserCoins(account.address);
      
      // Debug: Log actual balances
      console.log('Debug - USD coins:', usd);
      console.log('Debug - VND coins:', vnd);
      console.log('Debug - Amount requested:', amount, 'Amount in smallest unit:', amountInSmallestUnit);
      
      let coinId: string;
      if (fromCurrency === 'VND') {
        const totalVndBalance = vnd.reduce((sum, coin) => sum + coin.balance, 0);
        const availableVnd = totalVndBalance / 1000000000;
        console.log('Debug - Total VND balance:', totalVndBalance, 'Available VND:', availableVnd);
        
        if (totalVndBalance < amountInSmallestUnit) {
          setError(`Insufficient VND balance. Required: ${amount}, Available: ${availableVnd.toFixed(6)}`);
          return;
        }
        
        const vndCoin = vnd.find(coin => coin.balance >= amountInSmallestUnit);
        if (!vndCoin) {
          setError(`No VND coin found with sufficient balance`);
          return;
        }
        coinId = vndCoin.coinId;
      } else {
        const totalUsdBalance = usd.reduce((sum, coin) => sum + coin.balance, 0);
        const availableUsd = totalUsdBalance / 1000000000;
        console.log('Debug - Total USD balance:', totalUsdBalance, 'Available USD:', availableUsd);
        
        if (totalUsdBalance < amountInSmallestUnit) {
          setError(`Insufficient USD balance. Required: ${amount}, Available: ${availableUsd.toFixed(6)}`);
          return;
        }
        
        const usdCoin = usd.find(coin => coin.balance >= amountInSmallestUnit);
        if (!usdCoin) {
          setError(`No USD coin found with sufficient balance`);
          return;
        }
        coinId = usdCoin.coinId;
      }

      // Create transaction with exact amount
      const tx = suiSwapService.createSwapTransaction({
        fromAmount: amountInSmallestUnit,
        fromCurrency: fromCurrency as 'USD' | 'VND',
        toCurrency: toCurrency as 'USD' | 'VND'
      }, coinId);

      // Execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            setError('');
            onSwapSuccess?.(result.digest);
            // Clear form
            setFromAmount('');
            setToAmount('');
          },
          onError: (error) => {
            setError(error.message || 'Swap failed');
          },
        }
      );
    } catch (error: any) {
      setError(error.message || 'Swap failed');
    }
  };

  // Load exchange rate on mount
  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Swap VND/USD</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchExchangeRate}
          >
            <RefreshCw className="h-4 w-4" />
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

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
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
          disabled={!fromAmount || !toAmount || isExecuting}
          className="w-full"
        >
          {isExecuting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {isExecuting ? 'Swapping...' : `Swap ${fromAmount} ${fromCurrency} to ${toAmount} ${toCurrency}`}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          Connect your wallet to start swapping
        </div>
      </CardContent>
    </Card>
  );
}
