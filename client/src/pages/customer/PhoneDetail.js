import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, ShieldCheck, Truck, RotateCcw, Cpu, Smartphone, Battery, HardDrive, Camera } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast } from "react-toastify";

export default function PhoneDetail() {
    const { id } = useParams(); // Lấy ID của dòng máy từ thanh URL
    const navigate = useNavigate();

    const [model, setModel] = useState(null);
    const [availablePhones, setAvailablePhones] = useState([]);
    
    // States quản lý thao tác của khách hàng
    const [selectedCapacity, setSelectedCapacity] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [currentPrice, setCurrentPrice] = useState(0);
    const [displayImage, setDisplayImage] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                // Lấy song song Danh mục máy và Kho máy vật lý
                const [modelsRes, phonesRes] = await Promise.all([
                    axiosClient.get('/phone_models/all'),
                    axiosClient.get('/phones/all')
                ]);

                const allModels = modelsRes.data.data || [];
                const allPhones = phonesRes.data.data || [];

                // 1. Tìm bản thiết kế (Thông số) của chiếc máy này
                const currentModel = allModels.find(m => m._id === id);
                if (!currentModel) {
                    toast.error("Không tìm thấy sản phẩm!");
                    navigate("/home");
                    return;
                }
                setModel(currentModel);
                setDisplayImage(currentModel.image);

                // 2. Lọc ra những chiếc máy thực tế thuộc dòng này và đang CÒN HÀNG
                const phonesInStock = allPhones.filter(p => 
                    (p.phoneModelId?._id === id || p.phoneModelId === id) && 
                    p.status === 'in_stock'
                );
                setAvailablePhones(phonesInStock);

                // 3. Tự động bôi đen cấu hình rẻ nhất lúc khách vừa vào trang
                if (phonesInStock.length > 0) {
                    const lowestPricePhone = phonesInStock.reduce((prev, curr) => {
                        const prevPrice = prev.sellingPrice || (prev.importPrice * 1.15);
                        const currPrice = curr.sellingPrice || (curr.importPrice * 1.15);
                        return prevPrice < currPrice ? prev : curr;
                    });

                    setSelectedCapacity(lowestPricePhone.capacity);
                    setSelectedColor(lowestPricePhone.colorName);
                    
                    // Ưu tiên hiển thị ảnh chụp thực tế (nếu là máy cũ có ảnh)
                    if (lowestPricePhone.specificImages && lowestPricePhone.specificImages.length > 0) {
                        setDisplayImage(lowestPricePhone.specificImages[0]);
                    }
                }

            } catch (error) {
                toast.error("Lỗi khi tải dữ liệu sản phẩm.");
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id, navigate]);

    // Lắng nghe sự kiện: Mỗi khi khách đổi Dung lượng hoặc Màu -> Tính lại giá ngay lập tức
    useEffect(() => {
        if (availablePhones.length > 0 && selectedCapacity && selectedColor) {
            const matchedPhone = availablePhones.find(p => p.capacity === selectedCapacity && p.colorName === selectedColor);
            
            if (matchedPhone) {
                const price = matchedPhone.sellingPrice || (matchedPhone.importPrice * 1.15);
                setCurrentPrice(price);
                
                if (matchedPhone.specificImages && matchedPhone.specificImages.length > 0) {
                    setDisplayImage(matchedPhone.specificImages[0]);
                } else if (model?.image) {
                    setDisplayImage(model.image);
                }
            } else {
                setCurrentPrice(0); // Báo hiệu tuỳ chọn này đang tạm hết hàng
            }
        }
    }, [selectedCapacity, selectedColor, availablePhones, model]);

    // Trích xuất tự động các nút bấm Dung Lượng và Màu Sắc từ kho
    const uniqueCapacities = [...new Set(availablePhones.map(p => p.capacity))].filter(Boolean);
    const availableColorsForCapacity = availablePhones
        .filter(p => p.capacity === selectedCapacity)
        .map(p => p.colorName)
        .filter((value, index, self) => self.indexOf(value) === index);

    if (loading) {
        return (
            <CustomerLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                </div>
            </CustomerLayout>
        );
    }

    if (!model) return null;

    const specs = model.specifications || {};
    const isOutOfStock = currentPrice === 0 || availablePhones.length === 0;

    return (
        <CustomerLayout>
            <div className="max-w-6xl mx-auto py-8 px-4">
                
                {/* THANH ĐIỀU HƯỚNG (BREADCRUMB) */}
                <div className="text-sm text-gray-500 mb-6">
                    <span className="hover:text-blue-600 cursor-pointer transition" onClick={() => navigate('/home')}>Trang chủ</span> 
                    <span className="mx-2">/</span> 
                    <span className="hover:text-blue-600 cursor-pointer transition">{model.brand}</span>
                    <span className="mx-2">/</span> 
                    <span className="text-gray-800 font-semibold">{model.name}</span>
                </div>

                {/* KHUNG THÔNG TIN CHÍNH */}
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-10">
                    
                    {/* BÊN TRÁI: ẢNH SẢN PHẨM */}
                    <div className="md:w-5/12 flex flex-col items-center">
                        <div className="w-full h-96 border border-gray-100 rounded-2xl p-4 flex items-center justify-center relative bg-gray-50">
                            {model.condition < 1 && (
                                <span className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-md shadow-sm">
                                    Máy cũ {Math.round(model.condition * 100)}%
                                </span>
                            )}
                            <img 
                                src={displayImage || "https://via.placeholder.com/400?text=No+Image"} 
                                alt={model.name} 
                                className="max-h-full max-w-full object-contain drop-shadow-md"
                            />
                        </div>
                        
                        {/* List ảnh nhỏ bên dưới (Thumbnail) */}
                        <div className="flex gap-3 mt-4 w-full overflow-x-auto pb-2">
                            {model.image && (
                                <div onClick={() => setDisplayImage(model.image)} className={`flex-shrink-0 w-16 h-16 border-2 rounded-lg p-1 cursor-pointer hover:border-blue-400 transition ${displayImage === model.image ? 'border-blue-600' : 'border-gray-100'}`}>
                                    <img src={model.image} className="w-full h-full object-contain" alt="default" />
                                </div>
                            )}
                            {availablePhones.find(p => p.capacity === selectedCapacity && p.colorName === selectedColor)?.specificImages?.map((img, idx) => (
                                <div key={idx} onClick={() => setDisplayImage(img)} className={`flex-shrink-0 w-16 h-16 border-2 rounded-lg p-1 cursor-pointer hover:border-blue-400 transition ${displayImage === img ? 'border-blue-600' : 'border-gray-100'}`}>
                                    <img src={img} className="w-full h-full object-cover rounded" alt={`specific-${idx}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BÊN PHẢI: GIÁ & MUA HÀNG */}
                    <div className="md:w-7/12 flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{model.name}</h1>
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Hãng: <span className="font-semibold text-blue-600">{model.brand}</span></span>
                            <span className="text-sm text-gray-500">Tình trạng: <span className="font-semibold text-green-600">{model.condition === 1 ? 'Mới 100%' : `Cũ ${Math.round(model.condition * 100)}%`}</span></span>
                        </div>

                        <div className="mb-6">
                            <div className="text-3xl md:text-4xl font-extrabold text-red-600">
                                {isOutOfStock ? 'Hết mẫu này' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
                            </div>
                        </div>

                        {/* NÚT CHỌN DUNG LƯỢNG */}
                        {uniqueCapacities.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">Chọn Dung Lượng:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {uniqueCapacities.map(cap => (
                                        <button
                                            key={cap}
                                            onClick={() => {
                                                setSelectedCapacity(cap);
                                                const colorsForNewCap = availablePhones.filter(p => p.capacity === cap).map(p => p.colorName);
                                                if (!colorsForNewCap.includes(selectedColor)) setSelectedColor(colorsForNewCap[0]);
                                            }}
                                            className={`px-5 py-2.5 rounded-xl border-2 font-semibold transition-all ${
                                                selectedCapacity === cap 
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                            }`}
                                        >
                                            {cap}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NÚT CHỌN MÀU SẮC */}
                        {availableColorsForCapacity.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">Chọn Màu Sắc:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {availableColorsForCapacity.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`px-5 py-2.5 rounded-xl border-2 font-semibold transition-all ${
                                                selectedColor === color 
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                            }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* KHUNG ƯU ĐÃI THÊM */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-6">
                            <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                                Khuyến mãi & Tiện ích
                            </h4>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex gap-3 items-start"><ShieldCheck className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5"/> <span>Bảo hành chính hãng 12 tháng tại các trung tâm uỷ quyền toàn quốc.</span></li>
                                <li className="flex gap-3 items-start"><RotateCcw className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5"/> <span>1 đổi 1 trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.</span></li>
                                <li className="flex gap-3 items-start"><Truck className="text-orange-500 w-5 h-5 flex-shrink-0 mt-0.5"/> <span>Giao hàng siêu tốc 2h trong nội thành. Miễn phí giao hàng toàn quốc.</span></li>
                            </ul>
                        </div>

                        {/* NÚT ĐẶT HÀNG */}
                        <div className="mt-auto">
                            <button 
                                disabled={isOutOfStock}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                    isOutOfStock 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5'
                                }`}
                            >
                                <ShoppingCart size={22} />
                                {isOutOfStock ? 'SẢN PHẨM TẠM HẾT HÀNG' : 'MUA NGAY'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* BẢNG THÔNG SỐ KỸ THUẬT (DƯỚI CÙNG) */}
                <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                        Cấu hình chi tiết {model.name}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        {[
                            { label: "Màn hình", icon: <Smartphone size={16}/>, value: specs.screenSize },
                            { label: "Công nghệ màn", icon: <Smartphone size={16}/>, value: specs.screenTechnology },
                            { label: "Độ phân giải", icon: <Smartphone size={16}/>, value: specs.screenResolution },
                            { label: "Tần số quét", icon: <Smartphone size={16}/>, value: specs.screenFeatures },
                            { label: "Camera sau", icon: <Camera size={16}/>, value: specs.rearCamera },
                            { label: "Camera trước", icon: <Camera size={16}/>, value: specs.frontCamera },
                            { label: "Vi xử lý (CPU)", icon: <Cpu size={16}/>, value: specs.cpu },
                            { label: "Chipset", icon: <Cpu size={16}/>, value: specs.chipset },
                            { label: "Bộ nhớ trong", icon: <HardDrive size={16}/>, value: specs.internalStorage },
                            { label: "Hệ điều hành", icon: <Cpu size={16}/>, value: specs.os },
                            { label: "Pin & Sạc", icon: <Battery size={16}/>, value: specs.sim },
                        ].map((item, idx) => item.value ? (
                            <div key={idx} className="flex items-start py-3.5 border-b border-gray-200/60 last:border-0 hover:bg-gray-50 transition px-2">
                                <div className="w-2/5 flex items-center gap-2 text-gray-500 text-sm font-medium">
                                    <span className="text-blue-500">{item.icon}</span>
                                    {item.label}
                                </div>
                                <div className="w-3/5 text-gray-800 text-sm font-semibold pl-2">
                                    {item.value}
                                </div>
                            </div>
                        ) : null)}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}