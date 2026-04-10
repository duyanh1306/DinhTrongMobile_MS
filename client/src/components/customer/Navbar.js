import React from "react";
import { Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ user = { name: "Admin" }, onToggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedStoreId"); 
    navigate("/", { replace: true });
  };

  return (
    <header className="w-full bg-gray-300 px-4 py-2 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">DinhTrongMobile</h1>
      </div>


      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2">
          <User className="w-8 h-8 text-gray-700" /> 
          <span className="text-gray-700 font-medium">{user.name}</span>
        </div>


        <button
          onClick={handleLogout}
          className="text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
