import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, User, Package, Wrench, MapPin, Heart, LogOut, LayoutDashboard } from "lucide-react";

const products = [
    { id: 1, name: "iPhone 15 Pro Max", price: "34,990,000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png" },
    { id: 2, name: "Samsung Galaxy S24 Ultra", price: "29,990,000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/s/ss-s24-ultra-xam-222.png" },
    { id: 3, name: "Xiaomi 14", price: "22,990,000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-14_1.png" },
    { id: 4, name: "MacBook Air M3", price: "27,990,000₫", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook_air_m3_13_inch_silver_1_1.png" },
];

export default function Home() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsMenuOpen(false);
        navigate('/login');
    };

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
                   // --- USER MENU DROPDOWN ---
                   <div className="relative">
                       <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 font-medium hover:text-gray-200 transition focus:outline-none"
                       >
                           Hi, {user.fullName} 
                           <ChevronDown size={18} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
                       </button>

                       {isMenuOpen && (
                           <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-xl py-2 text-gray-700 border border-gray-100 z-50">
                               <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                    <p className="text-sm text-gray-500">Welcome back,</p>
                                    <p className="font-bold text-gray-800 truncate">{user.fullName}</p>
                               </div>

                               {dashboardLink && (
                                   <Link to={dashboardLink} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition">
                                       <LayoutDashboard size={18} /> System Dashboard
                                   </Link>
                               )}

                               <Link to="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition">
                                   <User size={18} /> Account Profile
                               </Link>
                               <Link to="/my-orders" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition">
                                   <Package size={18} /> My Orders
                               </Link>
                               <Link to="/repair-history" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition">
                                   <Wrench size={18} /> Repair History
                               </Link>
                               <Link to="/addresses" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition">
                                   <MapPin size={18} /> Address Book
                               </Link>
                               <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition">
                                   <Heart size={18} /> Favorites
                               </Link>
                               
                               <div className="border-t border-gray-100 my-1"></div>
                               
                               <button 
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition font-medium"
                               >
                                   <LogOut size={18} /> Logout
                               </button>
                           </div>
                       )}
                   </div>
                ) : (
                    <>
                        <Link to="/login" className="hover:text-gray-200 font-medium">Login</Link>
                        <Link to="/register" className="bg-white text-primary px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-sm">Register</Link>
                    </>
                )}
            </div>
        </div>
      </nav>

      {/* Banner Section */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto py-20 px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Upgrade your experience <br/>with iPhone 15 Series</h2>
                <p className="text-gray-300 text-lg">Durable Titanium design. The most powerful A17 Pro chip. Capture every moment.</p>
                <button className="bg-orange-500 px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-500/30">
                    Shop Now
                </button>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
                <img src="https://shopdunk.com/images/uploaded/banner/banner%202024/thang%203/ip15%20prm%20pc.png" alt="Banner" className="max-w-full h-auto drop-shadow-2xl" />
            </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto py-16 px-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 border-l-4 border-primary pl-3">Featured Products</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-xl transition group cursor-pointer">
                    <div className="overflow-hidden rounded-lg mb-4">
                        <img src={product.img} alt={product.name} className="w-full h-48 object-contain group-hover:scale-110 transition duration-300" />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">{product.name}</h4>
                    <p className="text-primary font-bold text-lg">{product.price}</p>
                    <button className="w-full mt-4 border border-primary text-primary py-2 rounded-lg font-medium hover:bg-primary hover:text-white transition">
                        View Details
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}