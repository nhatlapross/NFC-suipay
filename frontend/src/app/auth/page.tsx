'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { verifyOtpAPI, resendOtpAPI, getUserProfileAPI, forgotPasswordAPI } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const { login, register } = useAuth();
  const router = useRouter();

  // Note: Do not auto-redirect away; allow visiting /auth even if logged in
  const { user } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      setMessage('Đăng nhập thành công!');
      // Fetch profile to determine role-based redirect
      try {
        const profile: any = await getUserProfileAPI();
        const role = profile?.user?.role;
        if (role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
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
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        setLoading(false);
        return;
      }
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
      const response: any = await verifyOtpAPI(phoneNumber, otp);
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

  const isRegister = mode === 'register';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isRegister ? 'bg-neo-pink' : 'bg-neo-cyan'}`}>
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-mono font-bold text-3xl text-neo-white tracking-wider">HYBRID WALLET</h1>
          <p className={`font-mono text-xs ${isRegister ? 'text-neo-white' : 'text-neo-black'} opacity-80 mt-1`}>
            {isRegister ? 'JOIN THE REVOLUTION' : 'SECURE • FAST • BRUTAL'}
          </p>
        </div>

        {/* Panel */}
        <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
          <h2 className="font-mono font-bold text-xl text-neo-black text-center mb-6">
            {mode === 'login' && 'LOGIN'}
            {mode === 'register' && 'CREATE ACCOUNT'}
            {mode === 'verify' && 'VERIFY OTP'}
          </h2>

          {/* Messages */}
          {message && (
            <div className="mb-4 p-3 border-2 border-neo-black bg-green-100 font-mono text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 border-2 border-neo-black bg-red-100 font-mono text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white focus:outline-none focus:shadow-brutal"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white focus:outline-none focus:shadow-brutal"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neo-pink text-neo-white font-mono font-bold border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow disabled:opacity-50"
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError('Please enter your email first');
                      return;
                    }
                    setLoading(true);
                    setError('');
                    setMessage('');
                    try {
                      await forgotPasswordAPI(email);
                      setMessage('Password reset link sent (if account exists)');
                    } catch (err: any) {
                      setError(err?.response?.data?.error || 'Failed to send reset link');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="font-mono text-xs underline"
                >
                  FORGOT PASSWORD?
                </button>
              </div>
              {/* moved create account CTA below panel */}
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white focus:outline-none focus:shadow-brutal"
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white focus:outline-none focus:shadow-brutal"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white focus:outline-none focus:shadow-brutal"
                  required
                  minLength={8}
                />
              </div>
              {/* Required fields for backend */}
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">FULL NAME</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white focus:outline-none focus:shadow-brutal"
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">PHONE NUMBER</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+84901234567"
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white focus:outline-none focus:shadow-brutal"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neo-pink text-neo-white font-mono font-bold border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow disabled:opacity-50"
              >
                {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          )}

          {/* OTP Verification Form */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-neo-black mb-2">VERIFICATION CODE (OTP)</label>
                <p className="font-mono text-xs text-neo-black opacity-70 mb-2">Enter the 6-digit code sent to {phoneNumber}</p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white text-center text-2xl tracking-widest focus:outline-none focus:shadow-brutal"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neo-pink text-neo-white font-mono font-bold border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow disabled:opacity-50"
              >
                {loading ? 'VERIFYING...' : 'VERIFY'}
              </button>
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="font-mono text-xs underline disabled:opacity-50"
                >
                  RESEND OTP
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-mono text-xs underline"
                >
                  BACK TO REGISTER
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom CTA */}
        {mode === 'login' && (
          <div className="mt-6">
            <p className="font-mono text-center text-xs text-neo-black opacity-80 mb-3">
              NEW TO HYBRID WALLET?
            </p>
            <button
              type="button"
              onClick={() => setMode('register')}
              className="w-full py-3 bg-neo-blue text-neo-black font-mono font-bold border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow"
            >
              CREATE ACCOUNT
            </button>
          </div>
        )}

        {mode === 'register' && (
          <div className="mt-6">
            <p className="font-mono font-bold text-center text-xs text-neo-white opacity-80 mb-3">
              ALREADY HAVE AN ACCOUNT?
            </p>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-3 bg-neo-cyan text-neo-black font-mono font-bold border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow"
            >
              LOGIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}