// src/pages/LoginSuccess.js
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Có thể gọi thêm API lấy thông tin user ở đây nếu cần
      navigate('/'); 
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return <div className="text-center mt-20">Đang xử lý đăng nhập...</div>;
};

export default LoginSuccess;