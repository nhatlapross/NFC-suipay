'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Clock, CreditCard, QrCode, List, User } from 'lucide-react';
import MerchantHeader from '@/components/merchant/MerchantHeader';
import NFCTerminal from '@/components/merchant/nfc/NFCTerminal';
import QRPaymentTerminal from '@/components/merchant/qr/QRPaymentTerminal';
import TransactionManagement from '@/components/merchant/transactions/TransactionManagement';
import MerchantSettings from '@/components/merchant/settings/MerchantSettings';
import MerchantAPITest from '@/components/merchant/MerchantAPITest';
import { useState } from 'react';

export default function MerchantTerminal() {
  const [view, setView] = useState<'dashboard' | 'nfc' | 'qr' | 'tx' | 'settings' | 'api-test'>('dashboard');
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header */}
      <MerchantHeader containerClassName="max-w-4xl" />

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {view === 'nfc' ? (
          <div className="space-y-4">
            <NFCTerminal />
          </div>
        ) : view === 'qr' ? (
          <div className="space-y-4">
            <QRPaymentTerminal />
          </div>
        ) : view === 'tx' ? (
          <div className="space-y-4">
            <TransactionManagement />
          </div>
        ) : view === 'settings' ? (
          <div className="space-y-4">
            <MerchantSettings />
          </div>
        ) : view === 'api-test' ? (
          <div className="space-y-4">
            <MerchantAPITest />
          </div>
        ) : (
        <>
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-5 border-4 border-black bg-white shadow-[8px_8px_0_black]">
            <div className="flex items-start gap-3">
              <div className="bg-[#ff005c] p-2 rounded">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">2,847 SUI</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">TODAY'S SALES</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-4 border-black bg-white shadow-[8px_8px_0_black]">
            <div className="flex items-start gap-3">
              <div className="bg-[#00f0ff] p-2 rounded">
                <TrendingUp className="h-4 w-4 text-black" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">156</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">TRANSACTIONS</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-4 border-black bg-white shadow-[8px_8px_0_black]">
            <div className="flex items-start gap-3">
              <div className="bg-[#4ade80] p-2 rounded">
                <Users className="h-4 w-4 text-black" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">89</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">CUSTOMERS</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-4 border-black bg-white shadow-[8px_8px_0_black]">
            <div className="flex items-start gap-3">
              <div className="bg-[#facc15] p-2 rounded">
                <Clock className="h-4 w-4 text-black" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">12s</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">AVG TIME</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 border-4 border-black bg-white shadow-[8px_8px_0_black]">
          <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">Quick Actions</h2>
          <div className="space-y-4">
            <Button onClick={() => setView('nfc')} className="w-full bg-[#ff005c] hover:bg-[#ff005c]/90 text-white border-4 border-black h-20 text-base font-bold p-0">
              <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                <CreditCard className="h-6 w-6 shrink-0" />
                <span className="text-lg font-bold leading-tight">NFC PAYMENT</span>
                <span className="text-sm opacity-90 leading-tight">TAP CARD TO PAY</span>
              </div>
            </Button>

            <Button onClick={() => setView('qr')} className="w-full bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black border-4 border-black h-20 text-base font-bold p-0">
              <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                <QrCode className="h-6 w-6 shrink-0" />
                <span className="text-lg font-bold leading-tight">QR PAYMENT</span>
                <span className="text-sm opacity-90 leading-tight">GENERATE QR CODE</span>
              </div>
            </Button>

            <Button onClick={() => setView('tx')} className="w-full bg-[#c084fc] hover:bg-[#c084fc]/90 text-black border-4 border-black h-20 text-base font-bold p-0">
              <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                <List className="h-6 w-6 shrink-0" />
                <span className="text-lg font-bold leading-tight">TRANSACTIONS</span>
                <span className="text-sm opacity-90 leading-tight">VIEW HISTORY</span>
              </div>
            </Button>

                        <Button onClick={() => setView('settings')} className="w-full bg-[#fb923c] hover:bg-[#fb923c]/90 text-black border-4 border-black h-20 text-base font-bold p-0">
                          <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                            <User className="h-6 w-6 shrink-0" />
                            <span className="text-lg font-bold leading-tight">PROFILE</span>
                            <span className="text-sm opacity-90 leading-tight">SETTINGS</span>
                          </div>
                        </Button>

                        <Button onClick={() => setView('api-test')} className="w-full bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white border-4 border-black h-20 text-base font-bold p-0">
                          <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                            <div className="h-6 w-6 shrink-0 bg-white rounded flex items-center justify-center">
                              <span className="text-[#8b5cf6] font-bold text-sm">API</span>
                            </div>
                            <span className="text-lg font-bold leading-tight">API TEST</span>
                            <span className="text-sm opacity-90 leading-tight">CONNECTION</span>
                          </div>
                        </Button>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6 border-4 border-black bg-white shadow-[8px_8px_0_black]">
          <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">Recent Transactions</h2>

          <Button
            variant="outline"
            className="w-full mb-5 border-2 border-black bg-[#e5e7eb] hover:bg-[#e5e7eb]/80 text-black font-bold text-base"
          >
            VIEW ALL
          </Button>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border-2 border-black bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-[#ff005c] p-2 rounded">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-black text-base">TXN_001</div>
                  <div className="text-sm text-gray-600">John Doe</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-black">45.50 SUI</div>
                <div className="text-sm text-[#16a34a] font-bold">SUCCESS</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-black bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-[#00f0ff] p-2 rounded">
                  <QrCode className="h-4 w-4 text-black" />
                </div>
                <div>
                  <div className="font-bold text-black text-base">TXN_002</div>
                  <div className="text-sm text-gray-600">Jane Smith</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-black">128.75 SUI</div>
                <div className="text-sm text-[#16a34a] font-bold">SUCCESS</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-black bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-[#ff005c] p-2 rounded">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-black text-base">TXN_003</div>
                  <div className="text-sm text-gray-600">Mike Johnson</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-black">67.20 SUI</div>
                <div className="text-sm text-[#dc2626] font-bold">FAILED</div>
              </div>
            </div>
          </div>
        </Card>
        </>
        )}
      </div>
    </div>
  );
}


