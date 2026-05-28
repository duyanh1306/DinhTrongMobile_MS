import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, User, Package, Wrench, MapPin, Heart, LogOut, Search, Loader2, ShoppingCart, ChevronRight, PhoneCall } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function CustomerLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation(); 

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth" 
        });
    }, [location.pathname]);
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const fetchCartCount = async () => {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;
            
            if (!currentUserId) {
                setCartCount(0);
                return;
            }

            try {
                const res = await axiosClient.get(`/cart/${currentUserId}`);
                const cartData = res.data.data;
                if (cartData && cartData.items) {
                    const totalCount = cartData.items.reduce((total, item) => total + item.quantity, 0);
                    setCartCount(totalCount);
                } else {
                    setCartCount(0);
                }
            } catch (error) {
                console.error("Lỗi đếm số lượng giỏ hàng", error);
            }
        };
        
        fetchCartCount(); 
        
        window.addEventListener('cartUpdated', fetchCartCount);
        return () => window.removeEventListener('cartUpdated', fetchCartCount);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
      };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const [modelsRes, phonesRes] = await Promise.all([
                        axiosClient.get('/phone_models/all'),
                        axiosClient.get('/phones/all')
                    ]);

                    const allModels = modelsRes.data.data || [];
                    const allPhones = phonesRes.data.data || [];

                    const keyword = searchQuery.trim().toLowerCase();
                    
                    const filteredModels = allModels.filter(m => {
                        const matchName = m.name?.toLowerCase().includes(keyword);
                        const brandName = m.brand?.name || m.brand || "";
                        const matchBrand = brandName.toString().toLowerCase().includes(keyword);
                        return matchName || matchBrand;
                    }).slice(0, 5);

                    if (filteredModels.length > 0) {
                        const combinedResults = filteredModels.map(model => {
                            const availablePhones = allPhones.filter(p => 
                                (p.phoneModelId?._id === model._id || p.phoneModelId === model._id) && 
                                p.status === 'in_stock'
                            );

                            let lowestPrice = 0;
                            if (availablePhones.length > 0) {
                                lowestPrice = Math.min(...availablePhones.map(p => p.sellingPrice || (p.importPrice * 1.15)));
                            }

                            return { ...model, price: lowestPrice };
                        });
                        setSearchResults(combinedResults);
                    } else {
                        setSearchResults([]);
                    }
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSuggestions(false);
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <nav className="bg-[#007bff] text-white p-3 md:p-4 sticky top-0 z-50 shadow-md">
                <div className="container mx-auto max-w-7xl flex flex-wrap justify-between items-center gap-4">
                    
                    <Link to="/home" className="text-2xl font-bold tracking-wide flex-shrink-0">
                        DinhTrongMobile
                    </Link>
                    <Link 
                        to="/build-phone" 
                        className="hidden lg:flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl text-white font-semibold transition mx-4 border border-white/30 shadow-sm"
                    >
                        <Wrench size={18} />
                        <span>Xây dựng cấu hình</span>
                    </Link>
                    
                    <div className="flex-1 max-w-2xl hidden md:block mx-4 relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                                placeholder="Bạn cần tìm điện thoại gì?" 
                                className="w-full bg-white text-gray-800 px-4 py-2.5 rounded-xl outline-none focus:ring-4 focus:ring-blue-300/50 shadow-sm pr-12 transition-all"
                            />
                            <button 
                                type="submit" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#007bff] p-2 bg-white rounded-lg transition"
                            >
                                <Search size={20} />
                            </button>
                        </form>

                        {showSuggestions && searchQuery.trim() !== "" && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                {isSearching ? (
                                    <div className="p-4 flex justify-center items-center text-blue-500 font-medium">
                                        <Loader2 className="animate-spin mr-2" size={20} /> Đang tìm kiếm...
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="flex flex-col">
                                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Sản phẩm gợi ý
                                        </div>
                                        {searchResults.map(product => (
                                            <Link 
                                                key={product._id} 
                                                to={`/product/${product._id}`}
                                                onClick={() => setShowSuggestions(false)}
                                                className="flex items-center gap-4 p-3 hover:bg-gray-50 border-b border-gray-50 transition"
                                            >
                                                <img 
                                                    src={product.image || "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png"} 
                                                    alt={product.name} 
                                                    className="w-12 h-12 object-contain"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-800 line-clamp-1">{product.name}</span>
                                                    <span className="text-xs text-red-600 font-bold mt-0.5">
                                                        {product.price ? product.price.toLocaleString() + '₫' : 'Đang cập nhật'}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                        <div 
                                            onClick={handleSearchSubmit}
                                            className="p-3 text-center text-sm text-[#007bff] hover:bg-blue-50 cursor-pointer font-semibold transition"
                                        >
                                            Xem tất cả kết quả cho "{searchQuery}"
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        Không tìm thấy sản phẩm nào phù hợp với "{searchQuery}".
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex justify-end items-center gap-2 md:gap-4">
                        <Link to="/cart" className="relative flex items-center justify-center p-2 text-white hover:bg-blue-700 rounded-lg transition mr-2">
                            <ShoppingCart size={24} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                            <span className="hidden md:block ml-2 text-sm font-medium">Giỏ hàng</span>
                        </Link>
                        {user ? (
                        <div className="relative">
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                className="flex items-center gap-1.5 font-medium hover:text-gray-200 transition focus:outline-none text-sm md:text-base bg-blue-600/30 px-3 py-1.5 rounded-lg border border-blue-500/50"
                            >
                                Hi, {user.fullName || "Khách hàng"} 
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden text-gray-700">
                                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                        <h2 className="font-bold text-lg text-red-600">DinhTrong Member</h2>
                                    </div>

                                    <div className="flex flex-col py-2">
                                        <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-red-600 transition">
                                            <User size={18} /> <span className="text-sm font-medium">Thông tin tài khoản</span>
                                        </Link>
                                        <Link to="/order-history" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50 hover:text-red-600 transition">
                                            <Package size={18} /> <span className="text-sm font-medium">Đơn hàng của tôi</span>
                                        </Link>
                                    </div>
                                    
                                    <div className="border-t border-gray-100 p-2">
                                        <button 
                                            onClick={handleLogout} 
                                            className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-500 transition font-medium rounded-md"
                                        >
                                            <LogOut size={18} /> <span className="text-sm">Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-gray-200 font-medium text-sm">Đăng nhập</Link>
                                <Link to="/register" className="bg-white text-[#007bff] px-4 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition shadow-sm text-sm">Đăng ký</Link>
                            </>
                        )}
                    </div>

                    <div className="w-full md:hidden mt-2">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Bạn cần tìm điện thoại gì?" 
                                className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                                <Search size={18} />
                            </button>
                        </form>
                    </div>

                </div>
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto py-6 md:py-8 px-4">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto pt-12 pb-6 font-sans">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                        <div className="space-y-4">
                            <Link to="/home" className="text-2xl font-black text-[#007bff] tracking-tight inline-block">
                                DinhTrongMobile
                            </Link>
                            <p className="text-sm text-gray-500 leading-relaxed text-justify">
                                Hệ thống bán lẻ điện thoại di động, máy tính bảng và linh kiện chính hãng. Tiên phong mang đến trải nghiệm công nghệ đỉnh cao và dịch vụ tận tâm.
                            </p>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                    <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>Hà Nội, Việt Nam</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <PhoneCall size={18} className="text-gray-400 flex-shrink-0" />
                                    <span>0373.972.327</span>
                                </div>
                            </div>
                        </div>

               
                        <div>
                            <h3 className="font-extrabold text-gray-900 mb-6 uppercase text-sm tracking-widest relative inline-block">
                                Chính sách hỗ trợ
                                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-blue-500 rounded-full"></span>
                            </h3>
                            <ul className="space-y-3 text-sm text-gray-600 font-medium">
                                <li><Link to="/chinh-sach-bao-hanh" className="hover:text-[#007bff] transition-colors flex items-center gap-2 group"><ChevronRight size={14} className="text-gray-300 group-hover:text-[#007bff] transition-colors" /> Chính sách bảo hành</Link></li>
                                <li><Link to="/chinh-sach-doi-tra" className="hover:text-[#007bff] transition-colors flex items-center gap-2 group"><ChevronRight size={14} className="text-gray-300 group-hover:text-[#007bff] transition-colors" /> Chính sách đổi trả</Link></li>
                                <li><Link to="/giao-hang" className="hover:text-[#007bff] transition-colors flex items-center gap-2 group"><ChevronRight size={14} className="text-gray-300 group-hover:text-[#007bff] transition-colors" /> Giao hàng & Thanh toán</Link></li>
                                <li><Link to="/huong-dan-tra-gop" className="hover:text-[#007bff] transition-colors flex items-center gap-2 group"><ChevronRight size={14} className="text-gray-300 group-hover:text-[#007bff] transition-colors" /> Hướng dẫn mua trả góp</Link></li>
                            </ul>
                        </div>

   
                        <div>
                            <h3 className="font-extrabold text-gray-900 mb-6 uppercase text-sm tracking-widest relative inline-block">
                                Dịch vụ nổi bật
                                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-blue-500 rounded-full"></span>
                            </h3>
                            <ul className="space-y-3 text-sm text-gray-600 font-medium">
                                <li><Link to="/build-phone" className="hover:text-[#007bff] transition-colors flex items-center gap-2 group"><ChevronRight size={14} className="text-gray-300 group-hover:text-[#007bff] transition-colors" /> Tự ráp cấu hình máy</Link></li>
                            
                            </ul>
                        </div>

 
                        <div>
                            <h3 className="font-extrabold text-gray-900 mb-6 uppercase text-sm tracking-widest relative inline-block">
                                Tổng đài liên hệ
                                <span className="absolute -bottom-2 left-0 w-8 h-1 bg-blue-500 rounded-full"></span>
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl border border-blue-100 shadow-sm group hover:shadow-md transition-all">
                                    <p className="font-semibold text-gray-600 text-xs mb-1 uppercase tracking-wider">Gọi mua hàng</p>
                                    <p className="text-2xl font-black text-[#007bff] group-hover:scale-105 origin-left transition-transform">0373.972.327</p>
                                </div>
                                <div className="bg-gradient-to-r from-red-50 to-white p-4 rounded-xl border border-red-100 shadow-sm group hover:shadow-md transition-all">
                                    <p className="font-semibold text-gray-600 text-xs mb-1 uppercase tracking-wider">Bảo hành & Khiếu nại</p>
                                    <p className="text-xl font-bold text-red-600 group-hover:scale-105 origin-left transition-transform">0767.017.387</p>
                                </div>
                            </div>
                        </div>
                    </div>

      
                    <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500 font-medium">
                            © {new Date().getFullYear()} DinhTrongMobile. All rights reserved.
                        </p>
                        <div className="flex gap-3 items-center">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded font-bold text-xs border border-blue-100 shadow-sm">100% Chính hãng</span>
                            <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded font-bold text-xs border border-gray-200 shadow-sm">Đổi trả 30 ngày</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}