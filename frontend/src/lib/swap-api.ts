import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';

// Types
export interface ExchangeRate {
  usdToVnd: number;
  vndToUsd: number;
  timestamp: number;
  source: string;
  formatted: {
    usdToVnd: string;
    vndToUsd: string;
  };
}

export interface SwapRequest {
  fromAmount: number;
  fromCurrency: string;
  toCurrency: string;
  walletAddress: string;
  signature?: string;
}

export interface SwapResponse {
  success: boolean;
  data?: {
    swapId: string;
    transactionHash: string;
    fromAmount: number;
    fromCurrency: string;
    toAmount: number;
    toCurrency: string;
    rate: number;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
  };
  error?: string;
}

export interface SwapHistory {
  swaps: Array<{
    id: string;
    fromAmount: number;
    fromCurrency: string;
    toAmount: number;
    toCurrency: string;
    rate: number;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
    transactionHash?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface WalletBalance {
  usd: number;
  vnd: number;
  lastUpdated: number;
}

// API Client
class SwapAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get current exchange rate
  async getExchangeRate(): Promise<ExchangeRate> {
    try {
      const response = await axios.get(`${this.baseURL}/oracle/rate`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  }

  // Convert currency
  async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    try {
      const response = await axios.post(`${this.baseURL}/oracle/convert`, {
        amount,
        from,
        to
      });
      return response.data.data.convertedAmount;
    } catch (error) {
      console.error('Failed to convert currency:', error);
      throw new Error('Failed to convert currency');
    }
  }

  // Execute swap
  async executeSwap(swapRequest: SwapRequest): Promise<SwapResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/swap/execute`, swapRequest);
      return response.data;
    } catch (error: any) {
      console.error('Failed to execute swap:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to execute swap'
      };
    }
  }

  // Get swap history
  async getSwapHistory(page: number = 1, limit: number = 10): Promise<SwapHistory> {
    try {
      const response = await axios.get(`${this.baseURL}/swap/history`, {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch swap history:', error);
      throw new Error('Failed to fetch swap history');
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<WalletBalance> {
    try {
      const response = await axios.get(`${this.baseURL}/wallet/balance`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      throw new Error('Failed to fetch wallet balance');
    }
  }

  // Get swap status
  async getSwapStatus(swapId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    transactionHash?: string;
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/swap/status/${swapId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch swap status:', error);
      throw new Error('Failed to fetch swap status');
    }
  }

  // Update exchange rate (admin only)
  async updateExchangeRate(): Promise<ExchangeRate> {
    try {
      const response = await axios.post(`${this.baseURL}/oracle/rate/update`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update exchange rate:', error);
      throw new Error('Failed to update exchange rate');
    }
  }

  // Set custom exchange rate (admin only)
  async setExchangeRate(usdToVnd: number): Promise<ExchangeRate> {
    try {
      const response = await axios.post(`${this.baseURL}/oracle/rate/set`, {
        usdToVnd
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to set exchange rate:', error);
      throw new Error('Failed to set exchange rate');
    }
  }
}

// Export singleton instance
export const swapAPI = new SwapAPI();

// Export individual functions for convenience
export const {
  getExchangeRate,
  convertCurrency,
  executeSwap,
  getSwapHistory,
  getWalletBalance,
  getSwapStatus,
  updateExchangeRate,
  setExchangeRate
} = swapAPI;
