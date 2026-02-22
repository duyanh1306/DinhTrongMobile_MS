import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- 1. Import Layouts ---
import AdminLayout from './layouts/AdminLayout';
import SaleLayout from './layouts/SaleLayout';
import TechLayout from './layouts/TechLayout';
import CustomerLayout from './layouts/CustomerLayout';

// --- 2. Import Auth Pages ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import LoginSuccess from './pages/auth/LoginSuccess';

// --- 3. Import Role-Based Pages ---
// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStores from "./pages/admin/ManageStore";
import ManageUser from "./pages/admin/ManageUser";
// Sale Staff
import SaleDashboard from './pages/saleStaff/SaleDashboard';
// Technician
import TechDashboard from './pages/technician/TechDashboard';
// Customer
import Home from './pages/customer/Home';
// (Tùy chọn) Component trang cá nhân cho khách hàng nếu muốn dùng CustomerLayout
const CustomerProfile = () => <h2 className="text-xl font-bold">Thông tin tài khoản khách hàng</h2>;

// --- 4. Component Bảo vệ Route (Private Route) ---
// Giúp chặn người chưa login hoặc sai quyền truy cập vào các trang nội bộ
const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // user.roleId.id là do backend trả về (VD: "ADMIN", "SALE_STAFF"...)
  // Cần đảm bảo backend populate roleId, hoặc lưu roleName vào localStorage lúc login
  const userRole = user.roleId?.id || user.roleId; 

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />; // Không đủ quyền thì đá về trang chủ
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES (Ai cũng vào được) ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login-success" element={<LoginSuccess />} />

        {/* ================= ADMIN ROUTES ================= */}
        <Route 
          path="/admin/dashboard" 
          element={
            // <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            // {/* </PrivateRoute> */}
          } 
        />
        <Route path="/admin/stores" element={<ManageStores />} />
        <Route path="/admin/users" element={<ManageUser />} />
        {/* Bạn có thể thêm các route admin khác ở đây, ví dụ: /admin/users */}
        
        {/* ================= SALE STAFF ROUTES ================= */}
        <Route 
          path="/sale/dashboard" 
          element={
            <PrivateRoute allowedRoles={['SALE_STAFF']}>
              <SaleLayout>
                <SaleDashboard />
              </SaleLayout>
            </PrivateRoute>
          } 
        />
        {/* Ví dụ: /sale/orders, /sale/products */}

        {/* ================= TECHNICIAN ROUTES ================= */}
        <Route 
          path="/tech/dashboard" 
          element={
            <PrivateRoute allowedRoles={['TECHNICIAN']}>
              <TechLayout>
                <TechDashboard />
              </TechLayout>
            </PrivateRoute>
          } 
        />
        {/* Ví dụ: /tech/tasks */}

        {/* ================= CUSTOMER ACCOUNT ROUTES ================= */}
        {/* Các trang quản lý tài khoản của khách (Profile, Lịch sử mua hàng...) */}
        <Route 
          path="/account/*" 
          element={
            <PrivateRoute allowedRoles={['CUSTOMER']}>
              <CustomerLayout>
                 <Routes>
                    <Route path="profile" element={<CustomerProfile />} />
                    {/* Thêm các route con khác nếu cần */}
                 </Routes>
              </CustomerLayout>
            </PrivateRoute>
          } 
        />

        {/* ================= 404 NOT FOUND ================= */}
        <Route path="*" element={<div className="text-center mt-20 text-2xl">404 - Trang không tồn tại</div>} />
      </Routes>

      {/* Component hiển thị thông báo (Toast) toàn cục */}
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;