import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.post('/users/forgot-password', { email });
      toast.success("Đã gửi mã OTP. Vui lòng kiểm tra email.");
      // Chuyển sang trang Reset Password
      navigate(`/reset-password?email=${email}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <Link to="/login" className="flex items-center text-gray-500 hover:text-primary mb-6 transition">
            <FaArrowLeft className="mr-2" /> Quay lại đăng nhập
        </Link>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Quên mật khẩu?</h2>
        <p className="text-center text-gray-500 mb-8">
            Đừng lo, hãy nhập email để nhận mã khôi phục.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-gray-400" />
            </div>
            <input 
                type="email" 
                required 
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
                placeholder="Nhập email của bạn" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition shadow-lg transform active:scale-95"
          >
             {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
