import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Smartphone, Cpu, HardDrive, Filter, ArrowUp, ArrowDown, CheckCircle2 } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import CustomerLayout from "../../layouts/CustomerLayout";

export default function CategoryPage() {
    const { type } = useParams(); // 'new', 'used', hoặc undefined
    const navigate = useNavigate();

    const [allProducts, setAllProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // States cho Lọc và Sắp xếp
    const [filterBrand, setFilterBrand] = useState("");
    const [filterPrice, setFilterPrice] = useState("");
    const [filterInStock, setFilterInStock] = useState(false);
    const [sortBy, setSortBy] = useState("default"); // 'default', 'price_asc', 'price_desc'

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [modelsRes, phonesRes, brandsRes] = await Promise.all([
                    axiosClient.get('/phone_models/all'),
                    axiosClient.get('/phones/all'),
                    axiosClient.get('/phone_brands/all') // Lấy danh sách Hãng để tạo bộ lọc
                ]);

                const phoneModels = modelsRes.data.data || [];
                const phones = phonesRes.data.data || [];
                setBrands(brandsRes.data.data || []);

                // Gộp dữ liệu Model và Phone vật lý (y hệt logic trang Home)
                let combinedData = phoneModels.map(model => {
                    const availablePhones = phones.filter(p => 
                        (p.phoneModelId?._id === model._id || p.phoneModelId === model._id) && 
                        p.status === 'in_stock'
                    );

                    let startingPrice = 0;
                    if (availablePhones.length > 0) {
                        const prices = availablePhones.map(p => 
                            p.sellingPrice ? p.sellingPrice : (p.importPrice * 1.15)
                        );
                        startingPrice = Math.min(...prices);
                    }

                    return {
                        ...model,
                        price: startingPrice,
                        stockCount: availablePhones.length,
                        brandId: model.brand?._id || model.brand // Bắt ID Hãng để lọc
                    };
                });

                // Lọc Mới / Cũ theo URL Params
                if (type === 'new') {
                    combinedData = combinedData.filter(p => p.condition === 1 || p.condition === undefined);
                } else if (type === 'used') {
                    combinedData = combinedData.filter(p => p.condition < 1);
                }

                setAllProducts(combinedData);
            } catch (error) {
                console.error("Lỗi lấy danh sách sản phẩm:", error);
                toast.error("Không thể tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [type]);

    // Xử lý Lọc và Sắp xếp (Dùng useMemo để tối ưu hiệu năng)
    const processedProducts = useMemo(() => {
        let result = [...allProducts];

        // 1. Lọc theo Hãng
        if (filterBrand) {
            result = result.filter(p => p.brandId === filterBrand);
        }

        // 2. Lọc theo Kho (Chỉ hàng có sẵn)
        if (filterInStock) {
            result = result.filter(p => p.stockCount > 0);
        }

        // 3. Lọc theo Mức Giá
        if (filterPrice) {
            switch (filterPrice) {
                case "under5": result = result.filter(p => p.price > 0 && p.price < 5000000); break;
                case "5to10": result = result.filter(p => p.price >= 5000000 && p.price <= 10000000); break;
                case "10to20": result = result.filter(p => p.price > 10000000 && p.price <= 20000000); break;
                case "over20": result = result.filter(p => p.price > 20000000); break;
                default: break;
            }
        }

        // 4. Sắp xếp
        if (sortBy === "price_asc") {
            result.sort((a, b) => {
                if (a.price === 0) return 1; // Đẩy máy hết hàng (giá 0) xuống cuối
                if (b.price === 0) return -1;
                return a.price - b.price;
            });
        } else if (sortBy === "price_desc") {
            result.sort((a, b) => b.price - a.price);
        }

        return result;
    }, [allProducts, filterBrand, filterInStock, filterPrice, sortBy]);


    // Component Card Sản phẩm
    const ProductCard = ({ product }) => {
        const defaultImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png";
        const displayPrice = product.price > 0 
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) 
            : "Liên hệ";
        const specs = product.specifications || {};
        const isUsed = product.condition < 1;

        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100 relative flex flex-col h-full">
                {isUsed && (
                    <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">Cũ {Math.round(product.condition * 100)}%</span>
                )}
                {product.stockCount === 0 && (
                    <span className="absolute top-3 right-3 bg-gray-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-md z-10">Tạm hết hàng</span>
                )}

                <div className={`overflow-hidden rounded-lg mb-4 flex justify-center items-center h-48 p-2 ${product.stockCount === 0 ? 'opacity-50 grayscale-[50%]' : ''}`}>
                    <img src={product.image || defaultImage} alt={product.name} className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" />
                </div>

                <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h4>
                    <p className="text-red-600 font-bold text-lg mb-3">{displayPrice}</p>

                    <div className="flex flex-wrap gap-2 mt-auto mb-4">
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><Smartphone size={12} className="text-gray-400" /> {specs.screenSize || "N/A"}</div>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><HardDrive size={12} className="text-gray-400" /> {specs.internalStorage || "N/A"}</div>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md w-full truncate"><Cpu size={12} className="text-gray-400" /> <span className="truncate">{specs.chipset || "N/A"}</span></div>
                    </div>

                    <Link to={`/product/${product._id}`} className={`mt-auto w-full text-center py-2.5 rounded-lg font-semibold transition-colors ${product.stockCount > 0 ? "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"}`}>
                        {product.stockCount > 0 ? "Xem chi tiết" : "Hết hàng"}
                    </Link>
                </div>
            </div>
        );
    };

    if (loading) return <CustomerLayout><div className="min-h-[60vh] flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div><p className="text-gray-500 font-medium mt-4">Đang tải dữ liệu sản phẩm...</p></div></CustomerLayout>;

    // Định dạng Title theo Type
    const pageTitle = type === 'new' ? "Điện Thoại Mới Chính Hãng" : type === 'used' ? "Điện Thoại Cũ Giá Rẻ" : "Tất Cả Điện Thoại";

    return (
        <CustomerLayout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* BREADCRUMB */}
                <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                    <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/home')}>Trang chủ</span>
                    <span>/</span>
                    <span className="font-semibold text-gray-800">{pageTitle}</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase">{pageTitle}</h1>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">{processedProducts.length} sản phẩm</span>
                </div>

                {/* KHU VỰC BỘ LỌC VÀ SẮP XẾP */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-5">
                    
                    {/* Hàng 1: Các bộ lọc */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 font-semibold text-gray-700 mr-2">
                            <Filter size={18} /> Lọc theo:
                        </div>

                        {/* Lọc Hãng */}
                        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="border border-gray-300 text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white cursor-pointer transition">
                            <option value="">Tất cả các Hãng</option>
                            {brands.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>

                        {/* Lọc Giá */}
                        <select value={filterPrice} onChange={(e) => setFilterPrice(e.target.value)} className="border border-gray-300 text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white cursor-pointer transition">
                            <option value="">Tất cả Mức giá</option>
                            <option value="under5">Dưới 5 triệu</option>
                            <option value="5to10">Từ 5 - 10 triệu</option>
                            <option value="10to20">Từ 10 - 20 triệu</option>
                            <option value="over20">Trên 20 triệu</option>
                        </select>

                        {/* Toggle Chỉ hiện hàng có sẵn */}
                        <label className="flex items-center gap-2 cursor-pointer ml-auto bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition text-sm font-medium">
                            <input type="checkbox" checked={filterInStock} onChange={(e) => setFilterInStock(e.target.checked)} className="hidden" />
                            <CheckCircle2 size={18} className={filterInStock ? "text-green-600" : "text-gray-400"} />
                            Chỉ hiển thị hàng có sẵn
                        </label>
                    </div>

                    {/* Hàng 2: Sắp xếp (Chuẩn style ảnh mẫu nhưng tông xanh) */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                        <span className="font-semibold text-gray-700 mr-2 text-sm">Sắp xếp theo:</span>
                        
                        <button onClick={() => setSortBy('default')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${sortBy === 'default' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            🌟 Phổ biến
                        </button>
                        
                        <button onClick={() => setSortBy('price_asc')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${sortBy === 'price_asc' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            <ArrowUp size={16} /> Giá Thấp - Cao
                        </button>

                        <button onClick={() => setSortBy('price_desc')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${sortBy === 'price_desc' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            <ArrowDown size={16} /> Giá Cao - Thấp
                        </button>
                    </div>
                </div>

                {/* DANH SÁCH SẢN PHẨM */}
                {processedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {processedProducts.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white rounded-2xl py-20 border border-dashed border-gray-300">
                        <Smartphone size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy sản phẩm nào!</h3>
                        <p className="text-gray-500 text-sm">Vui lòng thử điều chỉnh lại bộ lọc hoặc quay lại sau.</p>
                        <button onClick={() => { setFilterBrand(""); setFilterPrice(""); setFilterInStock(false); setSortBy("default"); }} className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition">
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}