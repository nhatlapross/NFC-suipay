import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import Navigation from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@/components/QueryClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NFC Payment - Sui Blockchain',
  description: 'Secure NFC payment system powered by Sui blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <QueryClientProvider>
          <AuthProvider>
            <WalletProvider>
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>
              </div>
              <Toaster />
            </WalletProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}