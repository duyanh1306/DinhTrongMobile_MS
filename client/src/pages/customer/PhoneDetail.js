import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingCart, ShieldCheck, Truck, RotateCcw, Cpu, Smartphone, Battery, HardDrive, Camera, Check } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReviewSection from '../../pages/customer/ReviewSection';
import Swal from "sweetalert2"; 

import { fetchPhoneDetailApi, calculateVersions, calculateColorsForVersion, addToCartApi } from "../../api/customer/phoneDetail";

export default function PhoneDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const location = useLocation();
    const defaultIsUsed = location.state?.defaultIsUsed;
    const isAssembled = location.state?.isAssembled; 
    const defaultPrice = location.state?.defaultPrice; 

    const [model, setModel] = useState(null);
    const [availablePhones, setAvailablePhones] = useState([]);
    
    const [selectedVersionKey, setSelectedVersionKey] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    
    const [currentPrice, setCurrentPrice] = useState(0);
    const [displayImage, setDisplayImage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProductData = async () => {
            setLoading(true);
            const data = await fetchPhoneDetailApi(id);
            if (data) {
                setModel(data.model);
                
               
                const activeStoreId = localStorage.getItem('selectedStoreId') || "";
                const storePhones = (data.availablePhones || []).filter(p => {
                    const pStoreId = p.storeId?._id || p.storeId;
                    return String(pStoreId) === String(activeStoreId);
                });
                
               
                let strictlyFilteredPhones = storePhones;
                if (isAssembled === true) {
                    strictlyFilteredPhones = storePhones.filter(p => p.grade === 'Máy dựng' || p.grade === 'Máy ráp');
                } else if (defaultIsUsed === true) {
                    strictlyFilteredPhones = storePhones.filter(p => p.grade && p.grade !== 'Mới' && p.grade !== 'Máy dựng' && p.grade !== 'Máy ráp');
                } else if (defaultIsUsed === false) {
                    strictlyFilteredPhones = storePhones.filter(p => !p.grade || p.grade === 'Mới');
                }

                setAvailablePhones(strictlyFilteredPhones);
                if (data.model.image) setDisplayImage(data.model.image);
            } else {
                toast.error("Không tìm thấy sản phẩm!");
                navigate("/home");
            }
            setLoading(false);
        };
        loadProductData();
    }, [id, navigate, defaultIsUsed, isAssembled]);

    const versions = useMemo(() => calculateVersions(availablePhones), [availablePhones]);

    useEffect(() => {
        if (versions.length > 0 && !selectedVersionKey) {
            setSelectedVersionKey(versions[0].key);
        }
    }, [versions, selectedVersionKey]);

    const colors = useMemo(() => calculateColorsForVersion(availablePhones, selectedVersionKey), [availablePhones, selectedVersionKey]);

    useEffect(() => {
        if (colors.length > 0) {
            if (!selectedColor || !colors.find(c => c.name === selectedColor)) setSelectedColor(colors[0].name);
        }
    }, [colors, selectedColor]);

    useEffect(() => {
        if (selectedColor && colors.length > 0) {
            const c = colors.find(x => x.name === selectedColor);
            if (c) {
                setCurrentPrice(c.price);
                if (c.image) setDisplayImage(c.image);
            }
        } else {
            setCurrentPrice(0); 
        }
    }, [selectedColor, colors]);

    const images = useMemo(() => {
        if (!selectedVersionKey) return model?.image ? [model.image] : [];
        const [cap, gr] = selectedVersionKey.split('|');
        const comboPhones = availablePhones.filter(p => p.capacity === cap && (p.grade || "Mới") === gr && p.colorName === selectedColor);
        const specificImgs = comboPhones.flatMap(p => p.specificImages || []);
        if (specificImgs.length > 0) return [...new Set(specificImgs)];
        return model?.image ? [model.image] : [];
    }, [availablePhones, selectedVersionKey, selectedColor, model]);

  
    const inStockCount = useMemo(() => {
        if (!selectedVersionKey || !selectedColor) return 0;
        const [cap, gr] = selectedVersionKey.split('|');
        return availablePhones.filter(p => 
            p.capacity === cap && 
            (p.grade || "Mới") === gr && 
            p.colorName === selectedColor &&
            p.status === 'in_stock' 
        ).length;
    }, [availablePhones, selectedVersionKey, selectedColor]);

    const isOutOfStock = inStockCount === 0 || currentPrice === 0 || versions.length === 0;

    const getFallbackPrice = () => {
        if (currentPrice > 0) return currentPrice;
        if (defaultPrice > 0) return defaultPrice; 
        if (model?.price) return model.price;
        if (model?.minPrice) return model.minPrice;
        if (availablePhones && availablePhones.length > 0) {
            const prices = availablePhones.map(p => p.sellingPrice || (p.importPrice * 1.15)).filter(p => p > 0);
            if (prices.length > 0) return Math.min(...prices);
        }
        return 0;
    };

    const nextImage = () => { if (images.length > 0) setDisplayImage(images[(images.indexOf(displayImage) + 1) % images.length]); };
    const prevImage = () => { if (images.length > 0) setDisplayImage(images[(images.indexOf(displayImage) - 1 + images.length) % images.length]); };

    const buildCartItem = () => {
        const [cap, gr] = selectedVersionKey.split('|');
        const finalName = `${model.name} ${gr !== 'Mới' ? `(${gr})` : ''}`.trim();
        
        const activeStoreId = localStorage.getItem('selectedStoreId') || "";
        return {
            productType: 'PHONE', phoneModelId: model._id, name: finalName,
            capacity: cap, grade: gr, colorName: selectedColor,
            price: currentPrice, image: displayImage, quantity: 1,
            storeId: activeStoreId 
        };
    };

    const handleRequireAuthAlert = () => {
        Swal.fire({
            title: 'Yêu cầu đăng nhập',
            text: 'Vui lòng đăng nhập hoặc tạo tài khoản để mua sản phẩm này!',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập ngay',
            cancelButtonText: 'Đăng ký tài khoản',
            customClass: {
                confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold py-2.5 px-6 rounded-xl mx-2 transition-all',
                popup: 'rounded-3xl'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                navigate('/login'); 
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                navigate('/register');
            }
        });
    };

    const handleAddToCart = async () => {
        if (isOutOfStock) return;
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return handleRequireAuthAlert(); 

        const newItem = buildCartItem();
        const success = await addToCartApi(user._id || user.id, newItem);
        
        if (success) {
            window.dispatchEvent(new Event('cartUpdated')); 
            toast.success("Đã thêm sản phẩm vào giỏ hàng!");
        }
    };

    const handleBuyNow = async () => {
        if (isOutOfStock) return;
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return handleRequireAuthAlert(); 

        const newItem = buildCartItem();
        const success = await addToCartApi(user._id || user.id, newItem);
        
        if (success) {
            window.dispatchEvent(new Event('cartUpdated')); 
            navigate('/checkout', { state: { selectedItems: [newItem] } });
        }
    };

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    if (loading) return <CustomerLayout><div className="min-h-[60vh] flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div></CustomerLayout>;
    if (!model) return null;
    
    const specs = model.specifications || {};
    const displayPriceValue = getFallbackPrice();

    return (
        <CustomerLayout>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-6xl mx-auto py-8 px-4">
                <div className="text-sm text-gray-500 mb-6">
                    <span className="hover:text-blue-600 cursor-pointer transition" onClick={() => navigate('/home')}>Trang chủ</span> <span className="mx-2">/</span> 
                    <span className="hover:text-blue-600 cursor-pointer transition">{model.brand?.name || model.brand}</span> <span className="mx-2">/</span> 
                    <span className="text-gray-800 font-semibold">{model.name}</span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-10">
                    <div className="md:w-5/12 flex flex-col items-center">
                        <div className="group w-full h-96 border border-gray-100 rounded-2xl p-4 flex items-center justify-center relative bg-gray-50 overflow-hidden">
                            {images.length > 1 && <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-blue-600 hover:text-white p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"><ChevronLeft size={24} /></button>}
                            <img src={displayImage || "https://via.placeholder.com/400?text=No+Image"} alt={model.name} className="max-h-full max-w-full object-contain drop-shadow-md transition-all duration-300"/>
                            {images.length > 1 && <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-blue-600 hover:text-white p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"><ChevronRight size={24} /></button>}
                        </div>
                        <div className="flex gap-3 mt-4 w-full overflow-x-auto pb-2 scrollbar-hide">
                            {images.map((img, idx) => (
                                <div key={idx} onClick={() => setDisplayImage(img)} className={`flex-shrink-0 w-16 h-16 border-2 rounded-lg p-1 cursor-pointer transition-all ${displayImage === img ? 'border-blue-600 scale-105 shadow-sm' : 'border-gray-100 hover:border-blue-300'}`}>
                                    <img src={img} className="w-full h-full object-cover rounded" alt={`specific-${idx}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:w-7/12 flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{model.name}</h1>
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Hãng: <span className="font-semibold text-blue-600">{model.brand?.name || model.brand}</span></span>
                        </div>

                        <div className="mb-6">
                       
                            <div className="text-3xl md:text-4xl font-extrabold text-red-600 flex items-end gap-3">
                                {displayPriceValue > 0 ? formatMoney(displayPriceValue) : 'Liên hệ để nhận báo giá'}
                            </div>
                            {isOutOfStock && <span className="inline-block mt-2 text-sm text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Tạm hết hàng tại chi nhánh này</span>}
                        </div>

                        {versions.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Phiên bản</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {versions.map(v => (
                                        <div key={v.key} onClick={() => setSelectedVersionKey(v.key)} className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition-all cursor-pointer overflow-hidden ${selectedVersionKey === v.key ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                                            {selectedVersionKey === v.key && <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-bl-lg px-1 pb-0.5"><Check size={14} strokeWidth={3} /></div>}
                                            <span className="font-bold text-center leading-tight">{v.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {colors.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Màu sắc</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {colors.map(c => (
                                        <div key={c.name} onClick={() => setSelectedColor(c.name)} className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer overflow-hidden ${selectedColor === c.name ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                                            {selectedColor === c.name && <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-bl-lg px-1 pb-0.5"><Check size={14} strokeWidth={3} /></div>}
                                            <span className="font-bold text-sm text-center line-clamp-1">{c.name}</span>
                                            <span className="text-[11px] font-semibold mt-1 opacity-80">{formatMoney(c.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-6">
                            <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-3">Khuyến mãi & Tiện ích</h4>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex gap-3 items-start"><ShieldCheck className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5"/> <span>Bảo hành chính hãng tại các trung tâm uỷ quyền toàn quốc.</span></li>
                                <li className="flex gap-3 items-start"><RotateCcw className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5"/> <span>1 đổi 1 trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.</span></li>
                                <li className="flex gap-3 items-start"><Truck className="text-orange-500 w-5 h-5 flex-shrink-0 mt-0.5"/> <span>Giao hàng siêu tốc 2h trong nội thành. Miễn phí giao hàng toàn quốc.</span></li>
                            </ul>
                        </div>

                    
                        <div className="mt-auto flex flex-col sm:flex-row gap-3">
                            <button onClick={handleBuyNow} disabled={isOutOfStock} className={`flex-1 py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center leading-tight transition-all ${isOutOfStock ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 hover:-translate-y-0.5'}`}>
                                <span className="uppercase">Mua ngay</span>
                                <span className="text-[11px] font-normal">(Giao tận nơi hoặc nhận tại cửa hàng)</span>
                            </button>
                            <button onClick={handleAddToCart} disabled={isOutOfStock} className={`w-full sm:w-20 py-4 rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 ${isOutOfStock ? 'border-red-200 text-red-300 bg-red-50 cursor-not-allowed' : 'border-red-600 text-red-600 hover:bg-red-50'}`}>
                                <ShoppingCart size={24} />
                                <span className="text-[10px] mt-1 uppercase whitespace-nowrap">Thêm giỏ</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7"><ReviewSection phoneModelId={model._id} /></div>
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span> Cấu hình chi tiết</h2>
                            <div className="flex flex-col bg-gray-50/50 rounded-xl p-2 border border-gray-100">
                                {[
                                    { label: "Màn hình", icon: <Smartphone size={16}/>, value: specs.screenSize },
                                    { label: "Công nghệ", icon: <Smartphone size={16}/>, value: specs.screenTechnology },
                                    { label: "Độ phân giải", icon: <Smartphone size={16}/>, value: specs.screenResolution },
                                    { label: "Tần số quét", icon: <Smartphone size={16}/>, value: specs.screenFeatures },
                                    { label: "Camera sau", icon: <Camera size={16}/>, value: specs.rearCamera },
                                    { label: "Camera trước", icon: <Camera size={16}/>, value: specs.frontCamera },
                                    { label: "Vi xử lý", icon: <Cpu size={16}/>, value: specs.cpu },
                                    { label: "Chipset", icon: <Cpu size={16}/>, value: specs.chipset },
                                    { label: "Lưu trữ", icon: <HardDrive size={16}/>, value: specs.internalStorage },
                                    { label: "HĐH", icon: <Cpu size={16}/>, value: specs.os },
                                    { label: "Pin & Sạc", icon: <Battery size={16}/>, value: specs.sim },
                                ].map((item, idx) => item.value ? (
                                    <div key={idx} className="flex items-start py-3 border-b border-gray-200/60 last:border-0 hover:bg-white transition px-3 rounded-lg">
                                        <div className="w-2/5 flex items-center gap-2 text-gray-500 text-sm font-medium"><span className="text-blue-500">{item.icon}</span>{item.label}</div>
                                        <div className="w-3/5 text-gray-800 text-sm font-semibold pl-2">{item.value}</div>
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}