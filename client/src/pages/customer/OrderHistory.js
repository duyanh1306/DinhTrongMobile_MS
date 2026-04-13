import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Search, Calendar, Truck, ChevronRight, Clock } from "lucide-react";
import Swal from "sweetalert2"; 
import CustomerLayout from "../../layouts/CustomerLayout";

import { fetchOrdersApi, confirmOrderApi, reportOrderIssueApi } from "../../api/customer/orderHistory";

const CountdownTimer = ({ updatedAt }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!updatedAt) return;
        
        const calculateTime = () => {
            const soNgayDemNguoc = 1/24/6; 
            const deadline = new Date(updatedAt).getTime() + soNgayDemNguoc * 24 * 60 * 60 * 1000;
            const now = new Date().getTime();
            const diff = deadline - now;

            if (diff <= 0) {
                setTimeLeft("Sắp tự động hoàn thành");
            } else {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                setTimeLeft(`Còn ${d} ngày ${h} giờ`); 
            }
        };

        calculateTime();
     
        const interval = setInterval(calculateTime, 60000); 
        return () => clearInterval(interval);
    }, [updatedAt]);

    if (!timeLeft) return null;
    return (
        <span className="flex items-center gap-1 text-[11px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100 whitespace-nowrap">
            <Clock size={12} /> {timeLeft}
        </span>
    );
};

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?._id || user?.id;

    useEffect(() => {
        const loadOrders = async () => {
            if (!userId) return;
            setLoading(true);
            const data = await fetchOrdersApi(userId);
            setOrders(data);
            setLoading(false);
        };
        loadOrders();
    }, [userId]); 

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Pending': return { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
            case 'Processing': return { text: 'Đang chuẩn bị', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            case 'Delivering': return { text: 'Đang giao hàng', color: 'bg-orange-100 text-orange-700 border-orange-200' };
            case 'Waiting_Confirm': return { text: 'Đang giao hàng', color: 'bg-orange-100 text-orange-700 border-orange-200' };
            case 'Completed': return { text: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200' };
            case 'Issue_Reported': return { text: 'Đã báo lỗi', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'Cancelled': return { text: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-200' };
            default: return { text: 'Không xác định', color: 'bg-gray-100 text-gray-700' };
        }
    };

    const handleConfirm = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn đã nhận được hàng?',
            text: "Cảm ơn bạn đã mua sắm! Hãy xác nhận nếu bạn đã nhận được sản phẩm nguyên vẹn nhé.",
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Đã nhận hàng',
            cancelButtonText: 'Chưa, quay lại',
            customClass: {
                confirmButton: 'bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                popup: 'rounded-3xl' 
            },
            buttonsStyling: false 
        });

        if (result.isConfirmed) {
            const success = await confirmOrderApi(id);
            if (success) {
                window.location.reload();
            }
        }
    };

    const handleReport = async (id) => {
        const result = await Swal.fire({
            title: 'Chưa nhận được hàng?',
            text: "Bạn chắc chắn chưa nhận được hàng? Cửa hàng sẽ liên hệ với bạn ngay lập tức để xử lý!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Gửi báo cáo',
            cancelButtonText: 'Hủy bỏ',
            customClass: {
                confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                popup: 'rounded-3xl' 
            },
            buttonsStyling: false 
        });

        if (result.isConfirmed) {
            const success = await reportOrderIssueApi(id);
            if (success) {
                window.location.reload();
            }
        }
    };

    return (
        <CustomerLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
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
                    <div className="text-center py-20 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3"></div>
                        Đang tải lịch sử đơn hàng...
                    </div>
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
                        
        
                            const isShowTimer = order.updatedAt && ['Delivering'].includes(order.orderStatus);

                            return (
                                <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group">
                                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                                                {['Delivering', 'Waiting_Confirm', 'Completed'].includes(order.orderStatus) ? <Truck size={24} /> : <Package size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-800 text-sm">Đơn hàng #{order.orderCode || order._id.substring(18)}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${statusInfo.color}`}>
                                                        {statusInfo.text}
                                                    </span>
                                                 
                                                    {isShowTimer && (
                                                        <CountdownTimer updatedAt={order.updatedAt} />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
                                                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    <span className="flex items-center gap-1">SL: {order.items.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-5 border-t md:border-0 pt-4 md:pt-0">
                                            
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Tổng thanh toán</p>
                                                <p className="text-lg font-black text-red-600">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                                </p>
                                            </div>
                                            
                                            {(order.orderStatus === 'Waiting_Confirm' || order.orderStatus === 'Delivering') && (
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => handleConfirm(order._id)} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700 transition shadow-sm shadow-green-500/30 whitespace-nowrap">Đã nhận hàng</button>
                                                    <button onClick={() => handleReport(order._id)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs hover:bg-gray-200 transition whitespace-nowrap">Chưa nhận được</button>
                                                </div>
                                            )}

                                            <Link to={`/order-detail/${order._id}`} className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors">
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