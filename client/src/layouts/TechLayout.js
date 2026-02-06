import { useState } from "react";
import Navbar from "../components/admin/Navbar";
import TechSidebar from "../components/technician/TechSidebar";

export default function TechLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      <Navbar user={{ name: "Technician" }} onToggleSidebar={handleToggleSidebar} />
      
      <main className="flex flex-1 overflow-hidden">
        <div className={`${isSidebarOpen ? "block" : "hidden"}`}>
          <TechSidebar />
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {children || <div className="text-gray-500">Chưa có nội dung hiển thị</div>}
        </div>
      </main>
    </div>
  );
}