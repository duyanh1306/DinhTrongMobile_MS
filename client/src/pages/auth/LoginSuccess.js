import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (token && userString) {
      // 1. Lưu dữ liệu vào máy
      localStorage.setItem('token', token);
      localStorage.setItem('user', decodeURIComponent(userString));
      
      try {
        const decoded = jwtDecode(token);
        const role = decoded.roleName; 

        // 2. PHÂN QUYỀN ĐIỀU HƯỚNG 
        if (role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'SALE_STAFF') {
          navigate('/sale/dashboard');
        } else if (role === 'TECHNICIAN') {
          navigate('/tech/dashboard');
        } else {
          
          navigate('/home');
        }
      } catch (error) {
        console.error("Lỗi decode token:", error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return <div className="text-center mt-20 text-xl text-primary font-bold">Đang xử lý đăng nhập Google...</div>;
};

export default LoginSuccess;