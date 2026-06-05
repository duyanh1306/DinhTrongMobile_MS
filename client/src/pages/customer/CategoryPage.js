import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Smartphone, HardDrive, Filter, CheckCircle2, ChevronDown, MapPin, ArrowUpDown } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import CustomerLayout from "../../layouts/CustomerLayout";
import "react-toastify/dist/ReactToastify.css";

import { fetchCategoryDataApi } from "../../api/customer/category";

export default function CategoryPage() {
    const { type } = useParams();
    const navigate = useNavigate();

    const [allProducts, setAllProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterBrand, setFilterBrand] = useState("");
    const [filterInStock, setFilterInStock] = useState(false);
    const [sortBy, setSortBy] = useState("default");

    const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
    const [minPriceInput, setMinPriceInput] = useState("");
    const [maxPriceInput, setMaxPriceInput] = useState("");
    const [appliedMinPrice, setAppliedMinPrice] = useState(null);
    const [appliedMaxPrice, setAppliedMaxPrice] = useState(null);

    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(localStorage.getItem('selectedStoreId') || "");

    useEffect(() => {
        loadCategoryData();
        setFilterBrand("");
    }, [type, selectedStore]);

    const loadCategoryData = async () => {
        setLoading(true);
        try {
            const data = await fetchCategoryDataApi(type, selectedStore);
            if (data) {
                setStores(data.stores || []);
                if (data.activeStore && data.activeStore !== selectedStore) {
                    setSelectedStore(data.activeStore);
                    localStorage.setItem('selectedStoreId', data.activeStore);
                }
                setBrands(data.brands || []); 
                setAllProducts(data.allProducts || data.assembledPhones || data.products || data.data || []);
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu danh mục:", error);
            toast.error("Không thể tải danh sách sản phẩm");
        }
        setLoading(false);
    };

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

    const processedProducts = useMemo(() => {
        let result = [...allProducts];
        
        if (filterBrand) {
            result = result.filter(p => (p.brandId?._id || p.brandId) === filterBrand);
        }
        
        if (filterInStock) {
            result = result.filter(p => p.stockCount > 0);
        }
        
        if (appliedMinPrice !== null || appliedMaxPrice !== null) {
            result = result.filter(p => {
                const price = p.price || 0;
                if (price === 0) return false; 
                const meetsMin = appliedMinPrice !== null ? price >= appliedMinPrice : true;
                const meetsMax = appliedMaxPrice !== null ? price <= appliedMaxPrice : true;
                return meetsMin && meetsMax;
            });
        }
        
        if (sortBy === "price_asc") {
            result.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === "price_desc") {
            result.sort((a, b) => (b.price || 0) - (a.price || 0));
        }
        
        return result;
    }, [allProducts, filterBrand, filterInStock, appliedMinPrice, appliedMaxPrice, sortBy]);

    const ProductCard = ({ product }) => {
        const defaultImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png";
        const displayPrice = (product.price && product.price > 0) 
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) 
            : "Đang cập nhật";
        const specs = product.specifications || {};

        const isAssembled = type === 'assembled' || product.isAssembledCard;
        const isUsed = type === 'used' || (product.isUsedCard && !isAssembled);

        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100 relative flex flex-col h-full">
          
                {isUsed && <span className="absolute top-3 left-3 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">{product.customBadge || 'Máy Cũ'}</span>}
                {isAssembled && <span className="absolute top-3 left-3 bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">{product.customBadge || 'Máy Dựng'}</span>}
                
                {product.stockCount === 0 && <span className="absolute top-3 right-3 bg-gray-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-md z-10">Tạm hết hàng</span>}
                
            
                <Link to={`/product/${product._id}`} state={{ defaultIsUsed: isUsed, isAssembled: isAssembled, specificPhoneId: product.uniqueKey }} className="overflow-hidden rounded-lg mb-4 flex justify-center items-center h-48 p-2">
                    <img src={product.image || defaultImage} alt={product.name} className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" />
                </Link>
                
                <div className="flex-1 flex flex-col">
                    <Link to={`/product/${product._id}`} state={{ defaultIsUsed: isUsed, isAssembled: isAssembled, specificPhoneId: product.uniqueKey }}>
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

    if (loading) return <CustomerLayout><div className="min-h-[60vh] flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div></div></CustomerLayout>;

    const pageTitle = type === 'new' ? "Điện Thoại Mới Chính Hãng" : type === 'used' ? "Điện Thoại Cũ Giá Rẻ" : type === 'assembled' ? "Máy Dựng (Tân Trang) Chuyên Nghiệp" : "Tất Cả Điện Thoại";

    return (
        <CustomerLayout>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="w-full pb-10">

                <div className="flex justify-end mb-4 mt-2 pr-4 lg:pr-8">
                    <div className="relative inline-block z-50">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white" size={18} />
                        <select value={selectedStore} onChange={handleStoreChange} className="appearance-none bg-[#e01a22] text-white text-sm font-bold py-2 pl-9 pr-8 rounded-lg outline-none cursor-pointer hover:bg-red-700 transition shadow-md">
                            {stores.map(s => <option key={s._id} value={s._id} className="bg-white text-gray-800">{s.name} - {s.location || s.address}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/home')}>Trang chủ</span><span>/</span><span className="font-semibold text-gray-800">{pageTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase">{pageTitle}</h1>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">{processedProducts.length} sản phẩm</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-5">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2 font-semibold text-gray-700 mr-2"><Filter size={18} /> Lọc & Sắp xếp:</div>
                            
                            <div className="relative">
                                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="appearance-none border border-gray-300 text-sm rounded-lg pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white cursor-pointer transition font-medium text-gray-700">
                                    <option value="">Tất cả các Hãng</option>
                                    {brands.map(b => (<option key={b._id} value={b._id}>{b.name}</option>))}
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
                                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Chọn mức giá</h4>
                                            <div className="flex items-center justify-between gap-2 mb-5">
                                                <div className="relative flex-1">
                                                    <input type="text" value={formatNumber(minPriceInput)} onChange={(e) => handlePriceInputChange(e, setMinPriceInput)} placeholder="0" className="w-full border border-gray-300 rounded-lg py-2 pl-3 pr-6 text-sm outline-none focus:border-blue-500 text-right"/>
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">đ</span>
                                                </div>
                                                <span className="text-gray-400 font-bold">-</span>
                                                <div className="relative flex-1">
                                                    <input type="text" value={formatNumber(maxPriceInput)} onChange={(e) => handlePriceInputChange(e, setMaxPriceInput)} placeholder="100.000.000" className="w-full border border-gray-300 rounded-lg py-2 pl-3 pr-6 text-sm outline-none focus:border-blue-500 text-right"/>
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">đ</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleClearPriceFilter} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition text-sm">Bỏ chọn</button>
                                                <button onClick={handleApplyPriceFilter} className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition shadow-md text-sm">Xem kết quả</button>
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
                                <input type="checkbox" checked={filterInStock} onChange={(e) => setFilterInStock(e.target.checked)} className="hidden" />
                                <CheckCircle2 size={18} className={filterInStock ? "text-green-600" : "text-gray-400"} /> Chỉ hiển thị hàng có sẵn
                            </label>
                        </div>
                    </div>

                    {processedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {processedProducts.map((product) => (<ProductCard key={product.uniqueKey || product._id} product={product} />))}
                        </div>
                    ) : (
                        <div className="text-center bg-white rounded-2xl py-20 border border-dashed border-gray-300">
                            <Smartphone size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy sản phẩm phù hợp!</h3>
                            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc chọn cửa hàng khác.</p>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}