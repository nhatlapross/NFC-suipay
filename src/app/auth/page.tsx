'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { verifyOtpAPI, resendOtpAPI } from '@/lib/api-client';

type AuthMode = 'login' | 'register' | 'verify';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  
  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      setMessage('Đăng nhập thành công!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await register({ email, password, fullName, phoneNumber });
      setMessage('Đăng ký thành công! Vui lòng xác thực số điện thoại.');
      setMode('verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await verifyOtpAPI(phoneNumber, otp);
      if (response.success) {
        setMessage('Xác thực thành công! Bạn có thể đăng nhập.');
        setMode('login');
      } else {
        setError('Mã OTP không hợp lệ');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    
    try {
      await resendOtpAPI(phoneNumber);
      setMessage('Đã gửi lại mã OTP');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">NFC Payment</h2>
          <p className="mt-2 text-gray-600">
            {mode === 'login' && 'Đăng nhập vào tài khoản'}
            {mode === 'register' && 'Tạo tài khoản mới'}
            {mode === 'verify' && 'Xác thực số điện thoại'}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-blue-600 hover:text-blue-500"
              >
                Chưa có tài khoản? Đăng ký
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+84901234567"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-500"
              >
                Đã có tài khoản? Đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* OTP Verification Form */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mã xác thực (OTP)
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Nhập mã 6 số đã được gửi đến {phoneNumber}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Xác thực'}
            </button>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                Gửi lại mã OTP
              </button>
              <br />
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-gray-600 hover:text-gray-500"
              >
                Trở về đăng ký
              </button>
            </div>
          </form>
        )}

        {/* Test Backend Connection */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Test Backend</h3>
          <div className="text-xs text-gray-600">
            <p>Backend URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}</p>
            <p>Status: {loading ? 'Connecting...' : 'Ready'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}