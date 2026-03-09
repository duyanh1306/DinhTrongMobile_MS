import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "./layouts/AdminLayout";
import SaleLayout from "./layouts/SaleLayout";
import TechLayout from "./layouts/TechLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import LoginSuccess from "./pages/auth/LoginSuccess";
import Home from "./pages/customer/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStores from "./pages/admin/ManageStore";
import ManageUser from "./pages/admin/ManageUser";
import SaleDashboard from "./pages/saleStaff/SaleDashboard";
import TechDashboard from "./pages/technician/TechDashboard";
import Profile from "./pages/common/Profile";
import AdminPhoneModel from "./pages/admin/AdminPhoneModel";
import AdminItemType from "./pages/admin/AdminItemType";
import AdminItem from "./pages/admin/AdminItem";
import ManageRepairService from "./pages/admin/ManageRepairService";
import PurchaseHistory from "./pages/admin/PurchaseHistory";
import SalesHistory from "./pages/admin/SalesHistory";
import RepairHistory from "./pages/admin/RepairHistory";
import InventoryTransactionList from "./pages/admin/InventoryTransactionList";
import TransferRequestList from "./pages/admin/TransferRequestList";
import AdminPhone from "./pages/admin/AdminPhone";
import PhoneDetail from "./pages/customer/PhoneDetail";
import SearchResults from "./pages/customer/SearchResults";
import Cart from "./pages/customer/Cart";
import OrderHistory from "./pages/customer/OrderHistory";
import AssemblePhone from "./pages/technician/AssemblePhone";
import SaleOrders from "./pages/saleStaff/SaleOrders";
import SalePOS from "./pages/saleStaff/SalePOS";
import BuildPhone from "./pages/customer/BuildPhone";
import OrderDetail from "./pages/customer/OrderDetail";
const CustomerProfile = () => (
  <h2 className="text-xl font-bold">Thông tin tài khoản khách hàng</h2>
);

// Giúp chặn người chưa login hoặc sai quyền truy cập vào các trang nội bộ
const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

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
// Tự động bọc Profile bằng Sidebar tương ứng với chức vụ
const RoleBasedLayout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return children;

  const role = user.roleId?.id || user.roleId;

  switch (role) {
    case "ADMIN":
      return <AdminLayout>{children}</AdminLayout>;
    case "SALE_STAFF":
      return <SaleLayout>{children}</SaleLayout>;
    case "TECHNICIAN":
      return <TechLayout>{children}</TechLayout>;
    case "CUSTOMER":
    default:
      return <CustomerLayout>{children}</CustomerLayout>;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES (Ai cũng vào được) ================= */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/product/:id" element={<PhoneDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/build-phone" element={<BuildPhone />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/order-detail/:id" element={<OrderDetail />} />
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
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </PrivateRoute>
          }
        />
         <Route
                    path="/admin/phones"
                    element={
                        <PrivateRoute allowedRoles={['ADMIN']}>
                            <AdminLayout>
                                <AdminPhone/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
        <Route
          path="/admin/phone_model"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminPhoneModel />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/item_type"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminItemType />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/items"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminItem />
              </AdminLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/repair_service"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <ManageRepairService />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/repair_history"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <RepairHistory />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/purchase_history"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <PurchaseHistory />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/sales_history"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <SalesHistory />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/inventory_transactions"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <InventoryTransactionList />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
    path="/admin/transfer_requests"
    element={
        <PrivateRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
                <TransferRequestList/>
            </AdminLayout>
        </PrivateRoute>
    }
/>
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route path="/admin/stores" element={<ManageStores />} />
        <Route path="/admin/users" element={<ManageUser />} />

        {/* ================= SALE STAFF ROUTES ================= */}
        <Route
          path="/sale/dashboard"
          element={
            <PrivateRoute allowedRoles={["SALE_STAFF"]}>
              <SaleLayout>
                <SaleDashboard />
              </SaleLayout>
            </PrivateRoute>
          }
        />
<Route
  path="/sale/orders"
  element={
    <PrivateRoute allowedRoles={["SALE_STAFF"]}>
      <SaleLayout>
        <SaleOrders />
      </SaleLayout>
    </PrivateRoute>
  }
/>
<Route
  path="/sale/pos"
  element={
    <PrivateRoute allowedRoles={["SALE_STAFF"]}>
      <SaleLayout>
        <SalePOS />
      </SaleLayout>
    </PrivateRoute>
  }
/>
        {/* ================= TECHNICIAN ROUTES ================= */}
        <Route
          path="/tech/dashboard"
          element={
            <PrivateRoute allowedRoles={["TECHNICIAN"]}>
              <TechLayout>
                <TechDashboard />
              </TechLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <RoleBasedLayout>
                <Profile />
              </RoleBasedLayout>
            </PrivateRoute>
          }
        />
        <Route
            path="/tech/assemble"
            element={
                <PrivateRoute>
                    <RoleBasedLayout>
                        <AssemblePhone/>
                    </RoleBasedLayout>
                </PrivateRoute>
            }
        />
        {/* ================= 404 NOT FOUND ================= */}
        <Route
          path="*"
          element={
            <div className="text-center mt-20 text-2xl">
              404 - Trang không tồn tại
            </div>
          }
        />
      </Routes>

      {/* Component hiển thị thông báo (Toast) toàn cục */}
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;
