'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSocket } from '@/hooks/useSocket';
import {
  Loader2,
  QrCode,
  Smartphone,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Store,
  User,
  Lock,
  ArrowRight,
  Wifi,
  WifiOff,
  Eye
} from 'lucide-react';

// Test data
const TEST_DATA = {
  merchant: {
    email: "merchant@testshop.com",
    password: "Password123!",
    merchantId: "mch_593200537dff4e71"
  },
  user: {
    cardUuid: "0ee8b0b0-ba0a-420f-bb45-947822ce14b3",
    pin: "1234",
    email: "customer@test.com"
  }
};

interface MerchantRequest {
  id: string;
  amount: number;
  status: string;
  qrPayload: {
    requestId: string;
    amount: number;
    merchantId: string;
  };
}

interface PaymentResult {
  success: boolean;
  message?: string;
  transaction?: {
    transactionId: string;
    txHash: string;
    amount: number;
    gasFee: number;
    totalAmount: number;
    status: string;
    explorerUrl: string;
  };
  error?: string;
  code?: string;
}

export default function TestQRPaymentPage() {
  // Merchant state
  const [amount, setAmount] = useState('0.05');
  const [description, setDescription] = useState('QR Payment Test');
  const [merchantRequest, setMerchantRequest] = useState<MerchantRequest | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  // User state
  const [cardUuid, setCardUuid] = useState(TEST_DATA.user.cardUuid);
  const [pin, setPin] = useState(TEST_DATA.user.pin);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const devices = useDevices();

  // General state
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [activeTab, setActiveTab] = useState('merchant');

  // Socket integration for real-time QR updates
  const { isConnected, qrStatus, joinQRRoom, leaveQRRoom, resetQRStatus } = useSocket({
    enableQRUpdates: true,
    qrRequestId: merchantRequest?.id
  });

  useEffect(() => {
    checkServerHealth();
  }, []);

  // Handle QR status updates from socket
  useEffect(() => {
    if (qrStatus) {
      console.log('🔄 Received QR status update:', qrStatus);

      // Update merchant request status based on socket updates
      if (merchantRequest && qrStatus.requestId === merchantRequest.id) {
        setMerchantRequest(prev => prev ? {
          ...prev,
          status: qrStatus.status
        } : null);

        // Auto-complete payment result when payment is completed via socket
        if (qrStatus.status === 'completed' && qrStatus.txHash) {
          setPaymentResult({
            success: true,
            message: 'Payment completed successfully via real-time update!',
            transaction: {
              transactionId: qrStatus.transactionId || '',
              txHash: qrStatus.txHash,
              amount: qrStatus.amount || 0,
              gasFee: qrStatus.gasFee || 0,
              totalAmount: qrStatus.totalAmount || 0,
              status: 'completed',
              explorerUrl: qrStatus.explorerUrl || ''
            }
          });
        }
      }
    }
  }, [qrStatus, merchantRequest]);

  // Join QR room when merchant request is created
  useEffect(() => {
    if (merchantRequest && isConnected) {
      console.log('📱 Joining QR room for request:', merchantRequest.id);
      joinQRRoom(merchantRequest.id);
    }
  }, [merchantRequest, isConnected, joinQRRoom]);

  const checkServerHealth = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                        `http://${window.location.hostname}:8080`;

      const response = await fetch(`${backendUrl}/health`);
      if (response.ok) {
        setServerStatus('online');
        console.log('✅ Backend is online');
      } else {
        setServerStatus('offline');
        console.log('❌ Backend responded with error');
      }
    } catch (error) {
      setServerStatus('offline');
      console.log('❌ Backend connection failed:', error);
    }
  };

  // QR Scanner handlers
  const handleQRScan = (result:any) => {
    if (result && result[0]?.rawValue) {
      console.log('📱 QR Code detected:', result[0].rawValue);
      setScannedData(result[0].rawValue);
      setIsScanning(false);

      // Parse and set merchant request from scanned data
      try {
        const scannedPayload = JSON.parse(result[0].rawValue);
        setMerchantRequest({
          id: scannedPayload.requestId,
          amount: scannedPayload.amount,
          status: 'scanned',
          qrPayload: scannedPayload
        });
        console.log('✅ QR data parsed and set as merchant request');
        alert('QR Code scanned successfully! You can now enter PIN to complete payment.');
      } catch (error) {
        console.error('❌ Failed to parse QR data:', error);
        alert('Invalid QR code format for payment.');
      }
    }
  };

  const handleQRError = (error:any) => {
    console.error('📱 QR Scanner error:', error);
  };

  const startQRScan = () => {
    setIsScanning(true);
    setScannedData(null);
    console.log('📷 Starting QR scanner...');
  };

  const stopQRScan = () => {
    setIsScanning(false);
    console.log('🛑 QR scanner stopped');
  };

  const simulateQRScan = () => {
    console.log('🎭 Simulating QR scan from external source...');

    // Simulate scanning QR from another browser/device
    const simulatedQRData = {
      requestId: "676a1b2c3d4e5f6789abcdef",
      amount: 0.05,
      merchantId: "mch_593200537dff4e71"
    };

    const qrData = JSON.stringify(simulatedQRData);
    setScannedData(qrData);

    // Parse and set merchant request from scanned data
    try {
      const scannedPayload = JSON.parse(qrData);
      setMerchantRequest({
        id: scannedPayload.requestId,
        amount: scannedPayload.amount,
        status: 'scanned',
        qrPayload: scannedPayload
      });
      console.log('✅ QR data parsed and set as merchant request');
      alert(`QR Code scanned from external source!\nAmount: ${scannedPayload.amount} SUI\nMerchant: ${scannedPayload.merchantId}`);
    } catch (error) {
      console.error('❌ Failed to parse QR data:', error);
      alert('Failed to parse QR code data');
    }
  };

  // Merchant functions

  const testDebugEndpoint = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                        `http://${window.location.hostname}:8080`;

      console.log('🔍 Testing debug endpoint...');

      const response = await fetch(`${backendUrl}/api/payment/test/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description,
          test: true
        }),
      });

      const data = await response.json();
      console.log('Debug response:', data);
      alert(`Debug test: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Debug test error:', error);
      alert(`Debug test failed: ${error}`);
    }
  };

  const createPaymentRequest = async () => {
    setIsCreatingRequest(true);
    setMerchantRequest(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                        `http://${window.location.hostname}:8080`;

      console.log('📦 Creating payment request...');

      // Use test endpoint that doesn't require auth
      console.log('🧪 Using test endpoint...');

      const response = await fetch(`${backendUrl}/api/payment/test/merchant-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description
        }),
      });

      const responseText = await response.text();
      console.log('Create request response status:', response.status);
      console.log('Create request response text:', responseText);

      // Check if it's a validation error
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(responseText);
          console.log('❌ Validation errors:', errorData.errors || errorData.error);
          alert(`Validation error: ${JSON.stringify(errorData.errors || errorData.error, null, 2)}`);
          return;
        } catch (e) {
          console.log('❌ 400 error but not JSON:', responseText);
          alert(`400 Bad Request: ${responseText}`);
          return;
        }
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse create request response:', parseError);
        alert(`Server response error: ${responseText.slice(0, 100)}...`);
        return;
      }

      if (data.success) {
        setMerchantRequest(data.request);
        console.log('✅ Payment request created:', data.request);
        // Don't auto-switch tabs - let user decide
      } else {
        console.log('❌ Failed to create payment request:', data.error);
        alert(`Failed to create payment request: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Create payment request error:', error);
      alert(`Request creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingRequest(false);
    }
  };


  const checkRequestStatus = async () => {
    if (!merchantRequest) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                        `http://${window.location.hostname}:8080`;

      const response = await fetch(`${backendUrl}/api/payment/test/merchant-request/${merchantRequest.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (data.success) {
        setMerchantRequest(prev => prev ? { ...prev, status: data.request.status } : null);
        console.log('✅ Request status updated:', data.request.status);
      }
    } catch (error) {
      console.error('Check status error:', error);
    }
  };

  // User functions
  const processQRPayment = async () => {
    if (!merchantRequest) {
      alert('Please create a payment request first (switch to Merchant tab)');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentResult(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                        `http://${window.location.hostname}:8080`;

      // Simulate QR code scanning by using the merchant request data
      const qrData = {
        requestId: merchantRequest.id,
        amount: merchantRequest.amount,
        merchantId: merchantRequest.qrPayload.merchantId
      };

      console.log('📱 Processing QR payment with data:', qrData);

      // Process payment using the direct payment endpoint
      const response = await fetch(`${backendUrl}/api/payment/process-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardUuid: cardUuid,
          amount: qrData.amount,
          merchantId: qrData.merchantId,
          terminalId: "QR_PAYMENT_APP",
          pin: pin,
          requestId: qrData.requestId // Include request ID for reference
        }),
      });

      const data: PaymentResult = await response.json();
      setPaymentResult(data);

      if (data.success) {
        console.log('✅ QR Payment successful');
        // Update merchant request status
        setTimeout(checkRequestStatus, 1000);
      } else {
        console.log('❌ QR Payment failed:', data.error);
      }
    } catch (error) {
      console.error('QR payment error:', error);
      setPaymentResult({
        success: false,
        error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetTest = () => {
    setMerchantRequest(null);
    setPaymentResult(null);
    setAmount('0.05');
    setDescription('QR Payment Test');
    setCardUuid(TEST_DATA.user.cardUuid);
    setPin(TEST_DATA.user.pin);
    setActiveTab('merchant');
    setIsCreatingRequest(false);
    setIsProcessingPayment(false);
    resetQRStatus();
  };

  const generateQRCodeURL = (data: any) => {
    const qrString = JSON.stringify(data);
    // Simple QR code generation using Google Charts API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">QR Payment Test System</h1>
        <p className="text-gray-600 mb-4">
          Test quy trình thanh toán QR: Merchant tạo QR → User quét QR → Nhập PIN → Xác nhận thanh toán
        </p>
        <div className="flex items-center gap-2">
          <Badge variant={serverStatus === 'online' ? 'default' : 'destructive'}>
            Backend: {serverStatus}
          </Badge>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            Socket: {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          {qrStatus && (
            <Badge variant="outline" className="bg-blue-50">
              <Eye className="h-3 w-3 mr-1" />
              QR Status: {qrStatus.status}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={checkServerHealth}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={resetTest}>
            🔄 Reset Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Process Flow */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Payment Flow Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  merchantRequest ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Store className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">1. Merchant tạo QR</span>
              </div>

              <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  merchantRequest ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">2. Hiển thị QR Code</span>
              </div>

              <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  paymentResult?.success ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Smartphone className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">3. User quét QR</span>
              </div>

              <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  paymentResult?.success ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Lock className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">4. Nhập PIN</span>
              </div>

              <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  paymentResult?.success ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <CheckCircle className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">5. Hoàn thành</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Tab Implementation */}
      <div className="w-full">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('merchant')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'merchant'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Store className="h-4 w-4" />
            Merchant (Tạo QR)
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'user'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4" />
            User (Quét QR & Thanh toán)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'merchant' && (
          <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Merchant Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Merchant Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Số tiền (SUI)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isCreatingRequest}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Mô tả giao dịch</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isCreatingRequest}
                    placeholder="VD: Thanh toán hóa đơn"
                  />
                </div>

                <Separator />

                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Merchant ID:</strong> {TEST_DATA.merchant.merchantId}</p>
                  <p><strong>Authentication:</strong> API Key based</p>
                  <Badge variant="default">Ready to create QR</Badge>
                </div>


                <div className="space-y-2">
                  <Button
                    onClick={testDebugEndpoint}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    🔍 Test Debug Endpoint
                  </Button>

                  <Button
                    onClick={createPaymentRequest}
                    disabled={isCreatingRequest || serverStatus !== 'online' || !amount}
                    className="w-full"
                    size="lg"
                  >
                    {isCreatingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo QR...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Tạo QR Thanh Toán
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Display
                  {merchantRequest && (
                    <Button variant="outline" size="sm" onClick={checkRequestStatus}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Status
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {merchantRequest ? (
                  <>
                    <div className="bg-white p-4 rounded-lg border inline-block">
                      <img
                        src={generateQRCodeURL(merchantRequest.qrPayload)}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Badge
                        variant={merchantRequest.status === 'completed' ? 'default' : 'secondary'}
                        className="text-lg px-4 py-2"
                      >
                        Status: {merchantRequest.status}
                      </Badge>

                      {/* Real-time status updates from socket */}
                      {qrStatus && qrStatus.requestId === merchantRequest.id && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                          <h5 className="font-semibold text-blue-900 mb-2">🔴 Real-time Updates</h5>
                          <div className="text-blue-800 space-y-1">
                            <p><strong>Current Status:</strong> {qrStatus.status}</p>
                            <p><strong>Last Update:</strong> {new Date(qrStatus.timestamp).toLocaleTimeString()}</p>

                            {qrStatus.status === 'scanned' && qrStatus.userInfo && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                                <p className="font-medium text-yellow-800">📱 QR Code was scanned!</p>
                                <p className="text-yellow-700 text-xs">Card ending in: ***{qrStatus.userInfo.cardLast4}</p>
                              </div>
                            )}

                            {qrStatus.status === 'completed' && qrStatus.txHash && (
                              <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                                <p className="font-medium text-green-800">✅ Payment Completed!</p>
                                <p className="text-green-700 text-xs">Amount: {qrStatus.amount} SUI</p>
                                <p className="text-green-700 text-xs">Gas: {qrStatus.gasFee} SUI</p>
                              </div>
                            )}

                            {qrStatus.status === 'failed' && qrStatus.error && (
                              <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                                <p className="font-medium text-red-800">❌ Payment Failed</p>
                                <p className="text-red-700 text-xs">{qrStatus.error}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-sm space-y-1">
                        <p><strong>Request ID:</strong> {merchantRequest.id}</p>
                        <p><strong>Amount:</strong> {merchantRequest.amount} SUI</p>
                        <p><strong>Merchant ID:</strong> {merchantRequest.qrPayload.merchantId}</p>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        QR Code chứa thông tin thanh toán. User có thể quét để thực hiện giao dịch.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-gray-400">
                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>QR Code sẽ hiển thị ở đây sau khi tạo payment request</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </div>
        )}

        {/* User Tab Content */}
        {activeTab === 'user' && (
          <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Scanner */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-900 mb-2">📷 Professional QR Scanner</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Scan QR codes from any source with professional camera integration
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="default" className="text-xs">
                      Library: @yudiel/react-qr-scanner
                    </Badge>
                    <Badge variant={devices.length > 0 ? 'default' : 'secondary'} className="text-xs">
                      Cameras: {devices.length} found
                    </Badge>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <Button
                      onClick={startQRScan}
                      disabled={isScanning}
                      variant="default"
                      size="sm"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          📷 Start QR Scanner
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={simulateQRScan}
                      variant="outline"
                      size="sm"
                    >
                      🎭 Simulate QR
                    </Button>

                    {isScanning && (
                      <Button
                        onClick={stopQRScan}
                        variant="outline"
                        size="sm"
                      >
                        Stop Scanner
                      </Button>
                    )}
                  </div>

                  {isScanning && (
                    <div className="mt-3">
                      <div className="relative rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '350px', height: '300px' }}>
                        <Scanner
                          onScan={handleQRScan}
                          onError={handleQRError}
                          formats={['qr_code']}
                          allowMultiple={false}
                          scanDelay={500}
                          styles={{
                            container: {
                              width: '100%',
                              height: '100%',
                              borderRadius: '8px'
                            }
                          }}
                        />

                        {/* Instructions overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-center">
                          <div className="text-sm font-medium">📱 QR Scanner Active</div>
                          <div className="text-xs text-green-300">
                            Position QR code within the finder frame
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {merchantRequest ? (
                  <>
                    {/* QR Info Display */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        📱 {scannedData ? 'QR Code Scanned' : 'Available QR Code'}
                      </h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Amount:</strong> {merchantRequest.amount} SUI</p>
                        <p><strong>Merchant:</strong> {merchantRequest.qrPayload.merchantId}</p>
                        <p><strong>Request ID:</strong> {merchantRequest.id}</p>
                        {scannedData && (
                          <div><strong>Status:</strong> <Badge variant="default" className="text-xs">Scanned ✅</Badge></div>
                        )}
                      </div>
                    </div>

                    {/* User Credentials */}
                    <div>
                      <Label htmlFor="userCardUuid">Card UUID</Label>
                      <Input
                        id="userCardUuid"
                        value={cardUuid}
                        onChange={(e) => setCardUuid(e.target.value)}
                        disabled={isProcessingPayment}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="userPin">PIN (4 digits)</Label>
                      <Input
                        id="userPin"
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        disabled={isProcessingPayment}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>

                    <Button
                      onClick={processQRPayment}
                      disabled={isProcessingPayment || !pin || pin.length !== 4}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý thanh toán...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Xác nhận thanh toán
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">Chưa scan QR code nào</p>
                    <p className="text-sm text-gray-400">
                      Sử dụng camera scanner ở trên để scan QR code từ:
                    </p>
                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                      <p>• Merchant terminal khác</p>
                      <p>• Website/app khác trên browser khác</p>
                      <p>• Tab Merchant của app này</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={simulateQRScan}
                      className="mt-4"
                    >
                      🎭 Test với QR mẫu
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Result */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Payment Result
                  {paymentResult && (
                    paymentResult.success ?
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentResult ? (
                  paymentResult.success && paymentResult.transaction ? (
                    <div className="space-y-3">
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-700">
                          ✅ {paymentResult.message || 'Thanh toán thành công!'}
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <p><strong>Transaction ID:</strong></p>
                          <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded">
                            {paymentResult.transaction.transactionId}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p><strong>Amount:</strong> {paymentResult.transaction.amount} SUI</p>
                            <p><strong>Gas Fee:</strong> {paymentResult.transaction.gasFee} SUI</p>
                            <p><strong>Total:</strong> {paymentResult.transaction.totalAmount} SUI</p>
                          </div>
                          <div>
                            <Badge className="bg-green-100 text-green-800">
                              {paymentResult.transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p><strong>Blockchain Hash:</strong></p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-gray-100 p-1 rounded break-all flex-1">
                            {paymentResult.transaction.txHash}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(paymentResult.transaction?.explorerUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        ❌ {paymentResult.error || 'Payment failed'}
                        {paymentResult.code && ` (${paymentResult.code})`}
                      </AlertDescription>
                    </Alert>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Kết quả thanh toán sẽ hiển thị ở đây</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </div>
        )}
      </div>

      {/* Test Scenarios */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setAmount('0.05');
                setDescription('Valid Payment Test');
                setCardUuid(TEST_DATA.user.cardUuid);
                setPin(TEST_DATA.user.pin);
              }}
            >
              🟢 Valid Payment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAmount('0.05');
                setDescription('Invalid PIN Test');
                setCardUuid(TEST_DATA.user.cardUuid);
                setPin('0000');
              }}
            >
              🔴 Invalid PIN
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAmount('1.0');
                setDescription('High Amount Test');
                setCardUuid(TEST_DATA.user.cardUuid);
                setPin(TEST_DATA.user.pin);
              }}
            >
              💰 High Amount
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}