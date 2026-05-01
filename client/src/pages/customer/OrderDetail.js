import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, CreditCard, Calendar } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

import { fetchOrderDetailApi } from "../../api/customer/orderDetail";

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrderDetail = async () => {
            setLoading(true);
            const data = await fetchOrderDetailApi(id);
            if (data) {
                setOrder(data);
            } else {
                navigate('/order-history');
            }
            setLoading(false);
        };
        
        loadOrderDetail();
    }, [id, navigate]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': 
                return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold text-xs uppercase border border-yellow-200">Chờ xác nhận</span>;
            case 'Processing': 
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-xs uppercase border border-blue-200">Đang xử lý</span>;
            case 'Delivering': 
                return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold text-xs uppercase border border-orange-200">Đang giao hàng</span>;
            case 'Waiting_Confirm': 
                return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold text-xs uppercase border border-purple-200">Chờ khách xác nhận</span>;
            case 'Issue_Reported': 
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold text-xs uppercase border border-red-200">Khách báo lỗi</span>;
            case 'Completed': 
            case 'Delivered': 
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-xs uppercase border border-green-200">Hoàn thành</span>;
            case 'Cancelled': 
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold text-xs uppercase border border-gray-200">Đã hủy</span>;
            default: 
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold text-xs uppercase">Không xác định</span>;
        }
    };

    if (loading) return <CustomerLayout><div className="py-20 text-center text-gray-500">Đang tải chi tiết đơn hàng...</div></CustomerLayout>;
    if (!order) return <CustomerLayout><div className="py-20 text-center text-red-500">Không tìm thấy đơn hàng.</div></CustomerLayout>;

    return (
        <CustomerLayout>
            <div className="max-w-5xl mx-auto py-6 px-4">
                <Link to="/order-history" className="flex items-center text-blue-600 hover:underline font-medium mb-6 w-max">
                    <ChevronLeft size={20} /> Quay lại lịch sử đơn hàng
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-gray-200 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Chi tiết đơn hàng: <span className="text-blue-600">{order.orderCode}</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar size={14}/> Đặt ngày: {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </p>
                    </div>
                    <div>{getStatusBadge(order.orderStatus)}</div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-2/3 flex flex-col gap-4">
                        <h2 className="font-bold text-lg text-gray-800 mb-2">Sản phẩm đã mua</h2>
                        
                        {order.items.map((item) => (
                            <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                                <div className="w-20 h-20 md:w-24 md:h-24 border border-gray-100 rounded-xl p-2 flex items-center justify-center bg-gray-50 flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                </div>

                                <div className="flex flex-col flex-1 justify-between py-1">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base md:text-lg">{item.name}</h3>
                                        
                                        {item.productType === 'PHONE' ? (
                                            <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                                <span>Màu: <strong className="text-gray-800">{item.colorName}</strong></span> | 
                                                <span>ROM: <strong className="text-gray-800">{item.capacity}</strong></span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 space-y-1">
                                                <span className="inline-block text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                    Máy ráp theo yêu cầu
                                                </span>
                                                {item.selectedParts && item.selectedParts.map((part, idx) => (
                                                    <div key={idx} className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span> {part.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-gray-600 font-medium text-sm">Số lượng: x{item.quantity}</span>
                                        <span className="text-red-600 font-bold text-lg">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:w-1/3 space-y-4">
              
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                                <MapPin size={20} className="text-blue-500" /> Thông tin nhận hàng
                            </h2>
                            <div className="space-y-3 text-sm text-gray-600">
                                <p><span className="font-medium text-gray-800">Người nhận:</span> {order.shippingInfo?.fullName}</p>
                                <p><span className="font-medium text-gray-800">Điện thoại:</span> {order.shippingInfo?.phone}</p>
                                <p className="leading-relaxed">
                                    <span className="font-medium text-gray-800 block mb-1">Địa chỉ giao hàng:</span> 
                                    {order.shippingInfo?.deliveryMethod === 'home' 
                                        ? `${order.shippingInfo?.address}, ${order.shippingInfo?.ward}, ${order.shippingInfo?.district}, ${order.shippingInfo?.province}`
                                        : 'Nhận tại cửa hàng'
                                    }
                                </p>
                                {order.shippingInfo?.note && (
                                    <p className="p-2 bg-yellow-50 rounded-lg border border-yellow-100 text-yellow-800 mt-2">
                                        <strong>Ghi chú:</strong> {order.shippingInfo.note}
                                    </p>
                                )}
                            </div>
                        </div>

                   
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                                <CreditCard size={20} className="text-green-500" /> Thanh toán
                            </h2>
                            
                            <div className="space-y-3 text-sm text-gray-600 mb-4">
                                <div className="flex justify-between">
                                    <span>Phương thức:</span>
                                    <span className="font-bold text-gray-800">{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Trạng thái:</span>
                                    <span className={`font-bold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-4 border-t border-gray-100">
                                <span className="font-bold text-gray-800 text-lg">Tổng cộng:</span>
                                <span className="text-2xl font-extrabold text-red-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}