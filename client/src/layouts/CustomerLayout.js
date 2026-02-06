import { useState } from "react";
// Có thể bạn sẽ muốn một Navbar khác cho khách (có giỏ hàng, search bar...)
// Ở đây tôi dùng tạm Navbar admin nhưng bạn nên tạo CustomerNavbar riêng.
import Navbar from "../components/admin/Navbar"; 
import CustomerSidebar from "../components/customer/CustomerSidebar";

export default function CustomerLayout({ children }) {
  // Với khách hàng, trên mobile thì ẩn sidebar, desktop thì hiện
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar cho khách */}
      <Navbar 
        user={{ name: "Khách hàng" }} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      <div className="flex flex-1 container mx-auto max-w-7xl pt-6 px-4 gap-6">
        {/* Sidebar Sidebar */}
        <aside 
            className={`${
                isSidebarOpen ? "block" : "hidden"
            } md:block w-64 flex-shrink-0 bg-white rounded-xl shadow-sm h-fit min-h-[500px] overflow-hidden`}
        >
          <CustomerSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white rounded-xl shadow-sm p-6 h-fit min-h-[500px]">
          {children ? children : <p>Chọn một mục để xem chi tiết.</p>}
        </main>
      </div>
      
      {/* Footer nếu cần */}
      <footer className="py-6 text-center text-gray-400 text-sm mt-8">
        © 2026 DinhTrongMobile. All rights reserved.
      </footer>
    </div>
  );
}