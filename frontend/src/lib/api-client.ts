import axios from 'axios';
import { PaymentRequest, PaymentResponse, Transaction } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config:any) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response:any) => response.data,
  (error:any) => {
    const errorData = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    };
    
    console.error('API Error Details:', errorData);
    
    // If it's a network error
    if (!error.response) {
      console.error('Network Error - Backend might be down or CORS issue');
    }
    
    throw error;
  }
);

// Auth APIs
export async function loginAPI(email: string, password: string) {
  return api.post('/auth/login', { email, password });
}

export async function registerAPI(data: {
  email: string;
  password: string;
  phoneNumber: string;
  fullName: string;
}) {
  return api.post('/auth/register', data);
}

export async function logoutAPI() {
  return api.post('/auth/logout');
}

export async function verifyOtpAPI(phoneNumber: string, otp: string) {
  return api.post('/auth/verify-email', { phoneNumber, otp });
}

export async function resendOtpAPI(phoneNumber: string) {
  return api.post('/auth/resend-otp', { phoneNumber });
}

// User APIs
export async function getUserProfileAPI() {
  return api.get('/user/profile');
}

export async function updateUserProfileAPI(data: any) {
  return api.put('/user/profile', data);
}

export async function setPinAPI(pin: string, confirmPin: string) {
  return api.post('/user/pin/set', { pin, confirmPin });
}

// Card APIs
export async function createCardAPI(data: {
  cardType: 'standard' | 'premium' | 'corporate';
  cardName?: string;
  limits?: { daily: number; monthly: number };
}) {
  return api.post('/card/create', data);
}

export async function getUserCardsAPI() {
  return api.get('/card/');
}

export async function getCardAPI(cardId: string) {
  return api.get(`/card/${cardId}`);
}

export async function activateCardAPI(cardId: string) {
  return api.post(`/card/${cardId}/activate`);
}

export async function blockCardAPI(cardId: string, reason?: string) {
  return api.post(`/card/${cardId}/block`, { reason });
}

export async function unblockCardAPI(cardId: string) {
  return api.post(`/card/${cardId}/unblock`);
}

export async function setPrimaryCardAPI(cardId: string) {
  return api.post(`/card/${cardId}/set-primary`);
}

// Payment APIs
export async function validatePaymentAPI(request: PaymentRequest) {
  return api.post('/payment/validate', request);
}

export async function processPaymentAPI(request: PaymentRequest & { pin?: string }): Promise<PaymentResponse> {
  return api.post('/payment/process', request);
}

export async function getPaymentHistoryAPI(params?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return api.get('/payment/history', { params });
}

export async function refundTransactionAPI(txId: string, reason?: string) {
  return api.post(`/payment/${txId}/refund`, { reason });
}

// Wallet APIs
export async function createWalletAPI() {
  return api.post('/wallet/create');
}

export async function getWalletBalanceAPI() {
  return api.get('/wallet/balance');
}

export async function getWalletTransactionsAPI(params?: {
  page?: number;
  limit?: number;
}) {
  return api.get('/wallet/transactions', { params });
}

export async function requestFaucetAPI() {
  return api.post('/wallet/faucet');
}

// Merchant APIs (if user is merchant)
export async function registerMerchantAPI(data: {
  businessName: string;
  contactEmail: string;
  businessType: string;
  address: string;
  webhookUrl?: string;
}) {
  return api.post('/merchant/register', data);
}

export async function getMerchantInfoAPI(merchantId: string) {
  return api.get(`/merchant/info/${merchantId}`);
}