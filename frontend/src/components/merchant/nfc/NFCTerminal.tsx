'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CreditCard, Wifi, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { PaymentState, StateData } from './types';

function getStateData(state: PaymentState): StateData {
  switch (state) {
    case 'ready':
      return {
        amount: '0.00',
        amountBg: 'bg-[#ffffff]',
        icon: <CreditCard className="w-16 h-16 text-[#000000]" />,
        title: 'READY FOR NFC PAYMENT',
        description: '',
        showButton: true,
        buttonText: 'START NFC PAYMENT',
        buttonColor: 'bg-[#ff005c]',
        showCancel: false,
        showNewPayment: false,
      };
    case 'tap':
      return {
        amount: '10',
        amountBg: 'bg-[#00f0ff]',
        icon: <Wifi className="w-16 h-16 text-[#00f0ff]" />,
        title: 'TAP YOUR CARD OR DEVICE',
        description: 'Hold your NFC-enabled card or device near the terminal',
        showButton: false,
        showCancel: true,
        showNewPayment: false,
      };
    case 'processing':
      return {
        amount: '10',
        amountBg: 'bg-[#00f0ff]',
        icon: <Loader2 className="w-16 h-16 text-[#eab308] animate-spin" />,
        title: 'PROCESSING PAYMENT...',
        description: 'Please wait while we process your payment...',
        showButton: false,
        showCancel: false,
        showNewPayment: false,
      };
    case 'success':
      return {
        amount: '0.00',
        amountBg: 'bg-[#ffffff]',
        icon: <CheckCircle className="w-16 h-16 text-[#22c55e]" />,
        title: 'PAYMENT SUCCESSFUL!',
        description: '',
        showButton: false,
        showCancel: false,
        showNewPayment: true,
        transactionId: 'TXN_1727831116091',
        transactionAmount: '10 SUI',
      };
    case 'failed':
      return {
        amount: '0.00',
        amountBg: 'bg-[#ffffff]',
        icon: <XCircle className="w-16 h-16 text-[#ff005c]" />,
        title: 'PAYMENT FAILED',
        description: 'Please try again or use a different payment method',
        showButton: false,
        showCancel: false,
        showNewPayment: true,
      };
  }
}

export default function NFCTerminal() {
  const [currentState, setCurrentState] = useState<PaymentState>('ready');

  const data = getStateData(currentState);

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      {/* NFC Payment Section */}
      <Card className="p-4 border-4 border-[#000000] shadow-[8px_8px_0_black]">
        <div className="flex items-center space-x-2 mb-2">
          <CreditCard className="w-4 h-4" />
          <span className="font-bold text-sm">NFC PAYMENT</span>
        </div>
        <p className="text-xs text-[#757575]">Accept contactless payments via NFC-enabled cards and devices</p>
      </Card>

      {/* Payment Amount */}
      <Card className="p-4 border-4 border-[#000000] shadow-[8px_8px_0_black] mt-4">
        <div className="mb-2">
          <span className="font-bold text-sm">PAYMENT AMOUNT</span>
        </div>
        <div className="flex items-center space-x-2">
          <Input value={data.amount} readOnly className={`${data.amountBg} border-2 border-[#000000] font-mono text-lg font-bold text-center`} />
          <span className="font-bold">SUI</span>
        </div>
      </Card>

      {/* Main Status Area */}
      <Card className="p-10 border-4 border-[#000000] shadow-[8px_8px_0_black] min-h-[260px] flex flex-col items-center justify-center text-center mt-4">
        <div className="mb-6">{data.icon}</div>
        <h3 className="font-bold text-xl mb-3">{data.title}</h3>
        {data.description && <p className="text-sm text-[#757575] mb-4">{data.description}</p>}

        {currentState === 'processing' && (
          <div className="w-full bg-[#e5e7eb] rounded-full h-2 mt-4">
            <div className="bg-[#00f0ff] h-2 rounded-full w-3/4"></div>
          </div>
        )}

        {currentState === 'success' && (
          <Card className="bg-[#dcfce7] border-[#166534] border-4 p-4 mt-4 shadow-[6px_6px_0_black]">
            <div className="text-sm">
              <div className="font-bold text-[#166534]">TRANSACTION COMPLETED</div>
              <div className="text-[#15803d]">ID: {data.transactionId}</div>
              <div className="text-[#15803d]">Amount: {data.transactionAmount}</div>
            </div>
          </Card>
        )}

        {currentState === 'failed' && (
          <Card className="bg-red-50 border-red-300 border-4 p-4 mt-4 shadow-[6px_6px_0_black]">
            <div className="text-sm">
              <div className="font-bold text-red-700">TRANSACTION FAILED</div>
              <div className="text-red-600">{data.description}</div>
            </div>
          </Card>
        )}
      </Card>

      {/* Action Buttons */}
      {data.showButton && (
        <div className="mt-4 flex justify-center">
          <Button className={`${data.buttonColor} text-white font-bold py-3 hover:opacity-90 w-full max-w-xs border-4 border-black`} onClick={() => setCurrentState('tap')}>
            {data.buttonText}
          </Button>
        </div>
      )}

      {data.showCancel && (
        <div className="mt-4 flex justify-center">
          <Button className="bg-[#ff005c] text-white font-bold py-3 hover:opacity-90 border-4 border-black" onClick={() => setCurrentState('ready')}>
            CANCEL
          </Button>
        </div>
      )}

      {data.showNewPayment && (
        <div className="mt-4 flex justify-center">
          <Button className="bg-[#00f0ff] text-[#000000] font-bold py-3 hover:opacity-90 border-4 border-black" onClick={() => setCurrentState('ready')}>
            NEW PAYMENT
          </Button>
        </div>
      )}

      {/* Instructions */}
      <Card className="p-4 border-4 border-[#000000] shadow-[8px_8px_0_black] mt-4">
        <h4 className="font-bold text-sm mb-3">NFC PAYMENT INSTRUCTIONS</h4>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-[#ff005c] text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-xs">Enter the payment amount in SUI</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-[#ff005c] text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-xs">Click "START NFC PAYMENT" to activate the terminal</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-[#ff005c] text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-xs">Ask customer to tap their NFC-enabled card or device</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-[#ff005c] text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <span className="text-xs">Wait for payment confirmation</span>
          </div>
        </div>
      </Card>
    </div>
  );
}


