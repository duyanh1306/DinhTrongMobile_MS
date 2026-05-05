import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, CreditCard, MapPin, ChevronDown } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

import { fetchCartDataApi, updateCartQuantityApi, removeCartItemApi } from "../../api/customer/cart";

export default function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState({ items: [], totalPrice: 0 });
    const [loading, setLoading] = useState(true);
    
    const [stockMap, setStockMap] = useState({});
    const [selectedItemIds, setSelectedItemIds] = useState([]);

    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(localStorage.getItem('selectedStoreId') || "");

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? (user._id || user.id) : null;

    useEffect(() => {
        if (!userId) {
            Swal.fire({
                title: 'Yêu cầu đăng nhập',
                text: 'Vui lòng đăng nhập hoặc đăng ký tài khoản để xem giỏ hàng của bạn!',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Đăng nhập ngay',
                cancelButtonText: 'Đăng ký tài khoản',
                customClass: {
                    confirmButton: 'bg-[#e01a22] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                    cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                    popup: 'rounded-3xl'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    navigate('/register');
                } else {
                    navigate('/home'); 
                }
            });
            return;
        }
        loadCartData();
    }, [userId, selectedStore]);

    const loadCartData = async () => {
        setLoading(true);
        const data = await fetchCartDataApi(userId, selectedStore);
        
        if (data) {
            setStores(data.stores);
            
            if (data.activeStore !== selectedStore) {
                setSelectedStore(data.activeStore);
                localStorage.setItem('selectedStoreId', data.activeStore);
            }

            setCart(data.cart);
            setSelectedItemIds(data.cart.items.map(item => item._id));
            setStockMap(data.stockMap);
        }
        setLoading(false);
    };

    const handleStoreChange = (e) => {
        const storeId = e.target.value;
        setSelectedStore(storeId);
        localStorage.setItem('selectedStoreId', storeId);
        setSelectedItemIds([]); 
        window.dispatchEvent(new Event('storeChanged'));
    };

    const toggleSelectItem = (itemId) => {
        setSelectedItemIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
    };

    const toggleSelectAll = () => {
        if (selectedItemIds.length === cart.items.length && cart.items.length > 0) {
            setSelectedItemIds([]); 
        } else {
            const availableItems = cart.items.filter(item => {
                if (item.productType === 'CUSTOM_BUILD') return true;
                const modelId = typeof item.phoneModelId === 'object' ? item.phoneModelId._id : item.phoneModelId;
                const grade = item.grade || 'Mới'; 
                const stockKey = `${modelId}-${item.capacity}-${item.colorName}-${grade}`;
                return (stockMap[stockKey] || 0) > 0;
            }).map(i => i._id);
            setSelectedItemIds(availableItems); 
        }
    };

    const getSelectedTotalPrice = () => {
        return cart.items.filter(item => selectedItemIds.includes(item._id)).reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const updateQuantity = async (item, newQuantity) => {
        if (newQuantity < 1) return;
        if (item.productType === 'CUSTOM_BUILD') return toast.warning("Máy tự ráp chỉ được mua số lượng 1 cho mỗi cấu hình!");

        const modelId = typeof item.phoneModelId === 'object' ? item.phoneModelId._id : item.phoneModelId;
        const grade = item.grade || 'Mới';
        const key = `${modelId}-${item.capacity}-${item.colorName}-${grade}`; 
        const maxStock = stockMap[key] || 0;

        if (newQuantity > maxStock) return toast.warning(`Cửa hàng chỉ còn ${maxStock} sản phẩm cho phân loại này!`);
        
        const updatedItems = cart.items.map(i => i._id === item._id ? { ...i, quantity: newQuantity } : i);
        setCart({ ...cart, items: updatedItems });

        const isSuccess = await updateCartQuantityApi({ userId, itemId: item._id, quantity: newQuantity });
        if (isSuccess) {
            window.dispatchEvent(new Event('cartUpdated'));
        } else {
            loadCartData(); 
        }
    };

    const removeItem = async (itemId) => {
        const isSuccess = await removeCartItemApi(userId, itemId);
        if (isSuccess) {
            setSelectedItemIds(prev => prev.filter(id => id !== itemId));
            loadCartData();
            window.dispatchEvent(new Event('cartUpdated'));
        }
    };

    const handleCheckout = () => {
        if (selectedItemIds.length === 0) return toast.warning("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
        
        const selectedItems = cart.items.filter(item => selectedItemIds.includes(item._id));
        navigate('/checkout', { state: { selectedItems } });
    };

    if (loading) return <CustomerLayout><div className="py-20 text-center text-blue-600 font-semibold animate-pulse">Đang tải giỏ hàng...</div></CustomerLayout>;

    return (
        <CustomerLayout>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-5xl mx-auto py-6 px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b border-gray-200 pb-4 gap-4">
                    <div>
                        <Link to="/home" className="flex items-center text-blue-600 hover:underline font-medium w-max mb-4">
                            <ChevronLeft size={20} /> Tiếp tục mua sắm
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800 uppercase flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                            Giỏ hàng của bạn
                        </h1>
                    </div>
                    <div className="relative inline-block z-20">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white" size={18} />
                        <select
                            value={selectedStore}
                            onChange={handleStoreChange}
                            className="appearance-none bg-[#e01a22] text-white text-sm font-bold py-2 pl-9 pr-8 rounded-lg outline-none cursor-pointer hover:bg-red-700 transition shadow-md"
                        >
                            {stores.map(s => <option key={s._id} value={s._id} className="bg-white text-gray-800">{s.name} - {s.location || s.address}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
                    </div>
                </div>

                {cart.items.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                       <img 
                            src="https://res.cloudinary.com/dtjfxho13/image/upload/v1/cart-empty_cglp4i" 
                            alt="Empty Cart" 
                            className="w-48 mb-4 opacity-80" 
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/11329/11329060.png" }} 
                        />
                        <h2 className="text-lg font-bold text-gray-700 mb-2">Giỏ hàng tại chi nhánh này trống</h2>
                        <p className="text-sm text-gray-500 mb-4">Vui lòng chọn chi nhánh khác hoặc mua thêm sản phẩm.</p>
                        <Link to="/home" className="px-6 py-2.5 bg-[#e01a22] text-white font-bold rounded-xl hover:bg-red-700 transition">Về trang chủ mua sắm</Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-2/3 flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItemIds.length === cart.items.length && cart.items.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-5 h-5 accent-red-600 cursor-pointer rounded"
                                    />
                                    <span className="font-semibold text-gray-700">Chọn tất cả ({cart.items.length} sản phẩm)</span>
                                </label>
                            </div>

                            {cart.items.map((item) => {
                                const modelId = typeof item.phoneModelId === 'object' ? item.phoneModelId._id : item.phoneModelId;
                                const grade = item.grade || 'Mới';
                                const stockKey = `${modelId}-${item.capacity}-${item.colorName}-${grade}`; // 🌟 Áp dụng Grade
                                const maxStock = stockMap[stockKey] || 0;
                                const isAtMaxStock = item.quantity >= maxStock;
                                const isOutOfStock = item.productType === 'PHONE' && maxStock === 0;

                                return (
                                    <div key={item._id} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex gap-4 relative ${selectedItemIds.includes(item._id) ? 'border-red-400 bg-red-50/20' : 'border-gray-100'} ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : ''}`}>
                                        
                                        <button onClick={() => removeItem(item._id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">
                                            <Trash2 size={20} />
                                        </button>

                                        <div className="flex items-center pt-8">
                                            <input 
                                                type="checkbox" 
                                                disabled={isOutOfStock}
                                                checked={selectedItemIds.includes(item._id) && !isOutOfStock}
                                                onChange={() => toggleSelectItem(item._id)}
                                                className="w-5 h-5 accent-red-600 cursor-pointer rounded disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="w-24 h-24 border border-gray-100 rounded-xl p-2 flex items-center justify-center bg-gray-50 flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                        </div>

                                        <div className="flex flex-col flex-1 justify-between py-1 pr-6">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg line-clamp-2 leading-tight">{item.name}</h3>
                                                {item.productType === 'PHONE' ? (
                                                    <div className="text-sm text-gray-500 mt-1.5 flex gap-2">
                                                        <span>Màu: <strong className="text-gray-800">{item.colorName}</strong></span> | 
                                                        <span>ROM: <strong className="text-gray-800">{item.capacity}</strong></span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 space-y-1">
                                                        <span className="inline-block text-red-600 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mb-1">Máy ráp theo yêu cầu</span>
                                                        {item.selectedParts && item.selectedParts.map((part, idx) => (
                                                            <div key={idx} className="text-xs text-gray-500 flex items-center gap-1.5"><span className="w-1 h-1 bg-gray-400 rounded-full"></span> {part.name}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-end justify-between mt-4">
                                                <div className="flex flex-col">
                                                    {isOutOfStock ? (
                                                        <span className="text-red-600 font-bold text-sm bg-red-50 px-2 py-1 rounded-md border border-red-100">Hết hàng tại chi nhánh này</span>
                                                    ) : (
                                                        <span className="text-red-600 font-bold text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                                                    )}
                                                </div>

                                                {item.productType === 'PHONE' ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className={`flex items-center border rounded-lg overflow-hidden bg-white shadow-sm ${isOutOfStock ? 'border-gray-200 opacity-50' : 'border-gray-300'}`}>
                                                            <button onClick={() => updateQuantity(item, item.quantity - 1)} disabled={isOutOfStock} className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition disabled:cursor-not-allowed">-</button>
                                                            <div className="w-10 text-center text-sm font-semibold text-gray-800 border-x border-gray-200 py-1.5">{item.quantity}</div>
                                                            <button onClick={() => updateQuantity(item, item.quantity + 1)} disabled={isAtMaxStock || isOutOfStock} className={`px-3 py-1 font-bold transition ${(isAtMaxStock || isOutOfStock) ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>+</button>
                                                        </div>
                                                        {isAtMaxStock && !isOutOfStock && <span className="text-[10px] text-red-500 font-semibold">Đã đạt tối đa kho</span>}
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600">Số lượng: 1</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="lg:w-1/3">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h2 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100">Thông tin đơn hàng</h2>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-gray-800">Tạm tính ({selectedItemIds.length} sp):</span>
                                    <span className="text-2xl font-extrabold text-red-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getSelectedTotalPrice())}</span>
                                </div>
                                <button 
                                    onClick={handleCheckout} 
                                    className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 mb-3 transition shadow-md ${selectedItemIds.length > 0 ? 'bg-[#e01a22] text-white hover:bg-red-700 shadow-red-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <CreditCard size={20} /> TIẾN HÀNH THANH TOÁN
                                </button>
                                <p className="text-xs text-center text-gray-500 italic">Tổng tiền chỉ tính những sản phẩm đang được tick chọn</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}