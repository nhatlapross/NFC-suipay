import { useState, useEffect } from 'react';
import { Wallet } from '@/types';
import { suiClient } from '@/lib/sui-client';
import { useQuery } from '@tanstack/react-query';

export function useWallet() {
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    // Get wallet address from localStorage or context
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      setAddress(storedAddress);
    }
  }, []);

  const { data: wallet, isLoading: loading, refetch } = useQuery({
    queryKey: ['wallet', address],
    queryFn: async () => {
      if (!address) return null;
      
      const balance = await suiClient.getBalance({
        owner: address,
      });

      return {
        address,
        balance: parseFloat(balance.totalBalance) / 1_000_000_000, // Convert from MIST to SUI
        tokens: [],
      } as Wallet;
    },
    enabled: !!address,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return {
    wallet,
    loading,
    refetch,
    address,
  };
}