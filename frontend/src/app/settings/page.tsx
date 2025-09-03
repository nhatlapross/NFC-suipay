'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, CreditCard, Bell, User, Save } from 'lucide-react';
import { toast } from '@/components/ui/toaster';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    dailyLimit: user?.dailyLimit || 1000,
    monthlyLimit: user?.monthlyLimit || 10000,
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    security: {
      twoFactor: false,
      biometric: false,
    },
  });

  const handleSave = async () => {
    try {
      // Call API to update settings
      toast({
        type: 'success',
        title: 'Cài đặt đã được lưu',
      });
    } catch (error) {
      toast({
        type: 'error',
        title: 'Lỗi khi lưu cài đặt',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Cài đặt</h1>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <User className="w-6 h-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ tên
            </label>
            <input
              type="text"
              value={user?.fullName || ''}
              className="w-full px-3 py-2 border rounded-lg"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2 border rounded-lg"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Card Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <CreditCard className="w-6 h-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold">Giới hạn chi tiêu</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới hạn hàng ngày (SUI)
            </label>
            <input
              type="number"
              value={settings.dailyLimit}
              onChange={(e) => setSettings({ ...settings, dailyLimit: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới hạn hàng tháng (SUI)
            </label>
            <input
              type="number"
              value={settings.monthlyLimit}
              onChange={(e) => setSettings({ ...settings, monthlyLimit: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <Bell className="w-6 h-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold">Thông báo</h2>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span>Email notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email: e.target.checked }
              })}
              className="w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between">
            <span>SMS notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.sms}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, sms: e.target.checked }
              })}
              className="w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Push notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.push}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, push: e.target.checked }
              })}
              className="w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold">Bảo mật</h2>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span>Xác thực 2 yếu tố</span>
            <input
              type="checkbox"
              checked={settings.security.twoFactor}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, twoFactor: e.target.checked }
              })}
              className="w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Đăng nhập sinh trắc học</span>
            <input
              type="checkbox"
              checked={settings.security.biometric}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, biometric: e.target.checked }
              })}
              className="w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
      >
        <Save className="w-5 h-5" />
        <span>Lưu thay đổi</span>
      </button>
    </div>
  );
}