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
    
    // Bản đồ lưu số lượng tồn kho thực tế của từng mẫu máy
    const [stockMap, setStockMap] = useState({});
    
    // Danh sách các ID sản phẩm được tick chọn để thanh toán
    const [selectedItemIds, setSelectedItemIds] = useState([]);

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? (user._id || user.id) : null;

    useEffect(() => {
        if (!userId) {
            toast.warning("Vui lòng đăng nhập để xem giỏ hàng");
            navigate('/login');
            return;
        }
        fetchCartAndStock();
    }, [userId, navigate]);

    // Gọi song song API Giỏ hàng và API Kho máy
    const fetchCartAndStock = async () => {
        try {
            const [cartRes, phonesRes] = await Promise.all([
                axiosClient.get(`/cart/${userId}`),
                axiosClient.get(`/phones/all`)
            ]);

            const fetchedCart = cartRes.data.data || { items: [], totalPrice: 0 };
            setCart(fetchedCart);
            
            // Mặc định tick chọn tất cả sản phẩm khi vừa vào giỏ hàng
            setSelectedItemIds(fetchedCart.items.map(item => item._id));

            // Tính toán lượng tồn kho từ danh sách tất cả các máy (phones/all)
            const allPhones = phonesRes.data.data || [];
            const newStockMap = {};
            
            allPhones.forEach(p => {
                if (p.status === 'in_stock') {
                    // Dùng key là sự kết hợp của ID dòng máy + Dung lượng + Màu sắc
                    const modelId = typeof p.phoneModelId === 'object' ? p.phoneModelId._id : p.phoneModelId;
                    const key = `${modelId}-${p.capacity}-${p.colorName}`;
                    newStockMap[key] = (newStockMap[key] || 0) + 1;
                }
            });
            setStockMap(newStockMap);

        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            toast.error("Không thể tải dữ liệu giỏ hàng.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm Xử lý Checkbox Chọn Từng Món
    const toggleSelectItem = (itemId) => {
        setSelectedItemIds(prev => 
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    // Hàm Xử lý Checkbox Chọn Tất Cả
    const toggleSelectAll = () => {
        if (selectedItemIds.length === cart.items.length) {
            setSelectedItemIds([]); // Bỏ chọn hết
        } else {
            setSelectedItemIds(cart.items.map(item => item._id)); // Chọn hết
        }
    };

    // Hàm Tính Tiền Dựa Trên Món Đã Chọn
    const getSelectedTotalPrice = () => {
        return cart.items
            .filter(item => selectedItemIds.includes(item._id))
            .reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Cập nhật số lượng
    const updateQuantity = async (item, newQuantity) => {
        if (newQuantity < 1) return;
        
        // CHẶN: Máy tự ráp mặc định chỉ 1
        if (item.productType === 'CUSTOM_BUILD') {
            return toast.warning("Máy tự ráp chỉ được mua số lượng 1 cho mỗi cấu hình!");
        }

        // CHẶN: Vượt quá số lượng tồn kho
        const modelId = typeof item.phoneModelId === 'object' ? item.phoneModelId._id : item.phoneModelId;
        const key = `${modelId}-${item.capacity}-${item.colorName}`;
        const maxStock = stockMap[key] || 0;

        if (newQuantity > maxStock) {
            return toast.warning(`Cửa hàng chỉ còn ${maxStock} sản phẩm cho phân loại này!`);
        }
        
        // Cập nhật UI ngay lập tức cho mượt
        const updatedItems = cart.items.map(i => 
            i._id === item._id ? { ...i, quantity: newQuantity } : i
        );
        setCart({ ...cart, items: updatedItems });

        try {
            await axiosClient.put('/cart/update-quantity', {
                userId: userId,
                itemId: item._id,
                quantity: newQuantity
            });
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            toast.error("Lỗi cập nhật số lượng");
            fetchCartAndStock(); // Rollback UI nếu API lỗi
        }
    };

    const removeItem = async (itemId) => {
        try {
            await axiosClient.delete(`/cart/remove/${userId}/${itemId}`);
            toast.success("Đã xóa sản phẩm");
            // Xoá luôn id đó ra khỏi danh sách đang chọn
            setSelectedItemIds(prev => prev.filter(id => id !== itemId));
            fetchCartAndStock();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            toast.error("Lỗi khi xóa sản phẩm");
        }
    };

    const handleCheckout = () => {
        if (selectedItemIds.length === 0) {
            return toast.warning("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
        }
        alert("Chức năng thanh toán sắp ra mắt!");
        // Ở đây sau này sẽ navigate qua trang Thanh Toán và truyền `selectedItemIds` đi
    };

    if (loading) return <CustomerLayout><div className="py-20 text-center text-blue-600 font-semibold animate-pulse">Đang tải giỏ hàng...</div></CustomerLayout>;

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
                        {/* DANH SÁCH SẢN PHẨM */}
                        <div className="lg:w-2/3 flex flex-col gap-4">
                            
                            {/* Nút Chọn tất cả */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItemIds.length === cart.items.length && cart.items.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
                                    />
                                    <span className="font-semibold text-gray-700">
                                        Chọn tất cả ({cart.items.length} sản phẩm)
                                    </span>
                                </label>
                            </div>

                            {cart.items.map((item) => {
                                const modelId = typeof item.phoneModelId === 'object' ? item.phoneModelId._id : item.phoneModelId;
                                const stockKey = `${modelId}-${item.capacity}-${item.colorName}`;
                                const maxStock = stockMap[stockKey] || 0;
                                const isAtMaxStock = item.quantity >= maxStock;

                                return (
                                    <div key={item._id} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex gap-4 relative ${selectedItemIds.includes(item._id) ? 'border-blue-400 bg-blue-50/20' : 'border-gray-100'}`}>
                                        
                                        {/* Nút Xóa */}
                                        <button onClick={() => removeItem(item._id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">
                                            <Trash2 size={20} />
                                        </button>

                                        {/* Checkbox */}
                                        <div className="flex items-center pt-8">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedItemIds.includes(item._id)}
                                                onChange={() => toggleSelectItem(item._id)}
                                                className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
                                            />
                                        </div>

                                        {/* Ảnh */}
                                        <div className="w-24 h-24 border border-gray-100 rounded-xl p-2 flex items-center justify-center bg-gray-50 flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                        </div>

                                        {/* Nội dung */}
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
                                                        <span className="inline-block text-blue-600 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mb-1">
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
                                            
                                            <div className="flex items-end justify-between mt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-red-600 font-bold text-lg">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                                    </span>
                                                </div>

                                                {/* UI ĐIỀU CHỈNH SỐ LƯỢNG (Xử lý máy dựng và giới hạn tồn kho) */}
                                                {item.productType === 'PHONE' ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                                            <button 
                                                                onClick={() => updateQuantity(item, item.quantity - 1)} 
                                                                className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition"
                                                            >-</button>
                                                            <div className="w-10 text-center text-sm font-semibold text-gray-800 border-x border-gray-200 py-1.5">
                                                                {item.quantity}
                                                            </div>
                                                            <button 
                                                                onClick={() => updateQuantity(item, item.quantity + 1)} 
                                                                disabled={isAtMaxStock}
                                                                className={`px-3 py-1 font-bold transition ${isAtMaxStock ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                                                            >+</button>
                                                        </div>
                                                        {isAtMaxStock && <span className="text-[10px] text-red-500 font-semibold">Đã đạt tối đa kho</span>}
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600">
                                                        Số lượng: 1
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* THANH TOÁN */}
                        <div className="lg:w-1/3">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h2 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100">Thông tin đơn hàng</h2>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-gray-800">Tạm tính ({selectedItemIds.length} sp):</span>
                                    <span className="text-2xl font-extrabold text-red-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getSelectedTotalPrice())}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleCheckout} 
                                    className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 mb-3 transition shadow-md ${selectedItemIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
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