import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";
import {
    BaseCard,
    Card,
    PaymentRequest,
    PaymentResponse,
    Transaction,
    User,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("authToken");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle responses
api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error: AxiosError) => {
        const errorData = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method,
        };

        console.error("API Error Details:", errorData);

        // If it's a network error
        if (!error.response) {
            console.error(
                "Network Error - Backend might be down or CORS issue"
            );
        }

        throw error;
    }
);

interface LoginResponse {
    success: boolean;
    message: string;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    user: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        walletAddress?: string;
    };
}

// Auth APIs
export async function loginAPI(
    email: string,
    password: string
): Promise<LoginResponse> {
    return api.post("/auth/login", { email, password });
}

export interface RegisterResponse {
    success: string;
    message: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        status: string;
    };
}

export async function registerAPI(data: {
    email: string;
    password: string;
    phoneNumber: string;
    fullName: string;
    role: "user" | "merchant" | "admin";
}): Promise<RegisterResponse> {
    return api.post("/auth/register", data);
}

export async function logoutAPI() {
    return api.post("/auth/logout");
}

export async function verifyOtpAPI(phoneNumber: string, otp: string) {
    return api.post("/auth/verify-email", { phoneNumber, otp });
}

export async function resendOtpAPI(phoneNumber: string) {
    return api.post("/auth/resend-otp", { phoneNumber });
}

export async function forgotPasswordAPI(email: string) {
    return api.post("/auth/forgot-password", { email });
}

interface UserProfileResponse {
    success: boolean;
    user: User;
}

// User APIs
export async function getUserProfileAPI(): Promise<UserProfileResponse> {
    return api.get("/user/profile");
}

interface UpdateUserProfileResponse {
    success: boolean;
    user: {
        id: string;
        email: string;
        fullName: string;
        phoneNumber: string;
        role: string;
        dailyLimit: number;
        monthlyLimit: number;
        kycStatus: string;
    };
}

export async function updateUserProfileAPI(data: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
}): Promise<UpdateUserProfileResponse> {
    return api.put("/user/profile", data);
}

interface UserSettingResponse {
    success: boolean;
    settings: {
        twoFactorAuth: boolean;
        dailyLimit: number;
        monthlyLimit: number;
    };
}

// User Settings APIs
export async function getUserSettingsAPI(): Promise<UserSettingResponse> {
    return api.get("/user/settings");
}

export async function updateUserSettingsAPI(data: {
    twoFactorAuth?: boolean;
}): Promise<UserSettingResponse> {
    return api.put("/user/settings", data);
}

export async function setPinAPI(pin: string, confirmPin: string) {
    return api.post("/user/pin/set", { pin, confirmPin });
}

interface CreateCardResponse {
    success: boolean;
    message: string;
    data: Card;
}

// Card APIs
export async function createCardAPI(data: {
    cardType: "virtual" | "physical";
    cardName?: string;
    limits?: { daily: number; monthly: number };
}): Promise<CreateCardResponse> {
    return api.post("/card/create", data);
}

interface GetUserCardsResponse {
    success: boolean;
    data: {
        cards: Card[];
    };
}

export async function getUserCardsAPI(): Promise<GetUserCardsResponse> {
    return api.get("/card/");
}

export async function getCardAPI(cardId: string) {
    return api.get(`/card/${cardId}`);
}

export async function activateCardAPI(cardId: string) {
    return api.post(`/card/${cardId}/activate`);
}

interface BlockCardRespose {
    success: boolean;
    message?: string;
}

export async function blockCardAPI(
    cardId: string,
    reason?: string
): Promise<BlockCardRespose> {
    console.log("🔒 [API] Block card request:", { cardId, reason });
    return api.post(`/card/${cardId}/block`, { reason });
}

export async function unblockCardAPI(
    cardId: string
): Promise<BlockCardRespose> {
    console.log("🔓 [API] Unblock card request:", { cardId });
    return api.post(`/card/${cardId}/unblock`);
}

export async function setPrimaryCardAPI(cardId: string) {
    return api.post(`/card/${cardId}/set-primary`);
}

// Payment APIs
export async function validatePaymentAPI(request: PaymentRequest) {
    return api.post("/payment/validate", request);
}

export async function processPaymentAPI(
    request: PaymentRequest & { pin?: string }
): Promise<PaymentResponse> {
    return api.post("/payment/process", request);
}

interface PaymentHistoryResponse {
    success: boolean;
    transactions: Transaction[];
    total: number;
    pages: number;
}

export async function getPaymentHistoryAPI(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<PaymentHistoryResponse> {
    return api.get("/payment/transactions", { params });
}

export async function refundTransactionAPI(txId: string, reason?: string) {
    return api.post(`/payment/${txId}/refund`, { reason });
}

export interface CreateWalletResponse {
    success: boolean;
    walletAddress: string;
    publicKey?: string;
}

// Wallet APIs
export async function createWalletAPI(): Promise<CreateWalletResponse> {
    return api.post("/wallet/create");
}

interface WalletBalanceResponse {
    success: boolean;
    address: string;
    balance: number;
    coinObjectCount: number;
}

export async function getWalletBalanceAPI(
    address: string
): Promise<WalletBalanceResponse> {
    return api.get(`/wallet/balance/${address}`);
}

export async function getWalletTransactionsAPI(params?: {
    page?: number;
    limit?: number;
}) {
    return api.get("/wallet/transactions", { params });
}

export async function requestFaucetAPI() {
    return api.post("/wallet/faucet");
}

interface UserLimitsResponse {
    success: boolean;
    limits: {
        dailyLimit: number;
        monthlyLimit: number;
    };
}

// User limits APIs
export async function getUserLimitsAPI(): Promise<UserLimitsResponse> {
    return api.get("/user/limits");
}

export async function updateUserLimitsAPI(data: {
    dailyLimit?: number;
    monthlyLimit?: number;
}): Promise<UserLimitsResponse> {
    return api.put("/user/limits", data);
}

// Merchant APIs (if user is merchant)
export async function registerMerchantAPI(data: {
    businessName: string;
    contactEmail: string;
    businessType: string;
    address: string;
    webhookUrl?: string;
}) {
    return api.post("/merchant/register", data);
}

export async function getMerchantInfoAPI(merchantId: string) {
    return api.get(`/merchant/info/${merchantId}`);
}

export interface CardStats {
    active: number;
    blocked: number;
    inactive: number;
    total?: number;
}

interface AdminCardsResponse {
    success: boolean;
    data: {
        cardStats: CardStats;
        problematicCards?: {
            _id: string; // cardId
            failureCount: number;
        }[];
    };
}

// Admin APIs
export async function getAdminCardsAPI(): Promise<AdminCardsResponse> {
    return api.get("/admin/cards");
}

interface UserInfo {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
}

export interface AdminCard extends BaseCard {
    isPrimary: boolean;
    user: Pick<UserInfo, "id" | "fullName" | "email" | "phoneNumber">;
    blockedAt?: Date;
    blockedReason?: string;
    lastUsed: Date;
}

interface AllCardsResponse {
    success: boolean;
    data: {
        cards: AdminCard[];
    };
}

export async function getAllCardsAPI(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    userId?: string;
}): Promise<AllCardsResponse> {
    console.log(
        "🌐 [API Client] Calling getAllCardsAPI with URL: /card/admin/all"
    );
    console.log("🌐 [API Client] Params:", params);
    console.log("🌐 [API Client] Timestamp:", Date.now());

    // Add timestamp to bypass cache
    const url = `/card/admin/all?t=${Date.now()}`;
    console.log("🌐 [API Client] Final URL:", url);

    return api.get(url, { params });
}

export async function getAdminCardAPI(cardId: string) {
    return api.get(`/admin/cards/${cardId}`);
}

export async function blockAdminCardAPI(cardId: string, reason?: string) {
    console.log("🔒 [Admin API] Block card request:", { cardId, reason });
    const response = await api.post(`/admin/cards/${cardId}/block`, { reason });
    console.log("🔒 [Admin API] Block card response:", response.data);
    return response;
}

export async function unblockAdminCardAPI(cardId: string) {
    console.log("🔓 [Admin API] Unblock card request:", { cardId });
    const response = await api.post(`/admin/cards/${cardId}/unblock`);
    console.log("🔓 [Admin API] Unblock card response:", response.data);
    return response;
}

export interface DashboardStats {
    totalTransactions: {
        today: number;
        week: number;
        month: number;
    };
    totalVolume: {
        today: number;
        week: number;
        month: number;
    };
    successRate: {
        today: number;
        week: number;
        month: number;
    };
    failureAnalysis?: {
        networkErrors: number;
        cardErrors: number;
        insufficientFunds: number;
        merchantErrors: number;
        systemErrors: number;
    };
    activeCards: number;
    activeMerchants: number;
    averageTransactionTime: number;
    timestamp?: Date;
}

interface AdminDashboardResponse {
    success: boolean;
    data: DashboardStats;
}

export async function getAdminDashboardAPI(): Promise<AdminDashboardResponse> {
    return api.get("/admin/dashboard");
}

export async function getAdminHealthAPI() {
    return api.get("/admin/health");
}

export interface FullTransaction {
    _id: string;
    amount: number;
    type:
        | "inflow"
        | "outflow"
        | "payment"
        | "topup"
        | "withdraw"
        | "received"
        | "transfer";
    status: "completed" | "pending" | "failed";
    time: string;
    txHash?: string;
    userId?: {
        _id?: string;
        email?: string;
        fullName?: string;
    };
    merchantId?: {
        _id?: string;
        merchantName?: string;
        businessType?: string;
    };
    cardUuid?: string;
    currency?: string;
    merchantName?: string;
    gasFee?: number;
    totalAmount?: number;
    fromAddress?: string;
    toAddress?: string;
    metadata?: {
        ipAddress: string;
        userAgent: string;
    };
    createdAt: Date;
    updatedAt?: Date;
    __v?: number;
    completedAt?: Date;
}

interface AdminTransactionsResponse {
    success: boolean;
    data: {
        transactions: FullTransaction[];
    };
}

export async function getAdminTransactionsAPI(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<AdminTransactionsResponse> {
    console.log("🌐 [API Client] Calling getAdminTransactionsAPI");
    console.log("🌐 [API Client] Params:", params);
    return api.get("/admin/transactions", { params });
}
