import { useState } from "react";
// Import Navbar chung hoặc Navbar riêng nếu bạn copy ra
import Navbar from "../components/admin/Navbar"; 
import SaleSidebar from "../components/saleStaff/SaleSidebar";

export default function SaleLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Truyền user prop giả lập hoặc từ context */}
      <Navbar user={{ name: "Sale Staff" }} onToggleSidebar={handleToggleSidebar} />
      
      <main className="flex flex-1 overflow-hidden">
        <div className={`${isSidebarOpen ? "block" : "hidden"} transition-all duration-300`}>
          <SaleSidebar />
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {children || <div className="p-4 text-gray-500">Nội dung đang cập nhật...</div>}
        </div>
      </main>
    </div>
  );
}