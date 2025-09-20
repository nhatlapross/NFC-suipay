import { useState, useEffect, useCallback } from 'react';
import { swapAPI, ExchangeRate, SwapRequest, SwapResponse, SwapHistory, WalletBalance } from '@/lib/swap-api';

export interface UseSwapReturn {
  // Exchange rate
  exchangeRate: ExchangeRate | null;
  loadingRate: boolean;
  rateError: string | null;
  refreshRate: () => Promise<void>;

  // Wallet balance
  balance: WalletBalance | null;
  loadingBalance: boolean;
  balanceError: string | null;
  refreshBalance: () => Promise<void>;

  // Swap operations
  executeSwap: (swapRequest: SwapRequest) => Promise<SwapResponse>;
  swapLoading: boolean;
  swapError: string | null;

  // Swap history
  history: SwapHistory | null;
  loadingHistory: boolean;
  historyError: string | null;
  refreshHistory: (page?: number, limit?: number) => Promise<void>;

  // Currency conversion
  convertCurrency: (amount: number, from: string, to: string) => Promise<number>;
  conversionLoading: boolean;
  conversionError: string | null;
}

export function useSwap(): UseSwapReturn {
  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Wallet balance state
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Swap operations state
  const [swapLoading, setSwapLoading] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Swap history state
  const [history, setHistory] = useState<SwapHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Currency conversion state
  const [conversionLoading, setConversionLoading] = useState<boolean>(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Refresh exchange rate
  const refreshRate = useCallback(async () => {
    try {
      setLoadingRate(true);
      setRateError(null);
      const rate = await swapAPI.getExchangeRate();
      setExchangeRate(rate);
    } catch (error: any) {
      setRateError(error.message || 'Failed to fetch exchange rate');
    } finally {
      setLoadingRate(false);
    }
  }, []);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    try {
      setLoadingBalance(true);
      setBalanceError(null);
      const balance = await swapAPI.getWalletBalance();
      setBalance(balance);
    } catch (error: any) {
      setBalanceError(error.message || 'Failed to fetch wallet balance');
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // Execute swap
  const executeSwap = useCallback(async (swapRequest: SwapRequest): Promise<SwapResponse> => {
    try {
      setSwapLoading(true);
      setSwapError(null);
      const result = await swapAPI.executeSwap(swapRequest);
      
      if (result.success) {
        // Refresh balance and history after successful swap
        await Promise.all([
          refreshBalance(),
          refreshHistory()
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
  }, [refreshBalance]);

  // Refresh swap history
  const refreshHistory = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      const history = await swapAPI.getSwapHistory(page, limit);
      setHistory(history);
    } catch (error: any) {
      setHistoryError(error.message || 'Failed to fetch swap history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Convert currency
  const convertCurrency = useCallback(async (amount: number, from: string, to: string): Promise<number> => {
    try {
      setConversionLoading(true);
      setConversionError(null);
      const result = await swapAPI.convertCurrency(amount, from, to);
      return result;
    } catch (error: any) {
      setConversionError(error.message || 'Failed to convert currency');
      throw error;
    } finally {
      setConversionLoading(false);
    }
  }, []);

  // Auto-refresh exchange rate every 30 seconds
  useEffect(() => {
    refreshRate();
    const interval = setInterval(refreshRate, 30000);
    return () => clearInterval(interval);
  }, [refreshRate]);

  // Auto-refresh balance every 60 seconds
  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 60000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  // Load history on mount
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return {
    // Exchange rate
    exchangeRate,
    loadingRate,
    rateError,
    refreshRate,

    // Wallet balance
    balance,
    loadingBalance,
    balanceError,
    refreshBalance,

    // Swap operations
    executeSwap,
    swapLoading,
    swapError,

    // Swap history
    history,
    loadingHistory,
    historyError,
    refreshHistory,

    // Currency conversion
    convertCurrency,
    conversionLoading,
    conversionError
  };
}
