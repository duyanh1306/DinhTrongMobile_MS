import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, UserCircle, Users, Package, FileText, 
  ChevronDown, Settings, History, ClipboardList, PackagePlus
} from "lucide-react";

export default function ManagerSidebar() {
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

  // 🌟 ĐÃ THÊM MỤC "NHẬP KHO THEO LÔ" VÀO HỆ THỐNG QUẢN LÝ
  const menuGroups = [
    {
      title: "Chung",
      items: [
        { text: "Tổng quan", link: "/manager/dashboard", icon: <LayoutDashboard size={20} /> },
        { text: "Thông tin cá nhân", link: "/profile", icon: <UserCircle size={20} /> },
      ],
    },
    {
      title: "Hệ thống quản lý",
      id: "quanLy",
      icon: <Settings size={20} />,
      items: [
        { text: "Nhân sự", link: "/manager/staffs", icon: <Users size={18} /> },
        { text: "Kho hàng", link: "/manager/inventory", icon: <Package size={18} /> },
        { text: "Nhập kho theo lô", link: "/manager/import_inventory", icon: <PackagePlus size={18} /> },
      ],
    },
    {
      title: "Báo cáo & Lịch sử",
      id: "lichSu",
      icon: <History size={20} />,
      items: [
        { text: "Lịch sử bán hàng", link: "/manager/sales_history", icon: <FileText size={18} /> },
      ],
    },
    {
      title: "Yêu cầu & Phê duyệt",
      id: "yeuCau",
      icon: <ClipboardList size={20} />,
      items: [
        { text: "Duyệt yêu cầu kho", link: "/manager/transfer_approvals", icon: <FileText size={18} /> },
        {
          text: "Làm đơn vận chuyển",
          link: "/manager/transfer_requests",
          icon: <FileText size={18} />
        }
      ],
    },
  ];

  return (
    <div className="h-full w-64 bg-indigo-900 text-white flex flex-col shadow-lg overflow-y-auto overflow-x-hidden pb-6 custom-scrollbar">
      <div className="text-2xl font-bold p-5 border-b border-indigo-800 bg-indigo-900 z-10 flex-shrink-0">
        Manager Panel
      </div>
      
      <nav className="flex flex-col p-4 gap-2 flex-1">
        {menuGroups.map((group, index) => (
          <div key={index} className="mb-2">
            {!group.id ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 ml-2 mt-2">
                  {group.title}
                </div>
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive(item.link) ? "bg-indigo-700 shadow-md" : "hover:bg-indigo-800 text-indigo-100"
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
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 ml-2 mt-4">
                  {group.title}
                </div>
                <div
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-indigo-800 text-indigo-100 transition-colors duration-200"
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
                  <div className="overflow-hidden space-y-1 pl-4 border-l border-indigo-800 ml-4">
                    {group.items.map((subItem, subIdx) => (
                      <div
                        key={subIdx}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isActive(subItem.link) ? "bg-indigo-700 shadow-md" : "hover:bg-indigo-800 text-indigo-200"
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

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: transparent; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}