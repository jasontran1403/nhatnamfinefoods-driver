// src/components/modals/CreateDriverModal.tsx
import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { driversApi } from '../../services/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateDriverModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!form.fullName || !form.username || !form.password) {
      setError('Vui lòng điền đầy đủ họ tên, tài khoản và mật khẩu');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await driversApi.createDriver(form);
      setSuccess(`Tạo tài khoản "${form.username}" thành công!`);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Tài khoản đã tồn tại hoặc có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Tạo tài khoản tài xế</h2>
            <p className="text-sm text-gray-500 mt-0.5">Thêm tài xế mới vào hệ thống</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Họ tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
              placeholder="Nguyễn Văn B"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Tài khoản */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
              placeholder="driver2"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            <p className="text-xs text-gray-400 mt-1">Chữ thường, không dấu, không khoảng trắng</p>
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số điện thoại
            </label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="0901234567"
              type="tel"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
              ✅ {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!success}
            className="px-6 py-2.5 text-sm font-semibold bg-[#1A237E] text-white rounded-xl hover:bg-[#283593] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang tạo...
              </>
            ) : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}
