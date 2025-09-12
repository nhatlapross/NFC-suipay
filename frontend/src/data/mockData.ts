import { Transaction, WalletData, UserProfile } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'payment',
    amount: -45.99,
    description: 'Coffee Shop Payment',
    date: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    type: 'received',
    amount: 250.00,
    description: 'Salary Deposit',
    date: '2024-01-14T09:00:00Z',
    status: 'completed'
  },
  {
    id: '3',
    type: 'transfer',
    amount: -89.50,
    description: 'Transfer to John Doe',
    date: '2024-01-13T16:45:00Z',
    status: 'completed'
  },
  {
    id: '4',
    type: 'payment',
    amount: -12.99,
    description: 'Subscription Payment',
    date: '2024-01-12T14:20:00Z',
    status: 'completed'
  },
  {
    id: '5',
    type: 'received',
    amount: 75.00,
    description: 'Refund from Store',
    date: '2024-01-11T11:15:00Z',
    status: 'completed'
  },
  {
    id: '6',
    type: 'payment',
    amount: -156.78,
    description: 'Online Shopping',
    date: '2024-01-10T19:30:00Z',
    status: 'pending'
  },
  {
    id: '7',
    type: 'transfer',
    amount: -200.00,
    description: 'Rent Payment',
    date: '2024-01-09T08:00:00Z',
    status: 'completed'
  }
];

export const mockWalletData: WalletData = {
  balance: 2847.63,
  cardLocked: false,
  dailyLimit: 1000,
  otpEnabled: true,
  twoFactorEnabled: false
};

export const mockUserProfile: UserProfile = {
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  phone: '+1 (555) 123-4567',
  recoveryEmail: 'alex.recovery@email.com',
  multiSigEnabled: false
};
