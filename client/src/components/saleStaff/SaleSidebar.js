import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  LogOut,
  User,
  Globe,
  Truck
} from "lucide-react";

export default function SaleSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { text: "Dashboard", link: "/sale/dashboard", icon: <LayoutDashboard size={20} /> },
    { text: "POS", link: "/sale/pos", icon: <ShoppingCart size={20} /> },
    { text: "Hoá Đơn", link: "/sale/orders", icon: <FileText size={20} /> },
    { text: "Tạo đơn sửa chữa", link: "/sale/repair-orders", icon: <FileText size={20} /> },
    { text: "Đơn Online (Web)", link: "/sale/web-orders", icon: <Globe size={20} /> },
    { text: "Xuất Luân Chuyển", link: "/sale/transfer-export", icon: <Truck size={20} /> },
    // { text: "Products & Inventory", link: "/sale/products", icon: <Package size={20} /> },
    // { text: "Customers", link: "/sale/customers", icon: <Users size={20} /> },
    // { text: "Profile", link: "/profile", icon: <User size={20} /> },
  ];

  return (
    <div className="h-screen w-64 bg-orange-600 text-white flex flex-col shadow-lg transition-all duration-300">
      <div className="text-2xl font-bold p-6 border-b border-orange-500 flex items-center gap-2">
        <span>Sales Portal</span>
      </div>
      <nav className="flex flex-col p-4 gap-2 flex-1">
        {items.map((item, index) => {
          const isActive = location.pathname.startsWith(item.link);
          return (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? "bg-orange-800" : "hover:bg-orange-500"
              }`}
              onClick={() => navigate(item.link)}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.text}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}