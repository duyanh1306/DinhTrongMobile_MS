import React from "react";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ManagerLayout from "./layouts/ManagerLayout";
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
import PhoneDetail from "./pages/customer/PhoneDetail";
import SearchResults from "./pages/customer/SearchResults";
import Cart from "./pages/customer/Cart";
import CheckOut from "./pages/customer/Checkout";
import VnPayReturn from "./pages/customer/VnPayReturn";
import OrderHistory from "./pages/customer/OrderHistory";
import BuildPhone from "./pages/customer/BuildPhone";
import OrderDetail from "./pages/customer/OrderDetail"
import CategoryPage from "./pages/customer/CategoryPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStores from "./pages/admin/ManageStore";
import ManageUser from "./pages/admin/ManageUser";
import AdminPhoneBrand from './pages/admin/AdminPhoneBrand';
import AdminPhoneModel from "./pages/admin/AdminPhoneModel";
import AdminPhone from "./pages/admin/AdminPhone";
import AdminItemType from "./pages/admin/AdminItemType";
import AdminItem from "./pages/admin/AdminItem";
import AdminRecipe from "./pages/admin/AdminRecipe";
import ManageRepairService from "./pages/admin/ManageRepairService";
import PurchaseHistory from "./pages/admin/PurchaseHistory";
import SalesHistory from "./pages/admin/SalesHistory";
import RepairHistory from "./pages/admin/RepairHistory";
import InventoryTransactionList from "./pages/admin/InventoryTransactionList";
import TransferRequestList from "./pages/admin/TransferRequestList";
import ManageStaffStore from "./pages/admin/ManageStaffStore";

import SaleDashboard from "./pages/saleStaff/SaleDashboard";
import SaleCreateRepairOrder from "./pages/saleStaff/saleCreateRepairOrder";
import SaleWebOrders from "./pages/saleStaff/SaleWebOrders";
import TechDashboard from "./pages/technician/TechDashboard";
import AssemblePhone from "./pages/technician/AssemblePhone";
import RepairOrderList from "./pages/technician/RepairOrderList";
import TechDecisionList from "./pages/technician/TechDecisionList";
import RepairInProgress from "./pages/technician/RepairInProgress";
import RepairInProgressDetail from "./pages/technician/RepairInProgressDetail";
import SaleOrders from "./pages/saleStaff/SaleOrders";
import SalePOS from "./pages/saleStaff/SalePOS";
import TechStorage from "./pages/technician/TechStorage";
import TechRequest from "./pages/technician/TechRequest";
import Warranty from "./pages/technician/Warranty";
import SaleTransferExportList from "./pages/saleStaff/SaleTransferExportList";
import SaleTransferExportDetail from "./pages/saleStaff/SaleTransferExportDetail";

import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ImportInventory from "./pages/manager/ImportInventory";
import ManagerTransferRequest from "./pages/manager/ManagerTransferRequest";
import ManagerCreateTransferRequest from "./pages/manager/ManagerCreateTransferRequest";
import ManagerTransferRequestList from "./pages/manager/ManagerTransferRequestList";
import ManagerTransferRequestDetail from "./pages/manager/ManagerTransferRequestDetail";
import ManagerStaff from "./pages/manager/ManagerStaff";
import ManagerInventory from "./pages/manager/ManagerInventory";
import ManagerPurchaseHistory from "./pages/manager/ManagerPurchaseHistory";

import Profile from "./pages/common/Profile";


const PrivateRoute = ({children, allowedRoles}) => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        return <Navigate to="/login" replace/>;
    }

   
    const userRole = user.roleId?.id || user.roleId;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace/>; 
    }

    return children;
};


const RoleBasedLayout = ({children}) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return children;

    const role = user.roleId?.id || user.roleId;

    switch (role) {
        case "ADMIN":
            return <AdminLayout>{children}</AdminLayout>;
        case "MANAGER":
            return <ManagerLayout>{children}</ManagerLayout>;
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
              
                <Route path="/" element={<Navigate to="/home" replace/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/verify-otp" element={<VerifyOtp/>}/>
                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                <Route path="/reset-password" element={<ResetPassword/>}/>
                <Route path="/login-success" element={<LoginSuccess/>}/>

                <Route path="/home" element={<Home/>}/>
                <Route path="/category/:type" element={<CategoryPage/>}/>
                <Route path="/search" element={<SearchResults/>}/>
                <Route path="/product/:id" element={<PhoneDetail/>}/>
                <Route path="/build-phone" element={<BuildPhone/>}/>
                
            
                <Route path="/cart" element={<Cart/>}/>
                <Route path="/checkout" element={<CheckOut />} /> 
                <Route path="/vnpay-return" element={<VnPayReturn />} />
                <Route path="/order-history" element={<OrderHistory/>}/>
                <Route path="/order-detail/:id" element={<OrderDetail/>}/>
               

                {/* ================= ADMIN ROUTES ================= */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <AdminDashboard/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/phone_brands"
                    element={
                        <PrivateRoute allowedRoles={['ADMIN']}>
                            <AdminLayout>
                                <AdminPhoneBrand/>
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
                                <AdminPhoneModel/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/item_type"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <AdminItemType/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/items"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <AdminItem/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/recipes"
                    element={
                        <PrivateRoute allowedRoles={['ADMIN']}>
                            <AdminLayout>
                                <AdminRecipe/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/repair_service"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <ManageRepairService/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/repair_history"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <RepairHistory/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/purchase_history"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <PurchaseHistory/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/sales_history"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <SalesHistory/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/inventory_transactions"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <InventoryTransactionList/>
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
                    path="/admin/stores"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <ManageStores/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/stores/:storeId/staff"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <ManageStaffStore/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <PrivateRoute allowedRoles={["ADMIN"]}>
                            <AdminLayout>
                                <ManageUser/>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />

                {/* ================= SALE STAFF ROUTES ================= */}
                <Route
                    path="/sale/dashboard"
                    element={
                        <PrivateRoute allowedRoles={["SALE_STAFF"]}>
                            <SaleLayout>
                                <SaleDashboard/>
                            </SaleLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/sale/orders"
                    element={
                        <PrivateRoute allowedRoles={["SALE_STAFF"]}>
                            <SaleLayout>
                                <SaleOrders/>
                            </SaleLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/sale/pos"
                    element={
                        <PrivateRoute allowedRoles={["SALE_STAFF"]}>
                            <SaleLayout>
                                <SalePOS/>
                            </SaleLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/sale/repair-orders"
                    element={
                        <PrivateRoute allowedRoles={["SALE_STAFF"]}>
                            <SaleLayout>
                                <SaleCreateRepairOrder/>
                            </SaleLayout>
                        </PrivateRoute>
                    }
                />
                 <Route
                    path="/sale/web-orders"
                    element={
                        <PrivateRoute allowedRoles={["SALE_STAFF"]}>
                            <SaleLayout>
                                <SaleWebOrders/>
                            </SaleLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/sale/transfer-export"
                    element={
                        <PrivateRoute allowedRoles={["SALE_STAFF"]}>
                            <SaleLayout>
                                <SaleTransferExportList/>
                            </SaleLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/sale/transfer-export/:id"
                    element={
                        <PrivateRoute allowedRoles={["SALE_STAFF"]}>
                            <SaleLayout>
                                <SaleTransferExportDetail/>
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
                                <TechDashboard/>
                            </TechLayout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/tech/storage"
                    element={
                        <PrivateRoute allowedRoles={["TECHNICIAN"]}>
                            <TechLayout>
                                <TechStorage/>
                            </TechLayout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <RoleBasedLayout>
                                <Profile/>
                            </RoleBasedLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/tech/repair-orders"
                    element={
                        <PrivateRoute allowedRoles={["TECHNICIAN"]}>
                            <TechLayout>
                                <RepairOrderList/>
                            </TechLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/tech/decision-orders"
                    element={
                        <PrivateRoute allowedRoles={["TECHNICIAN"]}>
                            <TechLayout>
                                <TechDecisionList/>
                            </TechLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/tech/repair-in-progress"
                    element={
                        <PrivateRoute allowedRoles={["TECHNICIAN"]}>
                            <TechLayout>
                                <RepairInProgress/>
                            </TechLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/tech/repair-in-progress/:orderId"
                    element={
                        <PrivateRoute allowedRoles={["TECHNICIAN"]}>
                            <TechLayout>
                                <RepairInProgressDetail/>
                            </TechLayout>
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
                <Route
                    path="/tech/components"
                    element={
                        <PrivateRoute allowedRoles={["TECHNICIAN"]}>
                            <TechLayout>
                                <TechRequest/>
                            </TechLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/tech/warranty"
                    element={
                        <PrivateRoute allowedRoles={["TECHNICIAN"]}>
                            <TechLayout>
                                <Warranty/>
                            </TechLayout>
                        </PrivateRoute>
                    }
                />

                {/* ================= MANAGER ROUTES ================= */}
                <Route
                    path="/manager/dashboard"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerDashboard/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manager/staffs"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerStaff/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manager/inventory"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerInventory/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manager/sales_history"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerPurchaseHistory/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manager/import_inventory"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ImportInventory/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manager/transfer_approvals"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerTransferRequestList/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/manager/transfer_requests/new"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerCreateTransferRequest/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manager/transfer_requests/"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerTransferRequest/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/manager/transfer_requests/create"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerCreateTransferRequest/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/manager/transfer_requests/:id"
                    element={
                        <PrivateRoute allowedRoles={["MANAGER"]}>
                            <ManagerLayout>
                                <ManagerTransferRequestDetail/>
                            </ManagerLayout>
                        </PrivateRoute>
                    }
                />

               
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <RoleBasedLayout>
                                <Profile/>
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

           
            <ToastContainer 
                position="top-right" 
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                style={{ zIndex: 9999 }}
            />
        </BrowserRouter>
    );
}

export default App;
