'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { getUserProfileAPI, loginAPI, logoutAPI, registerAPI } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  register: (data: {
    email: string;
    password: string;
    phoneNumber: string;
    fullName: string;
    role?: 'user' | 'merchant';
  }) => Promise<void>;
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
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await getUserProfileAPI();
        if (response.success) {
          setUser(response.user);
        }
      }
    } catch (error: any) {
      console.error('Failed to load user:', error);
      // Only clear token on explicit 401; keep token on network/5xx errors to avoid bouncing
      const status = error?.response?.status;
      if (status === 401) {
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await loginAPI(email, password);
      
      if (response.success) {
        // Store tokens
        localStorage.setItem('authToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        
        // Set user data
        setUser(response.user);
        // Optional: prefetch profile to ensure freshness
        try {
          const profile = await getUserProfileAPI();
          if (profile?.success && profile?.user) {
            setUser(profile.user);
            
            // Check merchant registration status
            if (profile.user.role === 'merchant') {
              const merchantCredentials = localStorage.getItem('merchantCredentials');
              if (!merchantCredentials) {
                // Redirect to merchant registration if no credentials
                window.location.href = '/merchant-register';
                return;
              } else {
                // Redirect to merchant dashboard if credentials exist
                window.location.href = '/merchant';
                return;
              }
            }
          }
        } catch {}
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    phoneNumber: string;
    fullName: string;
  }) => {
    try {
      setLoading(true);
      const response = await registerAPI(data);
      
      if (response.success) {
        // Registration successful - user may need to verify email/phone
        console.log('Registration successful:', response.message);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}