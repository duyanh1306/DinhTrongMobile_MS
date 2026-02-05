import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { FaGoogle, FaPhoneAlt } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({ userName: '', password: '' });
  const navigate = useNavigate();

  // Xử lý khi người dùng nhập liệu
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý Login thường
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/users/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success("Đăng nhập thành công!");
      navigate('/'); // Chuyển về trang chủ
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  // Hàm chuyển hướng sang Google Login
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:9999/api/users/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">DinhTrongMobile</h1>
          <p className="text-gray-500">Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
            <input
              type="text"
              name="userName"
              className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Nhập username"
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              name="password"
              className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex justify-end">
            <Link to="/forgot-password" class="text-sm text-primary hover:underline">Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition font-semibold"
          >
            Đăng Nhập
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition bg-white text-gray-700 font-medium"
          >
            <FaGoogle className="text-red-500" /> Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
