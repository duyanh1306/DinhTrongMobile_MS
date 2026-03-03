import React from "react";
import { Menu, User, LogOut, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ user = { name: "Admin" }, onToggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-gray-100 px-6 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-5">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-xl bg-gray-50/80 text-gray-600 hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-gray-100 hover:border-blue-200 transition-all duration-300 group"
          title="Thu gọn/Mở rộng menu"
        >
          <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        <div className="flex items-center gap-2 select-none">
          
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
            DinhTrong<span className="font-medium text-gray-700">Mobile</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 bg-gray-50/50 py-1.5 pl-1.5 pr-4 rounded-full border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:bg-white transition-all duration-300">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-blue-500 to-purple-500">
            <div className="bg-white p-1.5 rounded-full">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 leading-none">{user.name || "Quản trị viên"}</span>
            <span className="text-[10px] font-medium text-gray-400 mt-0.5">Online</span>
          </div>
        </div>
        <div className="w-[1px] h-8 bg-gray-200"></div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}