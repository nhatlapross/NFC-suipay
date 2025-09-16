import { ReactNode } from 'react';

export type PaymentState = 'ready' | 'tap' | 'processing' | 'success' | 'failed';

export interface StateData {
  amount: string;
  amountBg: string;
  icon: ReactNode;
  title: string;
  description?: string;
  showButton: boolean;
  buttonText?: string;
  buttonColor?: string;
  showCancel: boolean;
  showNewPayment: boolean;
  transactionId?: string;
  transactionAmount?: string;
}


