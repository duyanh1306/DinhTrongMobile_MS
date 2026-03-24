import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Store, Truck, ShieldCheck } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast } from "react-toastify";

export default function Checkout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState([]);
    
    // 🌟 THÔNG TIN KHÁCH HÀNG
    const [user, setUser] = useState(null);
    const [customerPhone, setCustomerPhone] = useState(""); 
    
    // 🌟 THÔNG TIN NHẬN HÀNG
    const [deliveryMethod, setDeliveryMethod] = useState("home"); // 'home' hoặc 'store'
    const [stores, setStores] = useState([]);
    
    const [shippingInfo, setShippingInfo] = useState({
        receiverName: "", receiverPhone: "",
        province: "", district: "", ward: "", address: "",
        storeId: "", note: ""
    });

    useEffect(() => {
        const fetchCheckoutData = async () => {
            try {
                // 1. Lấy thông tin User
                const userData = JSON.parse(localStorage.getItem('user'));
                if (!userData) {
                    toast.warning("Vui lòng đăng nhập để thanh toán!");
                    navigate('/login');
                    return;
                }
                setUser(userData);
                
                // Nếu đăng nhập Google chưa có sđt, để trống. Nếu có thì tự điền
                if (userData.phone) setCustomerPhone(userData.phone);
                setShippingInfo(prev => ({ ...prev, receiverName: userData.name || '', receiverPhone: userData.phone || '' }));

                // 2. Lấy dữ liệu Giỏ hàng
                const cartRes = await axiosClient.get(`/cart/${userData._id || userData.id}`);
                const items = cartRes.data?.data?.items || [];
                if (items.length === 0) {
                    toast.warning("Giỏ hàng của bạn đang trống!");
                    navigate('/home');
                    return;
                }
                setCartItems(items);

                // 3. Lấy danh sách cửa hàng
                const storeRes = await axiosClient.get('/stores/all');
                const storeList = Array.isArray(storeRes.data) ? storeRes.data : (storeRes.data.data || []);
                setStores(storeList);
                if (storeList.length > 0) setShippingInfo(prev => ({ ...prev, storeId: storeList[0]._id }));

            } catch (error) {
                console.error(error);
                toast.error("Lỗi lấy dữ liệu thanh toán.");
            } finally {
                setLoading(false);
            }
        };
        fetchCheckoutData();
    }, [navigate]);

    const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const handleCheckout = async () => {
        // 1. Validate dữ liệu
        if (!customerPhone || customerPhone.length < 9) {
            return toast.warning("Vui lòng cập nhật Số điện thoại người đặt hàng!");
        }

        if (deliveryMethod === 'home') {
            if (!shippingInfo.receiverName || !shippingInfo.receiverPhone || !shippingInfo.province || !shippingInfo.district || !shippingInfo.ward || !shippingInfo.address) {
                return toast.warning("Vui lòng điền đầy đủ địa chỉ giao hàng!");
            }
        }

        try {
            setLoading(true);
            
            // 🌟 LƯU Ý CHO BACKEND: Ở đây bạn nên gọi API tạo Order vào Database trước
            // const orderRes = await axiosClient.post('/orders/create', { items: cartItems, total: totalAmount, deliveryInfo: shippingInfo, ... });
            // const orderId = orderRes.data.orderId;
            
            // Tạm thời mô phỏng ID Đơn hàng
            const orderId = `DH${Date.now().toString().slice(-6)}`; 

            // 🌟 2. GỌI API VNPay CỦA BẠN
            const paymentRes = await axiosClient.post('/vnpay/create', {
                amountVnd: totalAmount,
                orderId: orderId,
                orderInfo: `Thanh toan don hang ${orderId}`,
                locale: 'vn'
            });

            if (paymentRes.data && paymentRes.data.paymentUrl) {
                // Chuyển hướng khách hàng sang cổng VNPay
                window.location.href = paymentRes.data.paymentUrl;
            } else {
                toast.error("Không thể tạo link thanh toán VNPay");
            }
        } catch (error) {
            toast.error("Lỗi kết nối đến cổng thanh toán!");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <CustomerLayout><div className="min-h-[60vh] flex justify-center items-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div></CustomerLayout>;

    return (
        <CustomerLayout>
            <div className="bg-gray-50 min-h-screen py-8">
                <div className="max-w-3xl mx-auto px-4">
                    
                    {/* BREADCRUMB & HEADER */}
                    <div className="flex items-center justify-between mb-6">
                        <Link to="/cart" className="flex items-center text-blue-600 hover:underline font-semibold text-sm transition">
                            <ChevronLeft size={18} /> Quay lại giỏ hàng
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Thanh Toán</h1>
                    </div>

                    {/* TABS (GIAO DIỆN GIỐNG ẢNH) */}
                    <div className="flex bg-white rounded-t-2xl border-b-2 border-gray-200 mb-6">
                        <div className="w-1/2 text-center py-4 border-b-4 border-red-600 text-red-600 font-bold uppercase tracking-wide">
                            1. Thông tin
                        </div>
                        <div className="w-1/2 text-center py-4 text-gray-400 font-bold uppercase tracking-wide">
                            2. Thanh toán
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* SẢN PHẨM TRONG ĐƠN */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center py-4 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 border border-gray-100 flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight mb-1">
                                            {item.name} {item.capacity && `- ${item.capacity}`} {item.grade && item.grade !== 'Mới' && `(${item.grade})`}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-2">Màu: <strong>{item.colorName}</strong></p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-red-600 font-bold">{formatMoney(item.price)}</span>
                                            <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">SL: {item.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* THÔNG TIN KHÁCH HÀNG (NGƯỜI ĐẶT) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-gray-600 text-sm font-bold uppercase tracking-widest mb-4">Thông tin khách hàng</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Họ và tên</p>
                                    <p className="font-bold text-gray-800">{user?.name || "Khách hàng"}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Email</p>
                                    <p className="font-bold text-gray-800">{user?.email}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={customerPhone} 
                                        onChange={(e) => {
                                            setCustomerPhone(e.target.value);
                                            // Tự động đồng bộ với sđt nhận hàng nếu họ chưa sửa sđt nhận hàng
                                            setShippingInfo(prev => ({...prev, receiverPhone: e.target.value}));
                                        }}
                                        className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold ${!customerPhone ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                        placeholder="Nhập số điện thoại của bạn..."
                                    />
                                    {!customerPhone && <p className="text-xs text-red-500 mt-1 italic">Vui lòng nhập SĐT để chúng tôi tiện liên hệ.</p>}
                                </div>
                            </div>
                        </div>

                        {/* THÔNG TIN NHẬN HÀNG */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <h2 className="text-gray-600 text-sm font-bold uppercase tracking-widest mb-0 p-6 pb-4">Thông tin nhận hàng</h2>
                            
                            <div className="flex border-b border-gray-100">
                                <button 
                                    onClick={() => setDeliveryMethod('store')}
                                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${deliveryMethod === 'store' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Store size={18} /> Nhận tại cửa hàng
                                </button>
                                <button 
                                    onClick={() => setDeliveryMethod('home')}
                                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${deliveryMethod === 'home' ? 'bg-red-50 text-red-700 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Truck size={18} /> Giao hàng tận nơi
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {deliveryMethod === 'home' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tên người nhận *</label>
                                                <input type="text" value={shippingInfo.receiverName} onChange={e => setShippingInfo({...shippingInfo, receiverName: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-red-500" placeholder="Họ tên..."/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">SĐT người nhận *</label>
                                                <input type="tel" value={shippingInfo.receiverPhone} onChange={e => setShippingInfo({...shippingInfo, receiverPhone: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-red-500" placeholder="Số điện thoại..."/>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Tỉnh / Thành phố *</label>
                                                <input type="text" value={shippingInfo.province} onChange={e => setShippingInfo({...shippingInfo, province: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-red-500 text-sm" placeholder="VD: Hà Nội"/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Quận / Huyện *</label>
                                                <input type="text" value={shippingInfo.district} onChange={e => setShippingInfo({...shippingInfo, district: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-red-500 text-sm" placeholder="VD: Cầu Giấy"/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Phường / Xã *</label>
                                                <input type="text" value={shippingInfo.ward} onChange={e => setShippingInfo({...shippingInfo, ward: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-red-500 text-sm" placeholder="VD: Dịch Vọng"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Số nhà, tên đường *</label>
                                            <input type="text" value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-red-500" placeholder="Số nhà, đường..."/>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"><MapPin size={18}/> Chọn cửa hàng gần bạn nhất</label>
                                            <select 
                                                value={shippingInfo.storeId} 
                                                onChange={e => setShippingInfo({...shippingInfo, storeId: e.target.value})}
                                                className="w-full border border-blue-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-700"
                                            >
                                                {stores.map(s => <option key={s._id} value={s._id}>{s.name} - {s.location || s.address}</option>)}
                                            </select>
                                        </div>
                                        <p className="text-sm text-gray-500 italic"><ShieldCheck size={16} className="inline text-green-500 mr-1"/> Bạn có thể thanh toán trước, sau đó đến đọc SĐT để nhận máy.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ghi chú khác (Nếu có)</label>
                                    <textarea value={shippingInfo.note} onChange={e => setShippingInfo({...shippingInfo, note: e.target.value})} rows="2" className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-gray-400" placeholder="Nhập ghi chú cho nhân viên..."></textarea>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* TỔNG TIỀN VÀ THANH TOÁN (STICKY BOTTOM) */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mt-6 sticky bottom-4 z-10">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-800 font-bold">Tổng tiền tạm tính:</span>
                            <span className="text-3xl font-extrabold text-red-600">{formatMoney(totalAmount)}</span>
                        </div>
                        
                        <button 
                            onClick={handleCheckout}
                            className="w-full bg-[#e01a22] text-white py-4 rounded-xl font-bold text-lg uppercase tracking-wider hover:bg-red-700 shadow-md transition-all active:scale-[0.99] flex justify-center items-center gap-2"
                        >
                            Tiếp tục thanh toán VNPay
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                            <ShieldCheck size={14} className="text-green-500"/> Giao dịch được mã hóa và bảo mật an toàn
                        </p>
                    </div>

                </div>
            </div>
        </CustomerLayout>
    );
}