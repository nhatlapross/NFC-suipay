import axios from 'axios';
import { PaymentRequest, PaymentResponse, Transaction } from '@/types';

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api`;

const api: any = axios.create({
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
  role?: 'user' | 'merchant';
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

export async function forgotPasswordAPI(email: string) {
  return api.post('/auth/forgot-password', { email });
}

// User APIs
export async function getUserProfileAPI() {
  return api.get('/user/profile');
}

export async function updateUserProfileAPI(data: any) {
  return api.put('/user/profile', data);
}

// User Settings APIs
export async function getUserSettingsAPI() {
  return api.get('/user/settings');
}

export async function updateUserSettingsAPI(data: { twoFactorAuth?: boolean }) {
  return api.put('/user/settings', data);
}

export async function setPinAPI(pin: string, confirmPin: string) {
  return api.post('/user/pin/set', { pin, confirmPin });
}

// Card APIs
export async function createCardAPI(data: {
  cardType: 'virtual' | 'physical';
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
  console.log('🔒 [API] Block card request:', { cardId, reason });
  const response = await api.post(`/card/${cardId}/block`, { reason });
  console.log('🔒 [API] Block card response:', response.data);
  return response;
}

export async function unblockCardAPI(cardId: string) {
  console.log('🔓 [API] Unblock card request:', { cardId });
  const response = await api.post(`/card/${cardId}/unblock`);
  console.log('🔓 [API] Unblock card response:', response.data);
  return response;
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
  return api.get('/payment/transactions', { params });
}

export async function refundTransactionAPI(txId: string, reason?: string) {
  return api.post(`/payment/${txId}/refund`, { reason });
}

// Wallet APIs
export async function createWalletAPI() {
  return api.post('/wallet/create');
}

export async function getWalletBalanceAPI(address: string) {
  return api.get(`/wallet/balance/${address}`);
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

// User limits APIs
export async function getUserLimitsAPI() {
  return api.get('/user/limits');
}

export async function updateUserLimitsAPI(data: { dailyLimit?: number; monthlyLimit?: number }) {
  return api.put('/user/limits', data);
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

// Admin APIs
export async function getAdminCardsAPI() {
  return api.get('/admin/cards');
}

export async function getAllCardsAPI(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  userId?: string;
}) {
  console.log('🌐 [API Client] Calling getAllCardsAPI with URL: /card/admin/all');
  console.log('🌐 [API Client] Params:', params);
  console.log('🌐 [API Client] Timestamp:', Date.now());
  
  // Add timestamp to bypass cache
  const url = `/card/admin/all?t=${Date.now()}`;
  console.log('🌐 [API Client] Final URL:', url);
  
  return api.get(url, { params });
}

export async function getAdminCardAPI(cardId: string) {
  return api.get(`/admin/cards/${cardId}`);
}

export async function blockAdminCardAPI(cardId: string, reason?: string) {
  console.log('🔒 [Admin API] Block card request:', { cardId, reason });
  const response = await api.post(`/admin/cards/${cardId}/block`, { reason });
  console.log('🔒 [Admin API] Block card response:', response.data);
  return response;
}

export async function unblockAdminCardAPI(cardId: string) {
  console.log('🔓 [Admin API] Unblock card request:', { cardId });
  const response = await api.post(`/admin/cards/${cardId}/unblock`);
  console.log('🔓 [Admin API] Unblock card response:', response.data);
  return response;
}

export async function getAdminDashboardAPI() {
  return api.get('/admin/dashboard');
}

export async function getAdminHealthAPI() {
  return api.get('/admin/health');
}

export async function getAdminTransactionsAPI(params?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  console.log('🌐 [API Client] Calling getAdminTransactionsAPI');
  console.log('🌐 [API Client] Params:', params);
  return api.get('/admin/transactions', { params });
}