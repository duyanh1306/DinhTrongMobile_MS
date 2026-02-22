import { useNavigate, useLocation } from "react-router-dom";
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  LogOut,
  Wrench
} from "lucide-react";

export default function CustomerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      text: "Thông tin tài khoản",
      link: "/account/profile",
      icon: <User size={20} />,
    },
    {
      text: "Đơn hàng của tôi",
      link: "/account/orders",
      icon: <ShoppingBag size={20} />,
    },
    {
      text: "Lịch sử sửa chữa",
      link: "/account/repair-history",
      icon: <Wrench size={20} />, // Icon cờ lê cho sửa chữa
    },
    {
      text: "Sổ địa chỉ",
      link: "/account/addresses",
      icon: <MapPin size={20} />,
    },
    {
      text: "Sản phẩm yêu thích",
      link: "/account/wishlist",
      icon: <Heart size={20} />,
    },
  ];

  const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/login");
  };

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 text-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-bold text-lg text-red-600">DinhTrong Member</h2>
      </div>
      
      <nav className="flex flex-col p-4 gap-1 flex-1">
        {items.map((item, index) => {
           const isActive = location.pathname.startsWith(item.link);
           return (
            <div
                key={index}
                className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition ${
                isActive ? "bg-red-50 text-red-600 font-semibold" : "hover:bg-gray-50"
                }`}
                onClick={() => navigate(item.link)}
            >
                {item.icon}
                <span className="text-sm">{item.text}</span>
            </div>
           )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 w-full rounded-md transition"
        >
            <LogOut size={20} />
            <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}