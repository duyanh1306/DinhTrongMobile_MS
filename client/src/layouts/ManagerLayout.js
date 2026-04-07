import React, { useState } from "react";
import Navbar from "../components/admin/Navbar"; // Có thể dùng chung Navbar với Admin
import ManagerSidebar from "../components/manager/ManagerSidebar";

const ManagerLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Quản lý" };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <div className={`transition-all duration-300 ease-in-out z-20 ${isSidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        <ManagerSidebar />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Navbar user={{ name: "Quản Lý Cửa Hàng" }} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-6">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;