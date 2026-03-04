import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle, ChevronRight, Search, Calendar } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Đảm bảo dùng đúng số điện thoại của user đang đăng nhập
                const identifier = user?.number || user?.phone;
                if (!identifier) return;
    
                const res = await axiosClient.get(`/purchase_orders/customer/${identifier}`);
                
                // Vì Backend mới trả về { success: true, data: [...] } nên phải lấy đúng res.data.data
                setOrders(res.data.data || []);
            } catch (error) {
                console.error("Lỗi lấy lịch sử đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <Package size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Lịch sử mua hàng</h1>
                        <p className="text-gray-500 text-sm">Quản lý và theo dõi các đơn hàng của bạn</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-300" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700">Bạn chưa có đơn hàng nào</h2>
                        <p className="text-gray-500 mt-2 mb-6">Hãy khám phá các sản phẩm công nghệ mới nhất nhé!</p>
                        <Link to="/home" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                            Mua sắm ngay
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group">
                                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-800 uppercase text-sm">Đơn hàng #{order._id.slice(-6)}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusStyle(order.status)}`}>
                                                    {order.status === 'Completed' ? 'Thành công' : 'Đang xử lý'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(order.purchaseOrderDate).toLocaleDateString('vi-VN')}</span>
                                                <span className="flex items-center gap-1"><Clock size={14}/> {order.orderType === 'SALE' ? 'Mua mới' : 'Thu cũ'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-4 md:pt-0">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Tổng thanh toán</p>
                                            <p className="text-lg font-black text-red-600">Liên hệ báo giá</p>
                                        </div>
                                        <Link 
                                            to={`/order-detail/${order._id}`}
                                            className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                        >
                                            <ChevronRight size={24} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}