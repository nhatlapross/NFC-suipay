"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const Layout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <WalletProvider>
                    <div className="min-h-screen bg-neo-white font-mono">
                        {children}
                    </div>
                </WalletProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default Layout;
