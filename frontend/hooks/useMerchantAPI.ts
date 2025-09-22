import { useState, useEffect } from "react";
import {
    merchantAPI,
    MerchantCredentials,
    MerchantProfile,
    PaymentStats,
    Transaction,
} from "@/lib/merchant-api";

export const useMerchantAPI = () => {
    const [credentials, setCredentials] = useState<MerchantCredentials | null>(
        null
    );
    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Set credentials and initialize API
    const setMerchantCredentials = (creds: MerchantCredentials) => {
        setCredentials(creds);
        merchantAPI.setCredentials(creds);
    };

    // Load merchant profile
    const loadProfile = async () => {
        if (!credentials) return;

        setLoading(true);
        setError(null);

        try {
            const response = await merchantAPI.getProfile();
            if (response.success && response.data) {
                setProfile(response.data);
            } else {
                setError(response.error || "Failed to load profile");
            }
        } catch (err) {
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    // Load payment stats
    const loadStats = async () => {
        if (!credentials) return;

        setLoading(true);
        setError(null);

        try {
            const response = await merchantAPI.getPaymentStats();
            if (response.success && response.data) {
                setStats(response.data);
            } else {
                setError(response.error || "Failed to load stats");
            }
        } catch (err) {
            setError("Failed to load stats");
        } finally {
            setLoading(false);
        }
    };

    // Load transactions
    const loadTransactions = async (page: number = 1, limit: number = 20) => {
        if (!credentials) return;

        setLoading(true);
        setError(null);

        try {
            const response = await merchantAPI.getPayments(page, limit);
            if (response.success && response.data) {
                setTransactions(response.data.payments);
            } else {
                setError(response.error || "Failed to load transactions");
            }
        } catch (err) {
            setError("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    // Load all data
    const loadAllData = async () => {
        if (!credentials) return;

        setLoading(true);
        setError(null);

        try {
            await Promise.all([loadProfile(), loadStats(), loadTransactions()]);
        } catch (err) {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Initialize data when credentials are set
    useEffect(() => {
        if (credentials) {
            loadAllData();
        }
    }, [credentials]);

    return {
        credentials,
        profile,
        stats,
        transactions,
        loading,
        error,
        setMerchantCredentials,
        loadProfile,
        loadStats,
        loadTransactions,
        loadAllData,
        refresh: loadAllData,
    };
};

export default useMerchantAPI;
