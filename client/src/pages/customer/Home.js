import React from "react";
import { Link } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout"; // Nếu bạn muốn dùng layout, hoặc dùng Navbar riêng

// Component này dùng Navbar riêng (như trang chủ Tiki/Shopee) nên mình sẽ return full page
// Tuy nhiên để thống nhất, ở đây mình giả định bạn đã import Navbar vào trong file này hoặc dùng Layout
// Dưới đây là nội dung chính của trang Home

const products = [
    { id: 1, name: "iPhone 15 Pro Max", price: "34.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png" },
    { id: 2, name: "Samsung S24 Ultra", price: "29.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/s/ss-s24-ultra-xam-222.png" },
    { id: 3, name: "Xiaomi 14", price: "22.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-14_1.png" },
    { id: 4, name: "MacBook Air M3", price: "27.990.000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook_air_m3_13_inch_silver_1_1.png" },
];

export default function Home() {
    // Lấy user từ localStorage để check login chưa
    const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navbar Customer (Nếu bạn chưa có Layout bao ngoài thì đặt Navbar vào đây) */}
      <nav className="bg-primary text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">DinhTrongMobile</h1>
            <div className="flex gap-4 items-center">
                {user ? (
                   <span className="font-medium">Xin chào, {user.fullName}</span>
                ) : (
                    <>
                        <Link to="/login" className="hover:text-gray-200">Đăng nhập</Link>
                        <Link to="/register" className="bg-white text-primary px-3 py-1 rounded font-bold">Đăng ký</Link>
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