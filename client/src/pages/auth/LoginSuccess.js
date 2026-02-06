import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      
      try {
        // Giải mã token để lấy roleName
        const decoded = jwtDecode(token);
        const role = decoded.roleName; // Backend bạn đặt tên key là roleName

        // --- PHÂN QUYỀN ĐIỀU HƯỚNG ---
        if (role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'SALE_STAFF') {
          navigate('/sale/dashboard');
        } else if (role === 'TECHNICIAN') {
          navigate('/technician/dashboard');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Lỗi decode token:", error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return <div className="text-center mt-20">Đang xử lý đăng nhập...</div>;
};

export default LoginSuccess;