import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapPin, ChevronDown, Filter, CheckCircle2, ArrowUpDown, Smartphone, HardDrive } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast } from "react-toastify";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [inStockOnly, setInStockOnly] = useState(false);
    const [filterBrand, setFilterBrand] = useState("");
    const [sortBy, setSortBy] = useState("default");

    const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
    const [minPriceInput, setMinPriceInput] = useState("");
    const [maxPriceInput, setMaxPriceInput] = useState("");
    const [appliedMinPrice, setAppliedMinPrice] = useState(null);
    const [appliedMaxPrice, setAppliedMaxPrice] = useState(null);

    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(localStorage.getItem('selectedStoreId') || "");

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const [modelsRes, phonesRes, storesRes] = await Promise.all([
                    axiosClient.get('/phone_models/all'),
                    axiosClient.get('/phones/all'),
                    axiosClient.get('/stores/all')
                ]);

                const storeData = storesRes.data.data || storesRes.data || [];
                setStores(storeData);

                let activeStore = selectedStore;
                if (!activeStore && storeData.length > 0) {
                    activeStore = storeData[0]._id;
                    setSelectedStore(activeStore);
                    localStorage.setItem('selectedStoreId', activeStore);
                }

                const allModels = modelsRes.data.data || [];
                const allPhones = phonesRes.data.data || [];
                const keyword = query.toLowerCase();
                
                const filteredModels = allModels.filter(m => {
                    return m.name?.toLowerCase().includes(keyword);
                });

                const combinedData = [];

                filteredModels.forEach(model => {
                    const allModelPhones = allPhones.filter(p => {
                        const pStoreId = p.storeId?._id || p.storeId;
                        const pModelId = p.phoneModelId?._id || p.phoneModelId;
                        return (String(pModelId) === String(model._id)) && (String(pStoreId) === String(activeStore));
                    });
          
                    if (allModelPhones.length === 0) return;
          
                    
                    const newPhonesPhysical = allModelPhones.filter(p => p.grade === 'Mới' && p.source !== 'assembled');
                    const usedPhonesPhysical = allModelPhones.filter(p => p.grade !== 'Mới' && p.source !== 'assembled');
                    const assembledPhonesPhysical = allModelPhones.filter(p => p.source === 'assembled');
          
                    const getStartingPrice = (physicalList) => {
                        const validPrices = physicalList.map(p => p.sellingPrice || (p.importPrice * 1.15)).filter(price => !isNaN(price) && price > 0);
                        return validPrices.length > 0 ? Math.min(...validPrices) : (model.price || 0);
                    };
          
                    const getDisplayImage = (physicalList) => {
                        const phoneWithImg = physicalList.find(p => p.specificImages && p.specificImages.length > 0);
                        return phoneWithImg ? phoneWithImg.specificImages[0] : model.image;
                    };
          
                    if (newPhonesPhysical.length > 0) {
                        combinedData.push({
                            ...model,
                            image: getDisplayImage(newPhonesPhysical),
                            price: getStartingPrice(newPhonesPhysical),
                            stockCount: newPhonesPhysical.filter(p => p.status === 'in_stock').length,
                            isUsedCard: false,
                            isAssembledCard: false
                        });
                    }
          
                    if (usedPhonesPhysical.length > 0) {
                        combinedData.push({
                            ...model,
                            image: getDisplayImage(usedPhonesPhysical),
                            price: getStartingPrice(usedPhonesPhysical),
                            stockCount: usedPhonesPhysical.filter(p => p.status === 'in_stock').length,
                            isUsedCard: true,
                            isAssembledCard: false
                        });
                    }

                    if (assembledPhonesPhysical.length > 0) {
                        combinedData.push({
                            ...model,
                            image: getDisplayImage(assembledPhonesPhysical),
                            price: getStartingPrice(assembledPhonesPhysical),
                            stockCount: assembledPhonesPhysical.filter(p => p.status === 'in_stock').length,
                            isUsedCard: false,
                            isAssembledCard: true
                        });
                    }
                });

                setProducts(combinedData);
            } catch (error) { toast.error("Lỗi tải kết quả tìm kiếm"); } 
            finally { setLoading(false); }
        };

        if (query) fetchResults();
    }, [query, selectedStore]);

    const handleStoreChange = (e) => {
        const storeId = e.target.value;
        setSelectedStore(storeId);
        localStorage.setItem('selectedStoreId', storeId);
        window.dispatchEvent(new Event('storeChanged'));
    };

    const formatNumber = (val) => val ? new Intl.NumberFormat('vi-VN').format(val) : "";
    const handlePriceInputChange = (e, setter) => setter(e.target.value.replace(/\D/g, ""));

    const handleApplyPriceFilter = () => {
        const min = minPriceInput ? parseInt(minPriceInput) : null;
        const max = maxPriceInput ? parseInt(maxPriceInput) : null;
        if (min !== null && max !== null && min > max) return toast.warning("Giá tối thiểu không được lớn hơn!");
        setAppliedMinPrice(min); setAppliedMaxPrice(max); setIsPriceDropdownOpen(false);
    };

    const handleClearPriceFilter = () => {
        setMinPriceInput(""); setMaxPriceInput("");
        setAppliedMinPrice(null); setAppliedMaxPrice(null); setIsPriceDropdownOpen(false);
    };

    const getPriceButtonLabel = () => {
        if (appliedMinPrice !== null && appliedMaxPrice !== null) return `${formatNumber(appliedMinPrice)}đ - ${formatNumber(appliedMaxPrice)}đ`;
        if (appliedMinPrice !== null) return `Từ ${formatNumber(appliedMinPrice)}đ`;
        if (appliedMaxPrice !== null) return `Dưới ${formatNumber(appliedMaxPrice)}đ`;
        return "Xem theo giá";
    };

    const availableBrands = useMemo(() => {
        const brandMap = new Map();
        products.forEach(p => {
            if (p.brand) {
                const bId = p.brand._id || p.brand;
                const bName = p.brand.name || "Khác";
                if (!brandMap.has(bId)) brandMap.set(bId, bName);
            }
        });
        return Array.from(brandMap, ([id, name]) => ({ _id: id, name }));
    }, [products]);

    const filteredProducts = useMemo(() => {
        let result = [...products];

        if (inStockOnly) result = result.filter(p => p.stockCount > 0);
        if (filterBrand) result = result.filter(p => (p.brand?._id || p.brand) === filterBrand);

        if (appliedMinPrice !== null || appliedMaxPrice !== null) {
            result = result.filter(p => {
                const price = p.price || 0;
                if (price === 0) return false; 
                const meetsMin = appliedMinPrice !== null ? price >= appliedMinPrice : true;
                const meetsMax = appliedMaxPrice !== null ? price <= appliedMaxPrice : true;
                return meetsMin && meetsMax;
            });
        }

        if (sortBy === "price_asc") result.sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (sortBy === "price_desc") result.sort((a, b) => (b.price || 0) - (a.price || 0));

        return result;
    }, [products, inStockOnly, filterBrand, appliedMinPrice, appliedMaxPrice, sortBy]);

    
    const newProducts = filteredProducts.filter(p => !p.isUsedCard && !p.isAssembledCard);
    const usedProducts = filteredProducts.filter(p => p.isUsedCard && !p.isAssembledCard);
    const assembledProducts = filteredProducts.filter(p => p.isAssembledCard);

    
    const ProductCard = ({ product }) => {
        const defaultImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png";
        const displayPrice = product.price > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) : "Đang cập nhật";
        const specs = product.specifications || {};

        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100 relative flex flex-col h-full">
                {product.isUsedCard && !product.isAssembledCard && <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">Máy Cũ</span>}
                {product.isAssembledCard && <span className="absolute top-3 left-3 bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">Máy Dựng</span>}
                
                {product.stockCount === 0 && <span className="absolute top-3 right-3 bg-gray-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-md z-10">Tạm hết hàng</span>}
                
                <Link to={`/product/${product._id}`} state={{ defaultIsUsed: product.isUsedCard, isAssembled: product.isAssembledCard }} className="overflow-hidden rounded-lg mb-4 flex justify-center items-center h-48 p-2">
                    <img src={product.image || defaultImage} alt={product.name} className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" />
                </Link>
                
                <div className="flex-1 flex flex-col">
                    <Link to={`/product/${product._id}`} state={{ defaultIsUsed: product.isUsedCard, isAssembled: product.isAssembledCard }}>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h4>
                    </Link>
                    <p className="text-red-600 font-bold text-lg mb-3">{displayPrice}</p>
                    <div className="flex flex-wrap gap-2 mt-auto mb-4">
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><Smartphone size={12} className="text-gray-400" /> {specs.screenSize || "N/A"}</div>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><HardDrive size={12} className="text-gray-400" /> {specs.internalStorage || "N/A"}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <CustomerLayout>
            <div className="w-full pb-10">
                <div className="flex justify-between items-end mb-6 pt-6">
                    <h1 className="text-2xl font-bold text-gray-800">Tìm thấy {filteredProducts.length} kết quả cho "{query}"</h1>
                    <div className="relative inline-block z-20">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white" size={18} />
                        <select value={selectedStore} onChange={handleStoreChange} className="appearance-none bg-[#e01a22] text-white text-sm font-bold py-2 pl-9 pr-8 rounded-lg outline-none cursor-pointer hover:bg-red-700 transition shadow-md">
                            {stores.map(s => <option key={s._id} value={s._id} className="bg-white text-gray-800">{s.name} - {s.location || s.address}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-5">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 font-semibold text-gray-700 mr-2"><Filter size={18} /> Lọc & Sắp xếp:</div>
                        
                        <div className="relative">
                            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="appearance-none border border-gray-300 text-sm rounded-lg pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white cursor-pointer transition font-medium text-gray-700">
                                <option value="">Tất cả Hãng</option>
                                {availableBrands.map(b => (<option key={b._id} value={b._id}>{b.name}</option>))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <button onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)} className={`flex items-center justify-between min-w-[160px] gap-2 border text-sm rounded-lg px-4 py-2.5 outline-none transition cursor-pointer ${(appliedMinPrice !== null || appliedMaxPrice !== null) || isPriceDropdownOpen ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 bg-gray-50 hover:bg-white text-gray-700 font-medium'}`}>
                                {getPriceButtonLabel()} <ChevronDown size={16} className={`transition-transform duration-200 ${isPriceDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isPriceDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsPriceDropdownOpen(false)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Hãy chọn mức giá phù hợp</h4>
                                        <div className="flex items-center justify-between gap-2 mb-5">
                                            <div className="relative flex-1"><input type="text" value={formatNumber(minPriceInput)} onChange={(e) => handlePriceInputChange(e, setMinPriceInput)} placeholder="0" className="w-full border border-gray-300 rounded-lg py-2 pl-3 pr-6 text-sm outline-none focus:border-blue-500 text-right"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">đ</span></div>
                                            <span className="text-gray-400 font-bold">-</span>
                                            <div className="relative flex-1"><input type="text" value={formatNumber(maxPriceInput)} onChange={(e) => handlePriceInputChange(e, setMaxPriceInput)} placeholder="100.000.000" className="w-full border border-gray-300 rounded-lg py-2 pl-3 pr-6 text-sm outline-none focus:border-blue-500 text-right"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">đ</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleClearPriceFilter} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition text-sm">Bỏ chọn</button>
                                            <button onClick={handleApplyPriceFilter} className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-500/20 text-sm">Xem kết quả</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)} 
                                className="appearance-none border border-gray-300 text-sm rounded-lg pl-9 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white cursor-pointer transition font-medium text-gray-700"
                            >
                                <option value="default">Sắp xếp: Nổi bật</option>
                                <option value="price_asc">Giá: Thấp đến Cao</option>
                                <option value="price_desc">Giá: Cao đến Thấp</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer ml-auto bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-200 hover:bg-green-100 transition text-sm font-medium">
                            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="hidden" />
                            <CheckCircle2 size={18} className={inStockOnly ? "text-green-600" : "text-gray-400"} /> Chỉ hiển thị hàng có sẵn
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="text-gray-400 mb-2 font-bold">Cửa hàng này không có sản phẩm phù hợp với bộ lọc</div>
                        <p className="text-sm text-gray-500">Vui lòng thử lại với từ khóa khác, thay đổi bộ lọc hoặc đổi cửa hàng.</p>
                    </div>
                ) : (
                    <>
                      
                        {newProducts.length > 0 && (
                            <div className="mb-14">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 uppercase flex items-center gap-2">
                                        <span className="w-1.5 h-7 bg-blue-600 rounded-full inline-block"></span>Điện Thoại Mới Chính Hãng
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {newProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                                </div>
                            </div>
                        )}

                        
                        {usedProducts.length > 0 && (
                            <div className="mb-14 p-6 bg-red-50/50 rounded-2xl border border-red-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-red-600 uppercase flex items-center gap-2">
                                        <span className="w-1.5 h-7 bg-red-600 rounded-full inline-block"></span>Máy Cũ Giá Rẻ - Trợ Giá Thu Cũ
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {usedProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                                </div>
                            </div>
                        )}

                        {assembledProducts.length > 0 && (
                            <div className="mb-10 p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-purple-700 uppercase flex items-center gap-2">
                                        <span className="w-1.5 h-7 bg-purple-600 rounded-full inline-block"></span>Máy Dựng (Tân Trang) Chuyên Nghiệp
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {assembledProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </CustomerLayout>
    );
}