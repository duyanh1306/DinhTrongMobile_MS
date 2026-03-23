import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle, ChevronRight, Search, Calendar, Truck } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            try {
                // GỌI API MỚI (Bảng Order)
                const res = await axiosClient.get(`/orders/user/${user._id}`);
                setOrders(res.data.data || []);
            } catch (error) {
                console.error("Lỗi lấy lịch sử đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Pending': return { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
            case 'Processing': return { text: 'Đang xử lý', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            case 'Shipped': return { text: 'Đang giao hàng', color: 'bg-orange-100 text-orange-700 border-orange-200' };
            case 'Delivered': return { text: 'Đã nhận hàng', color: 'bg-green-100 text-green-700 border-green-200' };
            case 'Cancelled': return { text: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' };
            default: return { text: 'Không xác định', color: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <Package size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Lịch sử đơn hàng Online</h1>
                        <p className="text-gray-500 text-sm">Theo dõi tiến trình giao hàng của bạn</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Đang tải lịch sử đơn hàng...</div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-300" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700">Bạn chưa mua đơn hàng Online nào</h2>
                        <Link to="/home" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 mt-4">
                            Mua sắm ngay
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusInfo = getStatusInfo(order.orderStatus);
                            return (
                                <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group">
                                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                {order.orderStatus === 'Shipped' ? <Truck size={24} /> : <Package size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-800 text-sm">Đơn hàng {order.orderCode}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${statusInfo.color}`}>
                                                        {statusInfo.text}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    <span className="flex items-center gap-1">SL: {order.items.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-4 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Tổng thanh toán</p>
                                                <p className="text-lg font-black text-red-600">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                                </p>
                                            </div>
                                            <Link to={`/order-detail/${order._id}`} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                <ChevronRight size={24} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}