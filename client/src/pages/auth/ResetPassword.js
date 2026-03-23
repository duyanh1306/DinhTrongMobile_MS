import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const emailParams = searchParams.get('email') || ''; 

  const [step, setStep] = useState(1); // Mặc định ở Bước 1 (Nhập OTP)
  const [otp, setOtp] = useState('');
  const [passData, setPassData] = useState({ newPassword: '', confirmPassword: '' });
  
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handlePassChange = (e) => setPassData({ ...passData, [e.target.name]: e.target.value });

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
  };

  // --- BƯỚC 1: XÁC NHẬN OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error("Vui lòng nhập đủ 6 số OTP");
    
    setLoading(true);
    try {
      await axiosClient.post('/users/verify-otp-reset', { email: emailParams, otp });
      toast.success("Mã hợp lệ! Vui lòng thiết lập mật khẩu mới.");
      setStep(2); // Mã đúng thì cho qua Bước 2
    } catch (error) {
      toast.error(error.response?.data?.message || "Mã OTP không chính xác");
    } finally {
      setLoading(false);
    }
  };

  // --- BƯỚC 2: CẬP NHẬT MẬT KHẨU MỚI ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword(passData.newPassword)) {
      return toast.error("Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ viết hoa và ký tự đặc biệt");
    }
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }

    setLoading(true);
    try {
      const res = await axiosClient.post('/users/reset-password', { 
        email: emailParams, 
        otp, 
        newPassword: passData.newPassword 
      });
      toast.success(res.data.message);
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Đặt Lại Mật Khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 
              ? <>Chúng tôi đã gửi mã xác thực tới <br/><span className="font-semibold text-primary">{emailParams}</span></>
              : "Vui lòng tạo một mật khẩu mới an toàn."
            }
          </p>
        </div>

        {/* --- FORM BƯỚC 1 --- */}
        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã OTP (6 số)</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6"
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-primary outline-none text-center tracking-widest font-bold text-lg" placeholder="000000" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-70 mt-2">
              {loading ? "Đang kiểm tra..." : "Xác Nhận Mã OTP"}
            </button>
          </form>
        )}

        {/* --- FORM BƯỚC 2 --- */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <div className="relative mt-1">
                <input type={showNewPass ? "text" : "password"} name="newPassword" value={passData.newPassword} onChange={handlePassChange} required
                  className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-primary outline-none" placeholder="••••••••" />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
              <div className="relative mt-1">
                <input type={showConfirmPass ? "text" : "password"} name="confirmPassword" value={passData.confirmPassword} onChange={handlePassChange} required
                  className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-primary outline-none" placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-70 mt-2">
              {loading ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-primary font-medium">
            Quay lại Đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;