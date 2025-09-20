import { useState, useEffect, useCallback } from 'react';
import { suiSwapService, SwapRequest, SwapResponse, CoinInfo } from '@/lib/sui-swap.service';
import { connectWallet, disconnectWallet, getWalletState, WalletState } from '@/lib/simple-wallet';

export interface UseSuiSwapReturn {
  // Wallet connection
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isWalletAvailable: boolean;

  // Exchange rate
  exchangeRate: number | null;
  loadingRate: boolean;
  rateError: string | null;
  refreshRate: () => Promise<void>;

  // User coins
  usdCoins: CoinInfo[];
  vndCoins: CoinInfo[];
  loadingCoins: boolean;
  coinsError: string | null;
  refreshCoins: () => Promise<void>;

  // Pool status
  poolStatus: { vndBalance: number; usdBalance: number } | null;
  loadingPool: boolean;
  poolError: string | null;
  refreshPool: () => Promise<void>;

  // Swap operations
  executeSwap: (swapRequest: SwapRequest) => Promise<SwapResponse>;
  swapLoading: boolean;
  swapError: string | null;

  // Total balances
  totalUsdBalance: number;
  totalVndBalance: number;
}

export function useSuiSwap(): UseSuiSwapReturn {
  // Wallet connection state
  const [wallet, setWallet] = useState<WalletConnection>({
    address: '',
    isConnected: false
  });
  const [isWalletAvailable, setIsWalletAvailable] = useState<boolean>(false);

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // User coins state
  const [usdCoins, setUsdCoins] = useState<CoinInfo[]>([]);
  const [vndCoins, setVndCoins] = useState<CoinInfo[]>([]);
  const [loadingCoins, setLoadingCoins] = useState<boolean>(false);
  const [coinsError, setCoinsError] = useState<string | null>(null);

  // Pool status state
  const [poolStatus, setPoolStatus] = useState<{ vndBalance: number; usdBalance: number } | null>(null);
  const [loadingPool, setLoadingPool] = useState<boolean>(false);
  const [poolError, setPoolError] = useState<string | null>(null);

  // Swap operations state
  const [swapLoading, setSwapLoading] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Refresh exchange rate
  const refreshRate = useCallback(async () => {
    try {
      setLoadingRate(true);
      setRateError(null);
      const rate = await suiSwapService.getCurrentRate();
      setExchangeRate(rate);
    } catch (error: any) {
      setRateError(error.message || 'Failed to fetch exchange rate');
    } finally {
      setLoadingRate(false);
    }
  }, []);

  // Wallet connection functions
  const connectWallet = useCallback(async () => {
    try {
      const wallet = await walletConnectionService.connectWallet();
      setWallet(wallet);
      // Refresh coins after connecting
      await refreshCoins();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    walletConnectionService.disconnectWallet();
    setWallet({ address: '', isConnected: false });
    setUsdCoins([]);
    setVndCoins([]);
  }, []);

  // Refresh user coins
  const refreshCoins = useCallback(async () => {
    if (!wallet.isConnected) return;
    
    try {
      setLoadingCoins(true);
      setCoinsError(null);
      const { usd, vnd } = await suiSwapService.getUserCoins();
      setUsdCoins(usd);
      setVndCoins(vnd);
    } catch (error: any) {
      setCoinsError(error.message || 'Failed to fetch user coins');
    } finally {
      setLoadingCoins(false);
    }
  }, [wallet.isConnected]);

  // Refresh pool status
  const refreshPool = useCallback(async () => {
    try {
      setLoadingPool(true);
      setPoolError(null);
      const status = await suiSwapService.getPoolStatus();
      setPoolStatus(status);
    } catch (error: any) {
      setPoolError(error.message || 'Failed to fetch pool status');
    } finally {
      setLoadingPool(false);
    }
  }, []);

  // Execute swap
  const executeSwap = useCallback(async (swapRequest: SwapRequest): Promise<SwapResponse> => {
    if (!wallet.isConnected) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    try {
      setSwapLoading(true);
      setSwapError(null);
      const result = await suiSwapService.executeSwap(swapRequest);
      
      if (result.success) {
        // Refresh coins and pool after successful swap
        await Promise.all([
          refreshCoins(),
          refreshPool()
        ]);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to execute swap';
      setSwapError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setSwapLoading(false);
    }
  }, [wallet.isConnected, refreshCoins, refreshPool]);

  // Calculate total balances
  const totalUsdBalance = usdCoins.reduce((sum, coin) => sum + coin.balance, 0);
  const totalVndBalance = vndCoins.reduce((sum, coin) => sum + coin.balance, 0);

  // Check wallet availability on mount
  useEffect(() => {
    const checkWallet = async () => {
      const available = await walletConnectionService.isWalletAvailable();
      setIsWalletAvailable(available);
    };
    checkWallet();
  }, []);

  // Auto-refresh exchange rate every 30 seconds
  useEffect(() => {
    refreshRate();
    const interval = setInterval(refreshRate, 30000);
    return () => clearInterval(interval);
  }, [refreshRate]);

  // Auto-refresh pool status every 60 seconds
  useEffect(() => {
    refreshPool();
    const interval = setInterval(refreshPool, 60000);
    return () => clearInterval(interval);
  }, [refreshPool]);

  // Auto-refresh coins when wallet connects
  useEffect(() => {
    if (wallet.isConnected) {
      refreshCoins();
    }
  }, [wallet.isConnected, refreshCoins]);

  return {
    // Wallet connection
    wallet,
    connectWallet,
    disconnectWallet,
    isWalletAvailable,

    // Exchange rate
    exchangeRate,
    loadingRate,
    rateError,
    refreshRate,

    // User coins
    usdCoins,
    vndCoins,
    loadingCoins,
    coinsError,
    refreshCoins,

    // Pool status
    poolStatus,
    loadingPool,
    poolError,
    refreshPool,

    // Swap operations
    executeSwap,
    swapLoading,
    swapError,

    // Total balances
    totalUsdBalance,
    totalVndBalance
  };
}
