import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, CreditCard } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState({ items: [], totalPrice: 0 });
    const [loading, setLoading] = useState(true);
    
    // Lấy user từ localStorage và lấy ID chuẩn
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? (user._id || user.id) : null;

    useEffect(() => {
        if (!userId) {
            toast.warning("Vui lòng đăng nhập để xem giỏ hàng");
            navigate('/login');
            return;
        }
        fetchCart();
    }, [userId, navigate]);

    const fetchCart = async () => {
        try {
            // GỌI API ĐỂ LẤY DATA TỪ DATABASE
            const res = await axiosClient.get(`/cart/${userId}`);
            setCart(res.data.data || { items: [], totalPrice: 0 });
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        
        // Cập nhật UI ngay lập tức cho mượt
        const updatedItems = cart.items.map(item => 
            item._id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setCart({ ...cart, items: updatedItems });

        try {
            await axiosClient.put('/cart/update-quantity', {
                userId: userId,
                itemId: itemId,
                quantity: newQuantity
            });
            fetchCart(); 
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            toast.error("Lỗi cập nhật số lượng");
        }
    };

    const removeItem = async (itemId) => {
        try {
            await axiosClient.delete(`/cart/remove/${userId}/${itemId}`);
            toast.success("Đã xóa sản phẩm");
            fetchCart();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            toast.error("Lỗi khi xóa sản phẩm");
        }
    };

    if (loading) return <CustomerLayout><div className="py-20 text-center">Đang tải giỏ hàng...</div></CustomerLayout>;

    return (
        <CustomerLayout>
            <div className="max-w-5xl mx-auto py-6 px-4">
                <Link to="/home" className="flex items-center text-blue-600 hover:underline font-medium mb-6 w-max">
                    <ChevronLeft size={20} /> Tiếp tục mua sắm
                </Link>

                <h1 className="text-2xl font-bold text-gray-800 mb-6 uppercase flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                    Giỏ hàng của bạn
                </h1>

                {cart.items.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                        <img src="https://cellphones.com.vn/cart/Cart-empty-v2.png" alt="Empty Cart" className="w-48 mb-4 opacity-80" />
                        <h2 className="text-lg font-bold text-gray-700 mb-2">Giỏ hàng chưa có sản phẩm nào</h2>
                        <Link to="/home" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 mt-4 transition">
                            Về trang chủ
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* DANH SÁCH SẢN PHẨM TỪ DATABASE */}
                        <div className="lg:w-2/3 flex flex-col gap-4">
                            {cart.items.map((item) => (
                                <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 relative">
                                    <button onClick={() => removeItem(item._id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                                        <Trash2 size={20} />
                                    </button>

                                    <div className="w-24 h-24 border border-gray-100 rounded-xl p-2 flex items-center justify-center bg-gray-50">
                                        <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                    </div>

                                    <div className="flex flex-col flex-1 justify-between py-1 pr-8">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                                            
                                            {item.productType === 'PHONE' ? (
                                                <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                                    <span>Màu: <strong className="text-gray-800">{item.colorName}</strong></span> | 
                                                    <span>ROM: <strong className="text-gray-800">{item.capacity}</strong></span>
                                                </div>
                                            ) : (
                                                <div className="mt-2 space-y-1">
                                                    <span className="inline-block text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mb-1">
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
                                        
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-red-600 font-bold text-lg">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                            </span>

                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                                <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition">-</button>
                                                <div className="w-10 text-center text-sm font-semibold text-gray-800 border-x border-gray-200 py-1.5">{item.quantity}</div>
                                                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* THANH TOÁN */}
                        <div className="lg:w-1/3">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h2 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100">Thông tin đơn hàng</h2>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-gray-800">Tổng cộng:</span>
                                    <span className="text-2xl font-extrabold text-red-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cart.totalPrice)}
                                    </span>
                                </div>
                                <button onClick={() => alert("Chức năng thanh toán sắp ra mắt!")} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 mb-3 transition">
                                    <CreditCard size={20} /> TIẾN HÀNH THANH TOÁN
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}