'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG } from '@/config/sui';
import { suiMintService } from '@/lib/sui-mint.service';
import { suiSwapService } from '@/lib/sui-swap.service';
import { Coins, RefreshCw } from 'lucide-react';

export default function MintTokens() {
  const [usdAmount, setUsdAmount] = useState('10');
  const [vndAmount, setVndAmount] = useState('1000000');
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending: isExecuting } = useSignAndExecuteTransaction();

  const handleMintUSD = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(usdAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsMinting(true);
    setError('');

    try {
      // Convert to smallest unit (6 decimals)
      const amountInSmallestUnit = Math.floor(amount * 1000000);

      // Create mint transaction using SuiMintService
      const result = await suiMintService.mintUsd(amountInSmallestUnit, account.address, '');
      
      if (result.success) {
        setSuccess(`Successfully minted ${amount} USD! Transaction: ${result.transactionDigest}`);
        setError('');
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(`Failed to mint USD: ${result.error}`);
      }
    } catch (error: any) {
      setError(`Failed to mint USD: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const handleMintVND = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(vndAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsMinting(true);
    setError('');

    try {
      // Convert to smallest unit (6 decimals)
      const amountInSmallestUnit = Math.floor(amount * 1000000);

      // Create mint transaction using SuiMintService
      const result = await suiMintService.mintVnd(amountInSmallestUnit, account.address, '');
      
      if (result.success) {
        setSuccess(`Successfully minted ${amount.toLocaleString()} VND! Transaction: ${result.transactionDigest}`);
        setError('');
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(`Failed to mint VND: ${result.error}`);
      }
    } catch (error: any) {
      setError(`Failed to mint VND: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const handleRefreshBalances = async () => {
    if (!account) return;

    try {
      const { usd, vnd } = await suiSwapService.getUserCoins(account.address);
      const totalUSD = usd.reduce((sum, coin) => sum + coin.balance, 0) / 1000000;
      const totalVND = vnd.reduce((sum, coin) => sum + coin.balance, 0) / 1000000;
      
      setSuccess(`Current balances: ${totalUSD.toFixed(2)} USD, ${totalVND.toLocaleString()} VND`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(`Failed to refresh balances: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Mint Tokens
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* USD Minting */}
        <div className="space-y-2">
          <Label htmlFor="usd-amount">USD Amount</Label>
          <div className="flex gap-2">
            <Input
              id="usd-amount"
              type="number"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              placeholder="10"
              min="0"
              step="0.01"
            />
            <Button
              onClick={handleMintUSD}
              disabled={isMinting || isExecuting}
              className="flex-1"
            >
              {isMinting || isExecuting ? 'Minting...' : 'Mint USD'}
            </Button>
          </div>
        </div>

        {/* VND Minting */}
        <div className="space-y-2">
          <Label htmlFor="vnd-amount">VND Amount</Label>
          <div className="flex gap-2">
            <Input
              id="vnd-amount"
              type="number"
              value={vndAmount}
              onChange={(e) => setVndAmount(e.target.value)}
              placeholder="1000000"
              min="0"
              step="1000"
            />
            <Button
              onClick={handleMintVND}
              disabled={isMinting || isExecuting}
              className="flex-1"
            >
              {isMinting || isExecuting ? 'Minting...' : 'Mint VND'}
            </Button>
          </div>
        </div>

        {/* Refresh Balances */}
        <Button
          onClick={handleRefreshBalances}
          variant="outline"
          className="w-full"
          disabled={!account}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Balances
        </Button>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Mint USD and VND tokens for testing</p>
          <p>• Tokens have 6 decimal places</p>
          <p>• Use these tokens to test swaps</p>
        </div>
      </CardContent>
    </Card>
  );
}
