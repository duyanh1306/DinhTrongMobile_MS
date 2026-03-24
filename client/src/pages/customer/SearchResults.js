import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Truck, CheckCircle, RotateCcw, MapPin, ChevronDown } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast } from "react-toastify";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [inStockOnly, setInStockOnly] = useState(false);
    const [conditionFilter, setConditionFilter] = useState(null); 

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
                    const matchName = m.name?.toLowerCase().includes(keyword);
                    const matchBrand = (m.brand?.name || m.brand || "").toString().toLowerCase().includes(keyword);
                    return matchName || matchBrand;
                });

                const combinedData = [];

                filteredModels.forEach(model => {
                    const allModelPhones = allPhones.filter(p => {
                        const pStoreId = p.storeId?._id || p.storeId;
                        const pModelId = p.phoneModelId?._id || p.phoneModelId;
                        return (String(pModelId) === String(model._id)) && (String(pStoreId) === String(activeStore));
                    });
          
                    if (allModelPhones.length === 0) return;
          
                    const newPhonesPhysical = allModelPhones.filter(p => p.grade === 'Mới');
                    const usedPhonesPhysical = allModelPhones.filter(p => p.grade && p.grade !== 'Mới');
          
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
                            isUsedCard: false
                        });
                    }
          
                    if (usedPhonesPhysical.length > 0) {
                        combinedData.push({
                            ...model,
                            image: getDisplayImage(usedPhonesPhysical),
                            price: getStartingPrice(usedPhonesPhysical),
                            stockCount: usedPhonesPhysical.filter(p => p.status === 'in_stock').length,
                            isUsedCard: true
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

    let filteredProducts = products;
    if (inStockOnly) filteredProducts = filteredProducts.filter(p => p.stockCount > 0);
    if (conditionFilter === 'new') filteredProducts = filteredProducts.filter(p => p.isUsedCard === false);
    else if (conditionFilter === 'used') filteredProducts = filteredProducts.filter(p => p.isUsedCard === true);

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

                <div className="mb-6">
                    <div className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Chọn theo tiêu chí</div>
                    <div className="flex flex-wrap gap-2.5 relative">
                        <button onClick={() => setInStockOnly(!inStockOnly)} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${inStockOnly ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}><Truck size={16}/> Sẵn hàng</button>
                        <button onClick={() => setConditionFilter(conditionFilter === 'new' ? null : 'new')} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${conditionFilter === 'new' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}><CheckCircle size={16}/> Hàng Mới</button>
                        <button onClick={() => setConditionFilter(conditionFilter === 'used' ? null : 'used')} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm transition ${conditionFilter === 'used' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'}`}><RotateCcw size={16}/> Hàng Cũ</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="text-gray-400 mb-2 font-bold">Cửa hàng này không có sản phẩm phù hợp</div>
                        <p className="text-sm text-gray-500">Vui lòng thử lại với từ khóa khác hoặc đổi cửa hàng.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map((product, idx) => {
                            return (
                            <Link key={idx} to={`/product/${product._id}`} state={{ defaultIsUsed: product.isUsedCard }} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group relative overflow-hidden">
                                {product.isUsedCard && (<div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-sm">Máy Cũ</div>)}
                                {product.stockCount === 0 && <span className="absolute top-3 right-3 bg-gray-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-md z-10">Tạm hết hàng</span>}
                                
                                <div className="h-48 flex items-center justify-center p-2 mb-4 mt-4">
                                    <img src={product.image || "https://via.placeholder.com/400?text=No+Image"} alt={product.name} className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition">{product.name}</h3>
                                    <div className="text-red-600 font-bold text-lg mb-2 mt-auto">
                                        {product.price > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) : "Đang cập nhật"}
                                    </div>
                                </div>
                            </Link>
                        )})}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}