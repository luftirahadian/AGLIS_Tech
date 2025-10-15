import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Lock, Phone, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/customer-portal/request-otp', { phone });
      
      if (response.data.success) {
        toast.success('Kode OTP telah dikirim ke WhatsApp Anda!');
        setStep('otp');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/customer-portal/verify-otp', { phone, otp });
      
      if (response.data.success) {
        // Store token
        localStorage.setItem('customerToken', response.data.data.token);
        localStorage.setItem('customerData', JSON.stringify(response.data.data.customer));
        
        toast.success('Login berhasil!');
        navigate('/customer/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Kode OTP salah atau expired');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl mb-4">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AGLIS Customer Portal</h1>
          <p className="text-gray-600">Login dengan nomor WhatsApp Anda</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'phone' ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Gunakan nomor WhatsApp yang terdaftar sebagai customer
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Mengirim OTP...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    <span>Kirim Kode OTP</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Masukkan Kode OTP</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Kode telah dikirim ke WhatsApp {phone.replace(/(\d{4})\d+(\d{3})/, '$1****$2')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode OTP (6 digit)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                ← Kembali ke input nomor
              </button>
            </form>
          )}

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Butuh bantuan?{' '}
              <a href="https://wa.me/628179380800" className="text-blue-600 hover:text-blue-700 font-medium">
                Hubungi Customer Service
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>© 2025 AGLIS Net. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;

