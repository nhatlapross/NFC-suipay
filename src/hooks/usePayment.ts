import { useState } from 'react';
import { PaymentRequest, PaymentResponse } from '@/types';
import { processPaymentAPI } from '@/lib/api-client';

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (request: PaymentRequest) => {
    setIsProcessing(true);
    setError(null);
    setPaymentResult(null);

    try {
      const result = await processPaymentAPI(request);
      setPaymentResult(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment failed';
      setError(errorMessage);
      setPaymentResult({
        success: false,
        error: errorMessage,
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPaymentResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return {
    processPayment,
    isProcessing,
    paymentResult,
    error,
    reset,
  };
}