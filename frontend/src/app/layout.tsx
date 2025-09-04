import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import Navigation from "@/components/Navigation";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@/components/QueryClientProvider";

const geistIBMPlexMono = IBM_Plex_Mono({
    variable: "--font-ibm-plex-mono",
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "NFC Payment - Sui Blockchain",
    description: "Secure NFC payment system powered by Sui blockchain",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body
                className={`${geistIBMPlexMono.className} ${geistMono.className}`}
            >
                <QueryClientProvider>
                    <AuthProvider>
                        <WalletProvider>
                            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                                <Navigation />
                                <main className="mx-auto">{children}</main>
                            </div>
                            <Toaster />
                        </WalletProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </body>
        </html>
    );
}
