import React, { useState } from "react";
import CustomerLayout from "../../layouts/CustomerLayout"; 
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, User, Key, LogOut, LayoutDashboard } from "lucide-react";

const products = [
    { id: 1, name: "iPhone 15 Pro Max", price: "34.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png" },
    { id: 2, name: "Samsung S24 Ultra", price: "29.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/s/ss-s24-ultra-xam-222.png" },
    { id: 3, name: "Xiaomi 14", price: "22.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-14_1.png" },
    { id: 4, name: "MacBook Air M3", price: "27.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook_air_m3_13_inch_silver_1_1.png" },
];

export default function Home() {
    const navigate = useNavigate();
    
    // Lấy user từ localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    
    // State để đóng/mở menu dropdown
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Hàm xử lý đăng xuất
    const handleLogout = () => {
        // 1. Xóa dữ liệu trong localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 2. Đóng menu
        setIsMenuOpen(false);
        
        // 3. Chuyển hướng về trang đăng nhập (hoặc trang chủ tùy bạn)
        navigate('/login');
    };

    // Hàm kiểm tra role để hiển thị link về Dashboard (nếu là nhân viên/admin)
    const renderDashboardLink = () => {
        if (!user || !user.roleId) return null;
        const role = user.roleId.id || user.roleId;
        
        if (role === 'ADMIN') return "/admin/dashboard";
        if (role === 'SALE_STAFF') return "/sale/dashboard";
        if (role === 'TECHNICIAN') return "/tech/dashboard";
        return null;
    };

    const dashboardLink = renderDashboardLink();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navbar */}
      <nav className="bg-primary text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold">DinhTrongMobile</Link>
            
            <div className="flex gap-4 items-center">
                {user ? (
                   // --- PHẦN MENU DROPDOWN CỦA USER ---
                   <div className="relative">
                       {/* Nút bấm hiển thị tên và icon mũi tên */}
                       <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 font-medium hover:text-gray-200 transition focus:outline-none"
                       >
                           Xin chào, {user.fullName} 
                           <ChevronDown size={18} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
                       </button>

                       {/* Khung menu xổ xuống */}
                       {isMenuOpen && (
                           <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl py-2 text-gray-700 border border-gray-100 animate-fade-in-down">
                               
                               {/* Link về trang Dashboard nếu không phải là Customer */}
                               {dashboardLink && (
                                   <Link 
                                        to={dashboardLink} 
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition"
                                   >
                                       <LayoutDashboard size={18} /> Quản trị hệ thống
                                   </Link>
                               )}

                               <Link 
                                    to="/account/profile" 
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition"
                                >
                                   <User size={18} /> Thông tin tài khoản
                               </Link>
                               
                               <Link 
                                    to="/account/change-password" 
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition"
                                >
                                   <Key size={18} /> Đổi mật khẩu
                               </Link>
                               
                               <div className="border-t border-gray-100 my-1"></div>
                               
                               {/* Nút Đăng xuất */}
                               <button 
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition font-medium"
                               >
                                   <LogOut size={18} /> Đăng xuất
                               </button>
                           </div>
                       )}
                   </div>
                   // --- KẾT THÚC PHẦN MENU DROPDOWN ---
                ) : (
                    <>
                        <Link to="/login" className="hover:text-gray-200 font-medium">Đăng nhập</Link>
                        <Link to="/register" className="bg-white text-primary px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-sm">Đăng ký</Link>
                    </>
                )}
            </div>
        </div>
      </nav>
      {/* Banner Section */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto py-20 px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Nâng cấp trải nghiệm <br/>với iPhone 15 Series</h2>
                <p className="text-gray-300 text-lg">Thiết kế Titanium bền bỉ. Chip A17 Pro mạnh mẽ nhất. Camera bắt trọn từng khoảnh khắc.</p>
                <button className="bg-secondary px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-500/30">
                    Mua ngay
                </button>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
                 {/* Ảnh banner minh họa */}
                <img src="https://shopdunk.com/images/uploaded/banner/banner%202024/thang%203/ip15%20prm%20pc.png" alt="Banner" className="max-w-full h-auto drop-shadow-2xl" />
            </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto py-16 px-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 border-l-4 border-primary pl-3">Sản phẩm nổi bật</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-xl transition group cursor-pointer">
                    <div className="overflow-hidden rounded-lg mb-4">
                        <img src={product.img} alt={product.name} className="w-full h-48 object-contain group-hover:scale-110 transition duration-300" />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">{product.name}</h4>
                    <p className="text-primary font-bold text-lg">{product.price}</p>
                    <button className="w-full mt-4 border border-primary text-primary py-2 rounded-lg font-medium hover:bg-primary hover:text-white transition">
                        Xem chi tiết
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-10">Dịch vụ sửa chữa uy tín</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 border rounded-xl hover:border-primary transition">
                    <img src="https://dienthoaivui.com.vn/modules/paradox/images/feature-1.png" className="mx-auto w-16 mb-4" alt=""/>
                    <h4 className="font-bold text-lg">Sửa chữa lấy ngay</h4>
                    <p className="text-gray-500 mt-2">Thay pin, màn hình chỉ từ 30 phút. Xem trực tiếp quy trình.</p>
                </div>
                 <div className="p-6 border rounded-xl hover:border-primary transition">
                    <img src="https://dienthoaivui.com.vn/modules/paradox/images/feature-2.png" className="mx-auto w-16 mb-4" alt=""/>
                    <h4 className="font-bold text-lg">Bảo hành dài hạn</h4>
                    <p className="text-gray-500 mt-2">Bảo hành linh kiện tới 12 tháng. Hoàn tiền 100% nếu không hài lòng.</p>
                </div>
                 <div className="p-6 border rounded-xl hover:border-primary transition">
                    <img src="https://dienthoaivui.com.vn/modules/paradox/images/feature-3.png" className="mx-auto w-16 mb-4" alt=""/>
                    <h4 className="font-bold text-lg">Giao nhận tận nhà</h4>
                    <p className="text-gray-500 mt-2">Hỗ trợ giao nhận máy sửa chữa tận nơi cho khách hàng bận rộn.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}