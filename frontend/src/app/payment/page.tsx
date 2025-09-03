'use client';

import React, { useState, useEffect } from 'react';
import { useNFC } from '@/hooks/useNFC';
import { useWallet } from '@/hooks/useWallet';
import { usePayment } from '@/hooks/usePayment';
import NFCScanner from '@/components/NFCScanner';
import PaymentModal from '@/components/PaymentModal';
import WalletBalance from '@/components/WalletBalance';
import { CreditCard, AlertCircle } from 'lucide-react';

export default function PaymentPage() {
  const [amount, setAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState('');
  
  const { startScan, stopScan, nfcData, isScanning, isSupported } = useNFC();
  const { wallet, loading: walletLoading } = useWallet();
  const { processPayment, isProcessing, paymentResult } = usePayment();

  useEffect(() => {
    if (nfcData?.uuid) {
      handlePayment(nfcData.uuid);
    }
  }, [nfcData]);

  const handlePayment = async (cardUuid: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setError('');
    setShowPaymentModal(true);
    
    try {
      await processPayment({
        cardUuid,
        amount: parseFloat(amount),
        merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!
      });
    } catch (err: any) {
      setError(err.message);
      setShowPaymentModal(false);
    }
  };

  const handleStartScan = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Vui lòng nhập số tiền trước khi quét thẻ');
      return;
    }
    
    if (!isSupported) {
      setError('Trình duyệt không hỗ trợ NFC. Vui lòng sử dụng Chrome/Edge trên Android');
      return;
    }
    
    setError('');
    startScan();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">Thanh toán NFC</h1>
          </div>
          <WalletBalance />
        </div>
      </div>

      {/* Payment Form */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Amount Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin thanh toán</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền (SUI)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                disabled={isScanning || isProcessing}
              />
              <div className="absolute right-3 top-3 text-gray-500">SUI</div>
            </div>
            {amount && (
              <p className="mt-2 text-sm text-gray-600">
                ≈ ${(parseFloat(amount) * 0.5).toFixed(2)} USD
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant
            </label>
            <input
              type="text"
              value="Coffee Shop Demo"
              disabled
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleStartScan}
            disabled={!isSupported || isScanning || isProcessing || !amount}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
              isSupported && amount && !isScanning && !isProcessing
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isScanning ? 'Đang quét...' : 'Quét thẻ NFC'}
          </button>
        </div>

        {/* NFC Scanner */}
        <NFCScanner
          isScanning={isScanning}
          onStop={stopScan}
          nfcData={nfcData}
        />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={parseFloat(amount)}
          isProcessing={isProcessing}
          paymentResult={paymentResult}
        />
      )}
    </div>
  );
}