import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Store, Truck, ShieldCheck, CheckCircle2, QrCode, Check, CreditCard } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// IMPORT TỪ FILE API VỪA TẠO
import { 
    fetchLocationsApi, 
    fetchStoresApi, 
    submitOrderApi, 
    createVnpayPaymentApi, 
    clearCartApi 
} from "../../api/customer/checkout";

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [checkoutItems, setCheckoutItems] = useState([]);
    
    const [currentStep, setCurrentStep] = useState(1);
    const [agreedToTerms, setAgreedToTerms] = useState(true);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("VNPAY");

    const [user, setUser] = useState(null);
    const [customerPhone, setCustomerPhone] = useState(""); 
    
    const [deliveryMethod, setDeliveryMethod] = useState("home");
    const [stores, setStores] = useState([]);
    const [selectedStoreId, setSelectedStoreId] = useState("");
    
    const [shippingInfo, setShippingInfo] = useState({
        receiverName: "", receiverPhone: "",
        province: "", district: "", ward: "", address: "", note: ""
    });

    const [locations, setLocations] = useState([]);
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [availableWards, setAvailableWards] = useState([]);
    
    const [provCode, setProvCode] = useState("");
    const [distCode, setDistCode] = useState("");
    const [wardCode, setWardCode] = useState("");

    // Gọi API Tỉnh Thành
    useEffect(() => {
        const loadLocations = async () => {
            const data = await fetchLocationsApi();
            setLocations(data);
        };
        loadLocations();
    }, []);

    // Load Data Khởi tạo
    useEffect(() => {
        const prepareCheckout = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (!userData) {
                    toast.warning("Vui lòng đăng nhập để thanh toán!");
                    navigate('/login');
                    return;
                }
                
                const displayName = userData.name || userData.fullName || userData.fullname || "";
                const displayPhone = userData.phone || userData.phoneNumber || "";
                
                setUser({ ...userData, name: displayName, phone: displayPhone });
                setCustomerPhone(displayPhone);
                
                setShippingInfo(prev => ({ 
                    ...prev, 
                    receiverName: displayName, 
                    receiverPhone: displayPhone 
                }));

                const itemsToBuy = location.state?.selectedItems;
                if (!itemsToBuy || itemsToBuy.length === 0) {
                    toast.warning("Vui lòng chọn sản phẩm cần thanh toán từ giỏ hàng!");
                    navigate('/cart');
                    return;
                }
                setCheckoutItems(itemsToBuy);

                const savedStoreId = localStorage.getItem('selectedStoreId');
                
                // DÙNG API MỚI
                const storeList = await fetchStoresApi();
                setStores(storeList);
                
                if (savedStoreId && storeList.some(s => s._id === savedStoreId)) {
                    setSelectedStoreId(savedStoreId);
                } else if (storeList.length > 0) {
                    setSelectedStoreId(storeList[0]._id);
                }

            } catch (error) {
                toast.error("Lỗi khởi tạo thanh toán.");
            } finally {
                setLoading(false);
            }
        };
        prepareCheckout();
    }, [navigate, location.state]);

    // Xử lý Form Tỉnh Thành
    const handleProvinceChange = (e) => {
        const code = e.target.value;
        setProvCode(code);
        const prov = locations.find(p => p.Id === code);
        setShippingInfo({ ...shippingInfo, province: prov ? prov.Name : "", district: "", ward: "" });
        setDistCode(""); setWardCode("");
        setAvailableDistricts(prov ? prov.Districts : []);
        setAvailableWards([]);
    };

    const handleDistrictChange = (e) => {
        const code = e.target.value;
        setDistCode(code);
        const dist = availableDistricts.find(d => d.Id === code);
        setShippingInfo({ ...shippingInfo, district: dist ? dist.Name : "", ward: "" });
        setWardCode("");
        setAvailableWards(dist ? dist.Wards : []);
    };

    const handleWardChange = (e) => {
        const code = e.target.value;
        setWardCode(code);
        const ward = availableWards.find(w => w.Id === code);
        setShippingInfo({ ...shippingInfo, ward: ward ? ward.Name : "" });
    };

    const totalAmount = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const handleNextStep = () => {
        if (!customerPhone || customerPhone.length < 9) return toast.warning("Vui lòng bổ sung Số điện thoại liên hệ của bạn!");
        if (!selectedStoreId) return toast.warning("Vui lòng chọn cửa hàng phục vụ!");

        if (deliveryMethod === 'home') {
            if (!shippingInfo.receiverName || !shippingInfo.receiverPhone || !shippingInfo.province || !shippingInfo.district || !shippingInfo.ward || !shippingInfo.address) {
                return toast.warning("Vui lòng điền đầy đủ địa chỉ giao hàng!");
            }
        }
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // XỬ LÝ THANH TOÁN GỌI QUA API FILE
    const handleCheckout = async () => {
        if (!agreedToTerms) return toast.warning("Vui lòng đồng ý với điều khoản sử dụng!");

        try {
            setLoading(true);
            const formattedItems = checkoutItems.map(item => ({
                productType: item.productType,
                phoneModelId: item.phoneModelId?._id || item.phoneModelId,
                name: item.name,
                colorName: item.colorName,
                capacity: item.capacity,
                grade: item.grade || 'Mới',
                selectedParts: item.selectedParts ? item.selectedParts.map(p => p._id || p) : [], 
                image: item.image,
                price: item.price,
                quantity: item.quantity,
                warrantyPeriod: item.productType === 'CUSTOM_BUILD' ? 6 : 12 
            }));

            const orderPayload = {
                userId: user._id || user.id,
                storeId: selectedStoreId,
                items: formattedItems,
                totalAmount: totalAmount,
                shippingInfo: {
                    deliveryMethod,
                    fullName: deliveryMethod === 'home' ? shippingInfo.receiverName : (user.name || 'Khách hàng'),
                    phone: deliveryMethod === 'home' ? shippingInfo.receiverPhone : customerPhone,
                    province: shippingInfo.province,
                    district: shippingInfo.district,
                    ward: shippingInfo.ward,
                    address: shippingInfo.address,
                    note: shippingInfo.note
                },
                paymentMethod: selectedPaymentMethod 
            };

            // GỌI TẠO ĐƠN API
            const orderData = await submitOrderApi(orderPayload);
            if (!orderData) {
                setLoading(false);
                return; // Nếu lỗi đã có toast ở hàm api
            }
            
            const createdOrderId = orderData.orderId || orderData.data?._id || orderData._id;

            if (!createdOrderId) {
                toast.error("Hệ thống chưa trả về Mã Đơn Hàng, vui lòng kiểm tra Backend!");
                setLoading(false);
                return; 
            }

            // XỬ LÝ CHUYỂN HƯỚNG THEO CỔNG THANH TOÁN
            if (selectedPaymentMethod === 'VNPAY') {
                const paymentData = await createVnpayPaymentApi(totalAmount, createdOrderId);
                if (paymentData && paymentData.paymentUrl) {
                    window.location.href = paymentData.paymentUrl;
                }
            } else if (selectedPaymentMethod === 'PAYOS') {
                // Xóa giỏ hàng
                await clearCartApi(user._id || user.id);
                window.dispatchEvent(new Event('cartUpdated')); 
                
                toast.success("Đang chuyển hướng đến cổng thanh toán...");
                
                if (orderData.checkoutUrl) {
                    window.location.href = orderData.checkoutUrl;
                } else {
                    toast.error("Không thể tạo link thanh toán PayOS!");
                }
            }
        } catch (error) {
            console.error("Lỗi đặt hàng chi tiết:", error);
            toast.error("Lỗi khi xử lý thanh toán! Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const getShippingAddressString = () => {
        if (deliveryMethod === 'store') {
            const st = stores.find(s => s._id === selectedStoreId);
            return st ? `${st.name} - ${st.location || st.address}` : '';
        }
        return `${shippingInfo.address}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.province}`;
    };

    if (loading) return <CustomerLayout><div className="min-h-[60vh] flex justify-center items-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div></CustomerLayout>;

    return (
        <CustomerLayout>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="bg-[#f4f6f8] min-h-screen py-8 pb-20">
                <div className="max-w-5xl mx-auto px-4">
                    
                    <div className="flex items-center justify-between mb-6">
                        <Link to="/cart" className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition">
                            <ChevronLeft size={20} className="mr-1" /> Quay lại giỏ hàng
                        </Link>
                    </div>

                    <div className="flex bg-white rounded-t-xl border-b-2 border-gray-100 mb-6 shadow-sm overflow-hidden cursor-pointer">
                        <div onClick={() => setCurrentStep(1)} className={`w-1/2 text-center py-3.5 font-bold text-sm uppercase tracking-wide transition-colors ${currentStep === 1 ? 'border-b-2 border-[#d70018] text-[#d70018] bg-red-50/30' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}>
                            1. THÔNG TIN
                        </div>
                        <div className={`w-1/2 text-center py-3.5 font-bold text-sm uppercase tracking-wide transition-colors ${currentStep === 2 ? 'border-b-2 border-[#d70018] text-[#d70018] bg-red-50/30' : 'text-gray-400 bg-gray-50/50'}`}>
                            2. THANH TOÁN
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        <div className="lg:col-span-7 space-y-6">
                            
                            {currentStep === 1 && (
                                <>
                                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                        <h2 className="text-gray-800 text-sm font-bold uppercase mb-4 flex items-center gap-2">
                                            THÔNG TIN KHÁCH HÀNG
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Họ và tên</label>
                                                <div className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50 text-sm font-medium text-gray-700 cursor-not-allowed">
                                                    {user?.name || "Khách hàng"}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email</label>
                                                <div className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50 text-sm font-medium text-gray-700 cursor-not-allowed">
                                                    {user?.email}
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 relative">
                                                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="tel" 
                                                    required
                                                    value={customerPhone} 
                                                    onChange={(e) => {
                                                        setCustomerPhone(e.target.value);
                                                        setShippingInfo(prev => ({...prev, receiverPhone: e.target.value}));
                                                    }}
                                                    className={`w-full border p-2.5 rounded-lg text-sm outline-none transition-all ${!customerPhone ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                                                    placeholder="Nhập số điện thoại của bạn..."
                                                />
                                                {!customerPhone && <p className="text-[12px] text-red-500 mt-1.5 italic">Vui lòng nhập SĐT để chúng tôi tiện liên hệ.</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <h2 className="text-gray-800 text-sm font-bold uppercase mb-0 p-5 md:p-6 pb-3">THÔNG TIN NHẬN HÀNG</h2>
                                        
                                        <div className="flex border-b border-gray-100 bg-gray-50/50">
                                            <button onClick={() => setDeliveryMethod('store')} className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${deliveryMethod === 'store' ? 'bg-white text-gray-800 border-b-2 border-[#d70018]' : 'text-gray-500 hover:text-gray-700'}`}>
                                                <Store size={18} className={deliveryMethod === 'store' ? 'text-[#d70018]' : ''} /> Nhận tại cửa hàng
                                            </button>
                                            <button onClick={() => setDeliveryMethod('home')} className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${deliveryMethod === 'home' ? 'bg-white text-gray-800 border-b-2 border-[#d70018]' : 'text-gray-500 hover:text-gray-700'}`}>
                                                <Truck size={18} className={deliveryMethod === 'home' ? 'text-[#d70018]' : ''} /> Giao hàng tận nơi
                                            </button>
                                        </div>

                                        <div className="p-5 md:p-6 space-y-4">
                                            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mb-2">
                                                <label className="block text-[13px] font-bold text-gray-800 mb-2 flex items-center gap-2">
                                                    <MapPin size={16} className="text-[#d70018]"/> Chi nhánh phục vụ / Xuất hàng
                                                </label>
                                                <select 
                                                    disabled
                                                    value={selectedStoreId} 
                                                    className="w-full border border-gray-200 p-2.5 rounded-lg outline-none bg-gray-100 text-sm font-bold text-gray-600 cursor-not-allowed appearance-none"
                                                >
                                                    {stores.map(s => <option key={s._id} value={s._id}>{s.name} - {s.location || s.address}</option>)}
                                                </select>
                                            </div>

                                            {deliveryMethod === 'home' ? (
                                                <div className="space-y-4 animate-in fade-in duration-300">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Tên người nhận <span className="text-red-500">*</span></label>
                                                            <input type="text" value={shippingInfo.receiverName} onChange={e => setShippingInfo({...shippingInfo, receiverName: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" placeholder="Họ và tên..."/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">SĐT người nhận <span className="text-red-500">*</span></label>
                                                            <input type="tel" value={shippingInfo.receiverPhone} onChange={e => setShippingInfo({...shippingInfo, receiverPhone: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" placeholder="Số điện thoại..."/>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                                                            <select value={provCode} onChange={handleProvinceChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 bg-white">
                                                                <option value="">Chọn Tỉnh/Thành</option>
                                                                {locations.map(p => <option key={p.Id} value={p.Id}>{p.Name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Quận / Huyện <span className="text-red-500">*</span></label>
                                                            <select disabled={!provCode} value={distCode} onChange={handleDistrictChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
                                                                <option value="">Chọn Quận/Huyện</option>
                                                                {availableDistricts.map(d => <option key={d.Id} value={d.Id}>{d.Name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Phường / Xã <span className="text-red-500">*</span></label>
                                                            <select disabled={!distCode} value={wardCode} onChange={handleWardChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
                                                                <option value="">Chọn Phường/Xã</option>
                                                                {availableWards.map(w => <option key={w.Id} value={w.Id}>{w.Name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Số nhà, tên đường <span className="text-red-500">*</span></label>
                                                        <input type="text" value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" placeholder="VD: Số 304, Đường Ngô Gia Tự..."/>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 animate-in fade-in duration-300">
                                                    <p className="text-[13px] text-green-700 font-medium flex items-start gap-2">
                                                        <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0"/> 
                                                        <span>Bạn vui lòng thanh toán trước, sau đó đến trực tiếp <strong>Chi nhánh đã chọn</strong> đọc SĐT để nhận máy nhé!</span>
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Ghi chú khác (Nếu có)</label>
                                                <textarea value={shippingInfo.note} onChange={e => setShippingInfo({...shippingInfo, note: e.target.value})} rows="2" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 resize-none" placeholder="Nhập ghi chú cho nhân viên..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                        <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Tổng tiền hàng</span>
                                                <span className="font-semibold text-gray-800">{formatMoney(totalAmount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Phí vận chuyển</span>
                                                <span className="font-semibold text-gray-800">Miễn phí</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="font-bold text-gray-800 text-lg">Tổng tiền</div>
                                                <div className="text-[11px] text-gray-500">Đã gồm VAT và được làm tròn</div>
                                            </div>
                                            <span className="text-2xl md:text-3xl font-extrabold text-[#d70018]">{formatMoney(totalAmount)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                        <h2 className="text-gray-800 text-sm font-bold uppercase mb-4">THÔNG TIN THANH TOÁN</h2>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div 
                                                onClick={() => setSelectedPaymentMethod('PAYOS')}
                                                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col shadow-sm relative overflow-hidden transition ${selectedPaymentMethod === 'PAYOS' ? 'border-[#d70018] bg-red-50/10' : 'border-gray-200 hover:border-red-300'}`}
                                            >
                                                {selectedPaymentMethod === 'PAYOS' && (
                                                    <div className="absolute top-0 right-0 bg-[#d70018] text-white rounded-bl-lg px-1 pb-0.5"><Check size={14} strokeWidth={3} /></div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 flex-shrink-0 bg-white rounded shadow-sm flex items-center justify-center p-1 border ${selectedPaymentMethod === 'PAYOS' ? 'border-red-200' : 'border-gray-200'}`}>
                                                        <QrCode className="w-6 h-6 text-[#d70018]" strokeWidth={2} />
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold text-[14px] ${selectedPaymentMethod === 'PAYOS' ? 'text-[#d70018]' : 'text-gray-800'}`}>Chuyển khoản VietQR</h3>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">Tự động xác nhận giao dịch</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div onClick={() => setSelectedPaymentMethod('VNPAY')} className={`p-4 rounded-xl border-2 cursor-pointer flex items-start shadow-sm relative overflow-hidden transition h-min ${selectedPaymentMethod === 'VNPAY' ? 'border-[#d70018] bg-red-50/20' : 'border-gray-200 hover:border-red-300'}`}>
                                                {selectedPaymentMethod === 'VNPAY' && (
                                                    <div className="absolute top-0 right-0 bg-[#d70018] text-white rounded-bl-lg px-1 pb-0.5"><Check size={14} strokeWidth={3} /></div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 flex-shrink-0 bg-white rounded shadow-sm flex items-center justify-center p-1 border ${selectedPaymentMethod === 'VNPAY' ? 'border-red-200' : 'border-gray-200'}`}>
                                                        <CreditCard className="w-6 h-6 text-[#d70018]" strokeWidth={2} />
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold text-[14px] ${selectedPaymentMethod === 'VNPAY' ? 'text-[#d70018]' : 'text-gray-800'}`}>Thanh toán qua VNPAY</h3>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">Thẻ nội địa, Thẻ quốc tế, Ví điện tử</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                        <h2 className="text-gray-800 text-sm font-bold uppercase mb-4">THÔNG TIN NHẬN HÀNG</h2>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                                                <span className="text-gray-500 w-1/3">Khách hàng</span>
                                                <span className="text-gray-800 font-medium text-right flex-1">{user?.name}</span>
                                            </div>
                                            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                                                <span className="text-gray-500 w-1/3">Số điện thoại</span>
                                                <span className="text-gray-800 font-medium text-right flex-1">{customerPhone}</span>
                                            </div>
                                            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                                                <span className="text-gray-500 w-1/3">Email</span>
                                                <span className="text-gray-800 font-medium text-right flex-1">{user?.email}</span>
                                            </div>
                                            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                                                <span className="text-gray-500 w-1/3">{deliveryMethod === 'home' ? 'Giao hàng đến' : 'Nhận máy tại'}</span>
                                                <span className="text-gray-800 font-medium text-right flex-1 leading-snug">{getShippingAddressString()}</span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-gray-500 w-1/3">Người nhận</span>
                                                <span className="text-gray-800 font-medium text-right flex-1">{deliveryMethod === 'home' ? `${shippingInfo.receiverName} - ${shippingInfo.receiverPhone}` : `${user?.name} - ${customerPhone}`}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* CỘT PHẢI */}
                        <div className="lg:col-span-5">
                            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                                <h2 className="text-gray-800 text-sm font-bold uppercase mb-4 border-b border-gray-100 pb-3 flex justify-between items-center">
                                    <span>ĐƠN HÀNG CỦA BẠN</span>
                                    <span className="text-blue-600 cursor-pointer hover:underline text-xs" onClick={() => navigate('/cart')}>Sửa</span>
                                </h2>
                                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                    {checkoutItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="w-16 h-16 bg-white rounded-lg p-1 border border-gray-200 flex-shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h3 className="font-bold text-gray-800 text-[13px] leading-snug line-clamp-2">
                                                        {item.name} {item.grade && item.grade !== 'Mới' && item.grade !== 'Assembled' && `(${item.grade})`}
                                                    </h3>
                                                    <span className="text-[12px] font-semibold text-gray-500 flex-shrink-0">x{item.quantity}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className="text-[12px] text-gray-500">{item.capacity} - {item.colorName}</span>
                                                    <span className="text-[#d70018] font-bold text-sm">{formatMoney(item.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg border border-gray-200 sticky top-24">
                                
                                {currentStep === 2 && (
                                    <div className="mb-4">
                                        <label className="flex items-start gap-2 cursor-pointer group">
                                            <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                                                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded bg-white checked:bg-[#d70018] checked:border-[#d70018] transition-colors cursor-pointer"/>
                                                <Check size={14} className="text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3}/>
                                            </div>
                                            <span className="text-[13px] text-gray-600 leading-snug">
                                                Bằng việc Đặt hàng, bạn đồng ý với <strong className="text-blue-600 hover:underline">Điều khoản sử dụng</strong> của cửa hàng.
                                            </span>
                                        </label>
                                    </div>
                                )}

                                <div className="flex justify-between items-end mb-5">
                                    <span className="text-gray-800 font-bold">Tổng tiền tạm tính:</span>
                                    <span className="text-2xl md:text-3xl font-extrabold text-[#d70018]">{formatMoney(totalAmount)}</span>
                                </div>
                                
                                {currentStep === 1 ? (
                                    <button onClick={handleNextStep} className="w-full bg-[#d70018] text-white py-3.5 rounded-lg font-bold text-[15px] uppercase tracking-wide hover:bg-red-700 transition-all active:scale-[0.98] shadow-md flex justify-center items-center gap-2">
                                        TIẾP TỤC ĐỂ THANH TOÁN
                                    </button>
                                ) : (
                                    <button onClick={handleCheckout} className="w-full bg-[#d70018] text-white py-3.5 rounded-lg font-bold text-[15px] uppercase tracking-wide hover:bg-red-700 transition-all active:scale-[0.98] shadow-md flex justify-center items-center gap-2">
                                        {selectedPaymentMethod === 'VNPAY' ? 'THANH TOÁN QUA VNPAY' : 'HOÀN TẤT ĐẶT HÀNG'}
                                    </button>
                                )}
                                
                                <p className="text-center text-[11px] text-gray-400 mt-4 flex items-center justify-center gap-1.5">
                                    <ShieldCheck size={14} className="text-green-500"/> Giao dịch được mã hóa và bảo mật an toàn
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}} />
        </CustomerLayout>
    );
}