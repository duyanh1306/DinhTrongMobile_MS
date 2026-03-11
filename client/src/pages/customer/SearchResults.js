import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Filter, Truck, Smartphone, HardDrive, X, ChevronDown, CheckCircle, RotateCcw } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast } from "react-toastify";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("popular");

    const [inStockOnly, setInStockOnly] = useState(false);
    const [conditionFilter, setConditionFilter] = useState(null); 
    
    const [activeDropdown, setActiveDropdown] = useState(null); 
    const filterRef = useRef(null);

    const [tempPrice, setTempPrice] = useState({ min: "", max: "" });
    const [appliedPrice, setAppliedPrice] = useState({ min: "", max: "" });

    const [selectedStorages, setSelectedStorages] = useState([]);
    const [availableStorages, setAvailableStorages] = useState([]);

    // STATE MỚI CHO BỘ LỌC HÃNG
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [availableBrands, setAvailableBrands] = useState([]);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const [modelsRes, phonesRes] = await Promise.all([
                    axiosClient.get('/phone_models/all'),
                    axiosClient.get('/phones/all')
                ]);

                const allModels = modelsRes.data.data || [];
                const allPhones = phonesRes.data.data || [];

                const keyword = query.toLowerCase();
                
                const filteredModels = allModels.filter(m => {
                    const matchName = m.name?.toLowerCase().includes(keyword);
                    const brandName = m.brand?.name || m.brand || "";
                    const matchBrand = brandName.toString().toLowerCase().includes(keyword);
                    return matchName || matchBrand;
                });

                const combinedData = filteredModels.map(model => {
                    const allModelPhones = allPhones.filter(p => 
                        (p.phoneModelId?._id === model._id || p.phoneModelId === model._id)
                    );
                    const availablePhones = allModelPhones.filter(p => p.status === 'in_stock');

                    let startingPrice = Number(model.price) || Number(model.sellingPrice) || 0;
                    
                    if (allModelPhones.length > 0) {
                        const validPrices = allModelPhones
                            .map(p => {
                                const sp = Number(p.sellingPrice);
                                if (sp > 0) return sp;
                                const ip = Number(p.importPrice);
                                if (ip > 0) return ip * 1.15;
                                return 0;
                            })
                            .filter(price => !isNaN(price) && price > 0);
                            
                        if (validPrices.length > 0) {
                            startingPrice = Math.min(...validPrices);
                        }
                    }

                    let displayImage = model.image;
                    const phoneWithImage = allModelPhones.find(p => p.specificImages && p.specificImages.length > 0);
                    if (phoneWithImage) displayImage = phoneWithImage.specificImages[0];

                    return {
                        ...model,
                        price: startingPrice,
                        stockCount: availablePhones.length,
                        displayImage: displayImage || "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png"
                    };
                });

                setProducts(combinedData);
                
                // Trích xuất danh sách bộ nhớ và hãng có trong kết quả
                const storages = [...new Set(combinedData.map(p => p.specifications?.internalStorage).filter(Boolean))];
                setAvailableStorages(storages);

                const brands = [...new Set(combinedData.map(p => p.brand?.name || p.brand).filter(Boolean))];
                setAvailableBrands(brands);

            } catch (error) {
                toast.error("Lỗi tải kết quả tìm kiếm");
            } finally {
                setLoading(false);
            }
        };

        if (query) fetchResults();
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleApplyPrice = () => {
        setAppliedPrice(tempPrice);
        setActiveDropdown(null);
    };

    const toggleStorage = (storage) => {
        setSelectedStorages(prev => 
            prev.includes(storage) ? prev.filter(s => s !== storage) : [...prev, storage]
        );
    };

    const toggleBrand = (brand) => {
        setSelectedBrands(prev => 
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    const removeFilter = (type) => {
        if (type === 'inStock') setInStockOnly(false);
        if (type === 'condition') setConditionFilter(null);
        if (type === 'price') { setAppliedPrice({ min: "", max: "" }); setTempPrice({ min: "", max: "" }); }
        if (type === 'storage') setSelectedStorages([]);
        if (type === 'brand') setSelectedBrands([]);
    };

    let filteredProducts = products;

    if (inStockOnly) {
        filteredProducts = filteredProducts.filter(p => p.stockCount > 0);
    }

    if (conditionFilter === 'new') {
        filteredProducts = filteredProducts.filter(p => p.condition === 1);
    } else if (conditionFilter === 'used') {
        filteredProducts = filteredProducts.filter(p => p.condition < 1);
    }

    if (appliedPrice.min !== "") {
        filteredProducts = filteredProducts.filter(p => p.price >= Number(appliedPrice.min));
    }
    if (appliedPrice.max !== "") {
        filteredProducts = filteredProducts.filter(p => p.price > 0 && p.price <= Number(appliedPrice.max));
    }

    if (selectedStorages.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedStorages.includes(p.specifications?.internalStorage));
    }

    if (selectedBrands.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedBrands.includes(p.brand?.name || p.brand));
    }

    filteredProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price_asc") return (a.price === 0 ? Infinity : a.price) - (b.price === 0 ? Infinity : b.price);
        if (sortBy === "price_desc") return b.price - a.price;
        return 0; 
    });

    return (
        <CustomerLayout>
            <div className="w-full pb-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Tìm thấy {filteredProducts.length} kết quả cho "{query}"</h1>
                </div>

                <div className="mb-6" ref={filterRef}>
                    <div className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Chọn theo tiêu chí</div>
                    <div className="flex flex-wrap gap-2.5 relative">
                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-blue-500 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition"><Filter size={16} /> Bộ lọc</button>
                        <button onClick={() => setInStockOnly(!inStockOnly)} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${inStockOnly ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}><Truck size={16}/> Sẵn hàng</button>
                        <button onClick={() => setConditionFilter(conditionFilter === 'new' ? null : 'new')} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${conditionFilter === 'new' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}><CheckCircle size={16}/> Hàng Mới</button>
                        <button onClick={() => setConditionFilter(conditionFilter === 'used' ? null : 'used')} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${conditionFilter === 'used' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}><RotateCcw size={16}/> Hàng Cũ</button>

                        {/* TÌM KIẾM THEO HÃNG */}
                        {availableBrands.length > 0 && (
                            <div className="relative">
                                <button onClick={() => setActiveDropdown(activeDropdown === 'brand' ? null : 'brand')} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${(selectedBrands.length > 0 || activeDropdown === 'brand') ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}>Hãng <ChevronDown size={14}/></button>
                                {activeDropdown === 'brand' && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in duration-200">
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {availableBrands.map(brand => (
                                                <button key={brand} onClick={() => toggleBrand(brand)} className={`py-1.5 border rounded-lg text-sm transition ${selectedBrands.includes(brand) ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>{brand}</button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 border-t pt-3">
                                            <button onClick={() => {setSelectedBrands([]); setActiveDropdown(null);}} className="w-1/2 py-1.5 border rounded-lg text-sm hover:bg-gray-50 transition">Bỏ chọn</button>
                                            <button onClick={() => setActiveDropdown(null)} className="w-1/2 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Xem kết quả</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="relative">
                            <button onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${(appliedPrice.min || appliedPrice.max || activeDropdown === 'price') ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}>Xem theo giá <ChevronDown size={14}/></button>
                            {activeDropdown === 'price' && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in duration-200">
                                    <div className="text-sm font-semibold mb-3">Khoảng giá phù hợp</div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <input type="number" placeholder="Từ..." value={tempPrice.min} onChange={e => setTempPrice({...tempPrice, min: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                                        <span>-</span>
                                        <input type="number" placeholder="Đến..." value={tempPrice.max} onChange={e => setTempPrice({...tempPrice, max: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => {setTempPrice({min:"", max:""}); setAppliedPrice({min:"", max:""}); setActiveDropdown(null);}} className="w-1/2 py-2 border rounded-lg text-sm hover:bg-gray-50 transition">Xóa</button>
                                        <button onClick={handleApplyPrice} className="w-1/2 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Áp dụng</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {availableStorages.length > 0 && (
                            <div className="relative">
                                <button onClick={() => setActiveDropdown(activeDropdown === 'storage' ? null : 'storage')} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${(selectedStorages.length > 0 || activeDropdown === 'storage') ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}>Bộ nhớ trong <ChevronDown size={14}/></button>
                                {activeDropdown === 'storage' && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in duration-200">
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {availableStorages.map(storage => (
                                                <button key={storage} onClick={() => toggleStorage(storage)} className={`py-1.5 border rounded-lg text-sm transition ${selectedStorages.includes(storage) ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>{storage}</button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 border-t pt-3">
                                            <button onClick={() => {setSelectedStorages([]); setActiveDropdown(null);}} className="w-1/2 py-1.5 border rounded-lg text-sm hover:bg-gray-50 transition">Bỏ chọn</button>
                                            <button onClick={() => setActiveDropdown(null)} className="w-1/2 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Xem kết quả</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {(inStockOnly || conditionFilter || appliedPrice.min || appliedPrice.max || selectedStorages.length > 0 || selectedBrands.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className="text-sm font-semibold text-gray-700 mr-2">Đang lọc theo:</span>
                        {inStockOnly && (<div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Sẵn hàng <button onClick={() => removeFilter('inStock')} className="hover:bg-blue-200 rounded-full p-0.5"><X size={12}/></button></div>)}
                        {conditionFilter && (<div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">{conditionFilter === 'new' ? 'Hàng Mới' : 'Hàng Cũ'} <button onClick={() => removeFilter('condition')} className="hover:bg-blue-200 rounded-full p-0.5"><X size={12}/></button></div>)}
                        {(appliedPrice.min || appliedPrice.max) && (<div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Giá: {appliedPrice.min ? `${Number(appliedPrice.min).toLocaleString()}đ` : '0đ'} - {appliedPrice.max ? `${Number(appliedPrice.max).toLocaleString()}đ` : 'Max'}<button onClick={() => removeFilter('price')} className="hover:bg-blue-200 rounded-full p-0.5"><X size={12}/></button></div>)}
                        {selectedBrands.length > 0 && (<div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Hãng: {selectedBrands.join(' | ')}<button onClick={() => removeFilter('brand')} className="hover:bg-blue-200 rounded-full p-0.5"><X size={12}/></button></div>)}
                        {selectedStorages.length > 0 && (<div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Bộ nhớ: {selectedStorages.join(' | ')}<button onClick={() => removeFilter('storage')} className="hover:bg-blue-200 rounded-full p-0.5"><X size={12}/></button></div>)}
                        <button onClick={() => {setInStockOnly(false); setConditionFilter(null); setAppliedPrice({min:"", max:""}); setSelectedStorages([]); setSelectedBrands([]);}} className="text-sm text-red-500 hover:text-red-600 font-medium ml-2 transition">Xóa tất cả</button>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                    <div className="font-semibold text-gray-800">Sắp xếp theo:</div>
                    <div className="flex gap-2">
                        <button onClick={() => setSortBy("popular")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${sortBy === 'popular' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>☆ Phổ biến</button>
                        <button onClick={() => setSortBy("price_asc")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${sortBy === 'price_asc' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>↑ Giá Thấp - Cao</button>
                        <button onClick={() => setSortBy("price_desc")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${sortBy === 'price_desc' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>↓ Giá Cao - Thấp</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="text-gray-400 mb-2 font-bold">Rất tiếc, chúng tôi không tìm thấy kết quả phù hợp</div>
                        <p className="text-sm text-gray-500">Vui lòng thử lại với từ khóa khác.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map((product) => (
                            <Link key={product._id} to={`/product/${product._id}`} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group relative overflow-hidden">
                                
                                <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl z-10">Trả góp 0%</div>
                                {product.condition < 1 && (<div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-sm">Cũ {Math.round(product.condition * 100)}%</div>)}

                                <div className="h-48 flex items-center justify-center p-2 mb-4 mt-4">
                                    <img src={product.displayImage} alt={product.name} className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" />
                                </div>

                                <div className="flex flex-col flex-1">
                                    <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition">{product.name}</h3>
                                    
                                    {product.stockCount === 0 ? (
                                        <span className="inline-block bg-gray-100 text-gray-400 text-xs font-semibold px-2 py-1 rounded w-max mb-2">Tạm hết hàng</span>
                                    ) : null}

                                    <div className="text-red-600 font-bold text-lg mb-2 mt-auto">
                                        {product.price > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) : "Đang cập nhật"}
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        <span className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><Smartphone size={10}/> {product.specifications?.screenSize || 'N/A'}</span>
                                        <span className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><HardDrive size={10}/> {product.specifications?.internalStorage || 'N/A'}</span>
                                    </div>

                                    <div className="mt-auto bg-blue-50/50 border border-blue-100 p-2 rounded-lg text-[11px] text-gray-600 group-hover:bg-blue-100 transition">
                                        <p>Thu cũ đổi mới trợ giá đến <span className="font-bold text-blue-600">2 triệu</span></p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}