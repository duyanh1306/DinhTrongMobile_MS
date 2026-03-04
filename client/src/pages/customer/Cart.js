import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, ShieldCheck, CreditCard } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

export default function Cart() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const loadCart = () => {
            const items = JSON.parse(localStorage.getItem('cart')) || [];
            setCartItems(items);
        };
        loadCart();
        window.addEventListener('cartUpdated', loadCart);
        return () => window.removeEventListener('cartUpdated', loadCart);
    }, []);

    const updateQuantity = (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;
        const updatedCart = cartItems.map(item => 
            item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const removeItem = (cartItemId) => {
        const updatedCart = cartItems.filter(item => item.cartItemId !== cartItemId);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CustomerLayout>
            <div className="max-w-5xl mx-auto py-6">
                <Link to="/home" className="flex items-center text-blue-600 hover:underline font-medium mb-6 w-max">
                    <ChevronLeft size={20} /> Tiếp tục mua sắm
                </Link>

                <h1 className="text-2xl font-bold text-gray-800 mb-6 uppercase flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                    Giỏ hàng của bạn
                </h1>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                        <img src="https://cellphones.com.vn/cart/Cart-empty-v2.png" alt="Empty Cart" className="w-48 mb-4 opacity-80" />
                        <h2 className="text-lg font-bold text-gray-700 mb-2">Giỏ hàng chưa có sản phẩm nào</h2>
                        <p className="text-gray-500 mb-6 text-sm">Hãy quay lại trang chủ để chọn món đồ yêu thích nhé.</p>
                        <Link to="/home" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md">
                            Về trang chủ
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* DANH SÁCH SẢN PHẨM */}
                        <div className="lg:w-2/3 flex flex-col gap-4">
                            {cartItems.map((item) => (
                                <div key={item.cartItemId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 relative">
                                    {/* Nút Xóa */}
                                    <button 
                                        onClick={() => removeItem(item.cartItemId)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={20} />
                                    </button>

                                    <div className="w-24 h-24 border border-gray-100 rounded-xl p-2 flex items-center justify-center flex-shrink-0 bg-gray-50">
                                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                                    </div>

                                    <div className="flex flex-col flex-1 justify-between py-1 pr-8">
                                        <div>
                                            <h3 className="font-bold text-gray-800 line-clamp-2 hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/product/${item.modelId}`)}>
                                                {item.name}
                                            </h3>
                                            <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                                <span>Màu: <strong className="text-gray-700">{item.color}</strong></span> | 
                                                <span>ROM: <strong className="text-gray-700">{item.capacity}</strong></span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-red-600 font-bold text-lg">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                            </span>

                                            {/* Tăng giảm số lượng */}
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition">-</button>
                                                <div className="w-10 text-center text-sm font-semibold text-gray-800 border-x border-gray-200 py-1">{item.quantity}</div>
                                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition">+</button>
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
                                
                                <div className="flex justify-between items-center mb-3 text-gray-600 text-sm">
                                    <span>Tạm tính ({cartItems.length} sản phẩm):</span>
                                    <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 text-gray-600 text-sm pb-4 border-b border-gray-100">
                                    <span>Phí giao hàng:</span>
                                    <span className="text-green-600 font-semibold">Miễn phí</span>
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-gray-800">Tổng cộng:</span>
                                    <span className="text-2xl font-extrabold text-red-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                                    </span>
                                </div>

                                <button onClick={() => alert("Tính năng Thanh Toán đang được xây dựng!")} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mb-3">
                                    <CreditCard size={20} /> TIẾN HÀNH THANH TOÁN
                                </button>

                                <div className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1 mt-4">
                                    <ShieldCheck size={14} className="text-green-500"/> Thông tin của bạn được bảo mật tuyệt đối
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}