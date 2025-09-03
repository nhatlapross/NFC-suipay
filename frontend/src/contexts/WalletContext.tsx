'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Wallet } from '@/types';
import { getWalletBalanceAPI, createWalletAPI, requestFaucetAPI } from '@/lib/api-client';
import { useAuth } from './AuthContext';

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  createWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  requestFaucet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWallet();
    } else {
      // Clear wallet when user logs out
      setWallet(null);
    }
  }, [user]);

  const loadWallet = async () => {
    try {
      // Load wallet from user profile
      await refreshBalance();
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const createWallet = async () => {
    setLoading(true);
    try {
      const response = await createWalletAPI();
      if (response.success) {
        setWallet({
          address: response.wallet.address,
          balance: 0,
          tokens: []
        });
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    // Don't try to refresh if user is not authenticated
    if (!user) {
      console.log('No authenticated user, skipping balance refresh');
      return;
    }
    
    setLoading(true);
    try {
      const response = await getWalletBalanceAPI();
      if (response.success) {
        setWallet(prev => ({
          address: response.wallet?.address || prev?.address || '',
          balance: parseFloat(response.balance.sui) / 1000000000, // Convert MIST to SUI
          tokens: response.balance.coins?.map((coin: any) => ({
            symbol: coin.type.includes('SUI') ? 'SUI' : 'UNKNOWN',
            name: coin.type.includes('SUI') ? 'Sui Token' : 'Unknown Token',
            balance: parseFloat(coin.balance) / 1000000000
          })) || []
        }));
      }
    } catch (error: any) {
      // Only log non-auth errors
      if (error.response?.status !== 401) {
        console.error('Failed to refresh balance:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const requestFaucet = async () => {
    setLoading(true);
    try {
      const response = await requestFaucetAPI();
      if (response.success) {
        // Refresh balance after faucet request
        setTimeout(() => refreshBalance(), 2000);
      }
      return response;
    } catch (error) {
      console.error('Failed to request faucet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{ wallet, loading, createWallet, refreshBalance, requestFaucet }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
}