"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import {
    getUserProfileAPI,
    loginAPI,
    logoutAPI,
    registerAPI,
    RegisterResponse,
} from "@/lib/api-client";
import { MerchantCredentials } from "@/lib/merchant-api";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    register: (data: {
        email: string;
        password: string;
        phoneNumber: string;
        fullName: string;
        role: "user" | "merchant" | "admin";
    }) => Promise<RegisterResponse>;
    fetchMerchantCredentials: () => Promise<MerchantCredentials | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (token) {
                const response = await getUserProfileAPI();
                if (response.success) {
                    setUser(response.user);
                }
            }
        } catch (error) {
            console.error("Failed to load user:", error);
            localStorage.removeItem("authToken");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const response = await loginAPI(email, password);

            if (response.success && response.tokens) {
                // Store tokens
                localStorage.setItem("authToken", response.tokens.accessToken);
                localStorage.setItem(
                    "refreshToken",
                    response.tokens.refreshToken
                );

                const profile = await getUserProfileAPI();
                if (profile?.success && profile?.user) {
                    setUser(profile.user);

                    // Check merchant registration status
                    if (profile.user.role === "merchant") {
                        const merchantCredentials = localStorage.getItem(
                            "merchantCredentials"
                        );

                        if (!merchantCredentials) {
                            const credentials =
                                await fetchMerchantCredentials();

                            if (!credentials) {
                                window.location.href = "/merchant/register";
                            } else {
                                // Store credentials in localStorage
                                localStorage.setItem(
                                    "merchantCredentials",
                                    JSON.stringify(credentials)
                                );
                            }
                        }

                        // Redirect to merchant dashboard if credentials exist
                        window.location.href = "/merchant";
                    }
                }
                return true;
            } else {
                console.error("Login failed:", response.message);
                return false;
            }
        } catch (error) {
            console.error("Login error:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: {
        email: string;
        password: string;
        phoneNumber: string;
        fullName: string;
        role: "user" | "merchant" | "admin";
    }) => {
        try {
            setLoading(true);
            const response = await registerAPI(data);

            if (response.success) {
                // Registration successful - user may need to verify email/phone
                console.log("Registration successful:", response.message);
            } else {
                throw new Error(response.message || "Registration failed");
            }

            return response;
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutAPI();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
    };

    const fetchMerchantCredentials =
        async (): Promise<MerchantCredentials | null> => {
            try {
                const token = localStorage.getItem("authToken");
                if (!token) {
                    throw new Error("No auth token found");
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/merchant/profile`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success && data.apiKeys) {
                    const credentials: MerchantCredentials = {
                        merchantId: data.id || data.merchantId || "",
                        publicKey: data.apiKeys.publicKey,
                        secretKey: data.apiKeys.secretKey,
                    };

                    return credentials;
                } else {
                    throw new Error(
                        "Invalid response format or missing apiKeys"
                    );
                }
            } catch (error) {
                console.error("Failed to fetch merchant credentials:", error);
                return null;
            }
        };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                updateUser,
                register,
                fetchMerchantCredentials,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
