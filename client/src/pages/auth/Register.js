import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ fullName: '', userName: '', email: '', number: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(formData.password)) {
      return toast.error("Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ viết hoa và ký tự đặc biệt");
    }

    setLoading(true);
    try {
      const res = await axiosClient.post('/users/register', formData);
      toast.success(res.data.message);
      // Chuyển sang trang Verify OTP và truyền email theo
      navigate(`/verify-otp?email=${formData.email}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">DinhTrongMobile</h1>
          <p className="text-gray-500">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input type="text" name="fullName" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
              <input type="text" name="userName" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-primary outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ Email</label>
            <input type="email" name="email" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-primary outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input type="text" name="number" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-primary outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative mt-1">
              <input type={showPassword ? "text" : "password"} name="password" onChange={handleChange} required
                className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-primary outline-none" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt.</p>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-70 mt-4">
            {loading ? "Đang xử lý..." : "Đăng Ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản? <Link to="/login" className="text-primary font-semibold hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;