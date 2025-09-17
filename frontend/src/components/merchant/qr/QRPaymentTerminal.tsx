'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

export default function QRPaymentTerminal() {
  const [amount, setAmount] = useState<string>('0.00');
  const [description, setDescription] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Placeholder: real impl would request backend to create a QR payment session
      const payload = JSON.stringify({ amount, currency: 'SUI', description });
      setTimeout(() => {
        setQrData(payload);
        setGenerating(false);
      }, 600);
    } catch (e) {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      {/* Header */}
      <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
        <div className="flex items-center gap-3">
          <QrCode className="w-5 h-5" />
          <span className="text-xl font-extrabold tracking-wide">QR PAYMENT</span>
        </div>
        <p className="mt-3 text-sm text-gray-700">Generate QR codes for customers to scan and pay</p>
      </Card>

      {/* Payment Details */}
      <Card className="mt-5 p-5 border-4 border-black shadow-[8px_8px_0_black]">
        <h3 className="text-xl font-extrabold mb-4 tracking-wide">PAYMENT DETAILS</h3>

        <div className="mb-4">
          <div className="font-bold text-sm mb-2 tracking-wide">PAYMENT AMOUNT</div>
          <div className="flex items-center gap-2">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="border-4 border-black font-mono text-lg font-bold text-center"
            />
            <span className="font-extrabold">SUI</span>
          </div>
        </div>

        <div>
          <div className="font-bold text-sm mb-2 tracking-wide">DESCRIPTION (OPTIONAL)</div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Coffee and pastry"
            className="border-4 border-black"
          />
        </div>
      </Card>

      {/* Generate Button */}
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full max-w-md h-14 bg-[#ff005c] hover:bg-[#ff005c]/90 text-white border-4 border-black text-lg font-extrabold tracking-wide"
        >
          <div className="flex items-center justify-center gap-3">
            <QrCode className="w-5 h-5" />
            <span>GENERATE QR CODE</span>
          </div>
        </Button>
      </div>

      {/* Instructions */}
      <Card className="mt-6 p-5 border-4 border-black shadow-[8px_8px_0_black]">
        <h3 className="text-xl font-extrabold mb-4 tracking-wide">QR PAYMENT INSTRUCTIONS</h3>
        <div className="space-y-3">
          {[
            'Enter the payment amount and optional description',
            'Click "GENERATE QR CODE" to create the payment QR',
            'Show the QR code to customer for scanning',
            'Customer scans with their crypto wallet app',
          ].map((text, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#ff005c] text-white flex items-center justify-center font-extrabold text-xs border-2 border-black">
                {idx + 1}
              </div>
              <p className="text-sm text-gray-800">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Preview area (optional) */}
      {qrData && (
        <Card className="mt-6 p-5 border-4 border-black shadow-[8px_8px_0_black]">
          <h4 className="text-lg font-extrabold mb-3">QR PREVIEW (mock)</h4>
          <pre className="text-xs bg-gray-100 p-3 border-2 border-black overflow-x-auto">{qrData}</pre>
        </Card>
      )}
    </div>
  );
}


