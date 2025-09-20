'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, History, TrendingUp, Wallet, CheckCircle } from 'lucide-react';
import SimpleSwapInterface from '@/components/swap/SimpleSwapInterface';
import RateDisplay from '@/components/swap/RateDisplay';
import SwapHistory from '@/components/swap/SwapHistory';
import MintTokens from '@/components/swap/MintTokens';
import { ConnectButton, useSuiClient } from '@mysten/dapp-kit';

export default function SwapPage() {
  const [activeTab, setActiveTab] = useState('swap');
  const [swapSuccess, setSwapSuccess] = useState<string>('');

  const client = useSuiClient();

  const handleSwapSuccess = (transactionDigest: string) => {
    setSwapSuccess(transactionDigest);
    // Clear success message after 5 seconds
    setTimeout(() => setSwapSuccess(''), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            VND/USD Swap
          </h1>
          <p className="text-lg text-gray-600">
            Swap between Vietnamese Dong and US Dollar with real-time exchange rates
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Swap Interface */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="swap" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Swap
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="swap" className="mt-6">
                {/* Wallet Connection */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Connect Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </CardContent>
                </Card>
                {/* Mint Tokens */}
                <MintTokens />

                {/* Swap Interface */}
                <SimpleSwapInterface onSwapSuccess={handleSwapSuccess} />

                {/* Success Message */}
                {swapSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm text-green-600">
                        Swap successful! Transaction: {swapSuccess}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="mt-6">
                <SwapHistory />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Rate Display and Info */}
          <div className="space-y-6">
            {/* Exchange Rate */}
            <RateDisplay />
            
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>1. Connect your Sui wallet</p>
                  <p>2. Select currencies to swap</p>
                  <p>3. Enter amount and confirm</p>
                  <p>4. Sign transaction in wallet</p>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Select currencies</p>
                    <p className="text-muted-foreground">Choose USD or VND to swap</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Enter amount</p>
                    <p className="text-muted-foreground">Type the amount you want to swap</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Confirm swap</p>
                    <p className="text-muted-foreground">Review and confirm your transaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Rates</h3>
              <p className="text-sm text-muted-foreground">
                Get the latest exchange rates from multiple sources updated every minute
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Your funds are secured with Sui blockchain technology
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowUpDown className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Swaps</h3>
              <p className="text-sm text-muted-foreground">
                Complete your swaps instantly with our optimized smart contracts
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
