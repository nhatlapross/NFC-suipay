import React from 'react';
import { Smartphone, Loader2, CheckCircle } from 'lucide-react';
import { NFCData } from '@/types';

interface NFCScannerProps {
  isScanning: boolean;
  onStop: () => void;
  nfcData: NFCData | null;
}

export default function NFCScanner({ isScanning, onStop, nfcData }: NFCScannerProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Quét thẻ NFC</h2>
      
      {!isScanning && !nfcData && (
        <div className="text-center py-12">
          <Smartphone className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nhấn nút "Quét thẻ NFC" để bắt đầu</p>
        </div>
      )}

      {isScanning && (
        <div className="text-center py-12">
          <div className="relative">
            <Smartphone className="w-24 h-24 text-blue-600 mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-blue-200 rounded-full nfc-wave"></div>
            </div>
          </div>
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mt-4 mb-4" />
          <p className="text-lg font-medium text-gray-700">Đang chờ quét thẻ...</p>
          <p className="text-sm text-gray-500 mb-4">
            Đưa thẻ NFC lại gần mặt sau điện thoại
          </p>
          <button
            onClick={onStop}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Hủy quét
          </button>
        </div>
      )}

      {nfcData && (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Card UUID</p>
            <p className="font-mono text-sm">{nfcData.uuid}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Thời gian quét</p>
            <p className="text-sm">{new Date(nfcData.timestamp).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      )}
    </div>
  );
}