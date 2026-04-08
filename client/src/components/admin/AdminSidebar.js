import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Cpu, Hammer, LayoutDashboard, Smartphone, UserCircle, Users,
  Store, Package, FileText, ArrowRightLeft, Truck,
  ChevronDown, ChevronRight, Settings, History, ClipboardList,Layers
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState({
    quanLy: false,
    lichSu: false,
    yeuCau: false,
  });

  const toggleMenu = (menuKey) => {
    setOpenMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const isActive = (path) => location.pathname === path;

  const menuGroups = [
    {
      title: "Chung",
      items: [
        { text: "Tổng quan", link: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
        { text: "Thông tin cá nhân", link: "/profile", icon: <UserCircle size={20} /> },
      ],
    },
    {
      title: "Hệ thống quản lý",
      id: "quanLy",
      icon: <Settings size={20} />,
      items: [
        { text: "Người dùng", link: "/admin/users", icon: <Users size={18} /> },
        { text: "Chuỗi cửa hàng", link: "/admin/stores", icon: <Store size={18} /> },
        { text: "Hãng sản xuất", link: "/admin/phone_brands", icon: <Smartphone size={18} /> },
        { text: "Kho Máy",link: "/admin/phones",icon: <Package size={18}/>},
        { text: "Mẫu điện thoại", link: "/admin/phone_model", icon: <Smartphone size={18} /> },
        { text: "Loại linh kiện", link: "/admin/item_type", icon: <Cpu size={18} /> },
        { text: "Kho linh kiện", link: "/admin/items", icon: <Package size={18} /> },
        { text: "Cấu hình máy dựng", link: "/admin/recipes", icon: <Layers size={18} /> },
        { text: "Dịch vụ sửa chữa", link: "/admin/repair_service", icon: <Hammer size={18} /> },
      ],
    },
    {
      title: "Tra cứu lịch sử",
      id: "lichSu",
      icon: <History size={20} />,
      items: [
        { text: "Lịch sử mua hàng", link: "/admin/purchase_history", icon: <FileText size={18} /> },
        { text: "Lịch sử bán hàng", link: "/admin/sales_history", icon: <FileText size={18} /> },
        { text: "Lịch sử sửa chữa", link: "/admin/repair_history", icon: <Hammer size={18} /> },
        { text: "Giao dịch kho", link: "/admin/inventory_transactions", icon: <ArrowRightLeft size={18} /> },
      ],
    },
    {
      title: "Yêu cầu & Phê duyệt",
      id: "yeuCau",
      icon: <ClipboardList size={20} />,
      items: [
        { text: "Yêu cầu chuyển kho", link: "/admin/transfer_requests", icon: <Truck size={18} /> },
      ],
    },
  ];

  return (
    <div className="h-full w-64 bg-blue-900 text-white flex flex-col shadow-lg overflow-y-auto overflow-x-hidden pb-6 custom-scrollbar">
      <div className="text-2xl font-bold p-5 border-b border-blue-800 bg-blue-900 z-10 flex-shrink-0">
        Admin Panel
      </div>
      
      <nav className="flex flex-col p-4 gap-2 flex-1">
        {menuGroups.map((group, index) => (
          <div key={index} className="mb-2">
            {!group.id ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 ml-2 mt-2">
                  {group.title}
                </div>
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive(item.link) ? "bg-blue-700 shadow-md" : "hover:bg-blue-800 text-blue-100"
                    }`}
                    onClick={() => navigate(item.link)}
                  >
                    {item.icon}
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 ml-2 mt-4">
                  {group.title}
                </div>
                <div
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-800 text-blue-100 transition-colors duration-200"
                  onClick={() => toggleMenu(group.id)}
                >
                  <div className="flex items-center gap-3">
                    {group.icon}
                    <span className="text-sm font-medium">{group.title}</span>
                  </div>
                  <div className={`transition-transform duration-300 ${openMenus[group.id] ? "rotate-180" : ""}`}>
                    <ChevronDown size={16} />
                  </div>
                </div>


                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    openMenus[group.id] ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden space-y-1 pl-4 border-l border-blue-800 ml-4">
                    {group.items.map((subItem, subIdx) => (
                      <div
                        key={subIdx}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isActive(subItem.link) ? "bg-blue-700 shadow-md" : "hover:bg-blue-800 text-blue-200"
                        }`}
                        onClick={() => navigate(subItem.link)}
                      >
                        {subItem.icon}
                        <span className="text-sm">{subItem.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: transparent; }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}