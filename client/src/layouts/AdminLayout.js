import { useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import Navbar from "../components/admin/Navbar";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <main className="relative flex flex-1">
        <div className={`${isSidebarOpen ? "" : "hidden"}`}>
          <AdminSidebar />
        </div>
        {/* Page content goes here */}

        <div className="h-[90vh] w-full p-8 bg-gray-50 overflow-y-auto overflow-x-auto">
          {children ? (
            children
          ) : (
            <div className="p-4">No content available</div>
          )}
        </div>
      </main>
      
    </div>
  );
}
