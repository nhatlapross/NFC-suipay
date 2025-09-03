import React from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { PaymentResponse } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  isProcessing: boolean;
  paymentResult: PaymentResponse | null;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  isProcessing,
  paymentResult,
}: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Xử lý thanh toán</h2>
          {!isProcessing && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {isProcessing && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Đang xử lý giao dịch...</p>
            <p className="text-sm text-gray-500 mt-2">
              Vui lòng không tắt trang này
            </p>
          </div>
        )}

        {!isProcessing && paymentResult?.success && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-bold text-green-800 mb-2">
              Thanh toán thành công!
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Số tiền</p>
              <p className="text-lg font-bold">{amount} SUI</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Transaction Hash</p>
              <p className="font-mono text-xs break-all">{paymentResult.txHash}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Hoàn tất
            </button>
          </div>
        )}

        {!isProcessing && paymentResult && !paymentResult.success && (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-xl font-bold text-red-800 mb-2">
              Thanh toán thất bại
            </p>
            <p className="text-gray-600 mb-6">{paymentResult.error}</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}