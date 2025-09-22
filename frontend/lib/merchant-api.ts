import axios, { AxiosError } from "axios";

const API_BASE_URL = `${
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
}/api`;

// Merchant API credentials interface
export interface MerchantCredentials {
    merchantId: string;
    publicKey: string;
    secretKey: string;
}

// API response interfaces
export interface MerchantProfile {
    merchantId: string;
    merchantName: string;
    businessType: string;
    email: string;
    phoneNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
    walletAddress: string;
    isActive: boolean;
    isVerified: boolean;
    totalTransactions: number;
    totalVolume: number;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentStats {
    today: {
        transactions: number;
        volume: number;
        fees: number;
    };
    week: {
        transactions: number;
        volume: number;
        fees: number;
    };
    month: {
        transactions: number;
        volume: number;
        fees: number;
    };
    overall: {
        transactions: number;
        volume: number;
        fees: number;
        averageTransaction: number;
    };
    merchant: {
        totalTransactions: number;
        totalVolume: number;
        commission: number;
        nextSettlementDate: string;
        isActive: boolean;
        isVerified: boolean;
    };
}

export interface Transaction {
    _id: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: "pending" | "completed" | "failed";
    merchantName: string;
    customerName?: string;
    createdAt: string;
    completedAt?: string;
    txHash?: string;
    explorerUrl?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface PaymentsResponse {
    payments: Transaction[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

class MerchantAPIClient {
    private credentials: MerchantCredentials | null = null;

    // Set merchant credentials
    setCredentials(credentials: MerchantCredentials) {
        this.credentials = credentials;
    }

    // Get authorization header
    private getAuthHeader(): string {
        if (!this.credentials) {
            throw new Error("Merchant credentials not set");
        }
        return `Bearer ${this.credentials.publicKey}:${this.credentials.secretKey}`;
    }

    private handleError<T>(error: unknown): ApiResponse<T> {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ error?: string }>;
            return {
                success: false,
                error:
                    axiosError.response?.data?.error ||
                    axiosError.message ||
                    "Unknown error",
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }

    // Get merchant profile
    async getProfile(): Promise<ApiResponse<MerchantProfile>> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/merchant/profile`,
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return this.handleError<MerchantProfile>(error);
        }
    }

    // Get payment statistics
    async getPaymentStats(): Promise<ApiResponse<PaymentStats>> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/merchant/payments/stats`,
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return this.handleError<PaymentStats>(error);
        }
    }

    // Get merchant payments/transactions
    async getPayments(
        page: number = 1,
        limit: number = 20
    ): Promise<ApiResponse<PaymentsResponse>> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/merchant/payments`,
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        "Content-Type": "application/json",
                    },
                    params: { page, limit },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return this.handleError<PaymentsResponse>(error);
        }
    }

    // Get merchant settings
    async getSettings(): Promise<ApiResponse<Record<string, unknown>>> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/merchant/settings`,
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return this.handleError<Record<string, unknown>>(error);
        }
    }

    // Update merchant profile
    async updateProfile(
        profileData: Partial<MerchantProfile>
    ): Promise<ApiResponse<MerchantProfile>> {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/merchant/profile`,
                profileData,
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return this.handleError<MerchantProfile>(error);
        }
    }

    // Update merchant settings
    async updateSettings(
        settingsData: Record<string, unknown>
    ): Promise<ApiResponse<Record<string, unknown>>> {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/merchant/settings`,
                settingsData,
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return this.handleError<Record<string, unknown>>(error);
        }
    }

    // Test NFC payment validation (public endpoint)
    async validateNFCPayment(
        cardUuid: string,
        amount: number,
        terminalId: string = "TERMINAL_001"
    ): Promise<ApiResponse<Record<string, unknown>>> {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/payment/nfc-validate`,
                {
                    cardUuid,
                    amount,
                    merchantId:
                        this.credentials?.merchantId || "mch_7b02ce0867a04ee7",
                    terminalId,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error: unknown) {
            return this.handleError<Record<string, unknown>>(error);
        }
    }
}

// Export singleton instance
export const merchantAPI = new MerchantAPIClient();

// Export default
export default merchantAPI;
