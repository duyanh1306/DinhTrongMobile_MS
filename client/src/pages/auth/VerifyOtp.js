import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    // Tự động điền email nếu có trên URL
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      // API verify-otp này là để kích hoạt tài khoản
      await axiosClient.post('/users/verify-otp', { email, otp });
      toast.success("Kích hoạt tài khoản thành công! Hãy đăng nhập.");
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || "Mã OTP không đúng");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực OTP</h2>
        <p className="text-gray-500 mb-6 text-sm">
            Mã xác thực đã được gửi tới <b>{email}</b>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <input
            type="text"
            className="w-full text-center text-3xl tracking-[1em] font-bold py-3 border-b-2 border-gray-300 focus:border-primary focus:outline-none transition-colors"
            placeholder="......"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          
          <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition">
            Xác nhận
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;