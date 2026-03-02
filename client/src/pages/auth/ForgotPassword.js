import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post('/users/forgot-password', { email });
      toast.success(res.data.message);
      
      // Chuyển sang trang Reset Password và truyền luôn email lên thanh URL
      navigate(`/reset-password?email=${email}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gửi OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quên Mật Khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">Nhập email của bạn để nhận mã OTP.</p>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-primary outline-none" placeholder="example@email.com" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-70">
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-primary font-medium">
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;