import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useTechSidebarItems } from "../../constraints";

export default function TechSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const baseItems = useTechSidebarItems();
  
  const [queueCount, setQueueCount] = useState(0);
  const [warrantyCount, setWarrantyCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [tradeIn, waiting, repair, warranty] = await Promise.allSettled([
          axiosClient.get("/purchase-orders?orderType=PURCHASE&status=Pending_Tech"),
          axiosClient.get("/phones?status=waiting_for_tech_decision"),
          axiosClient.get("/repair-orders"),
          axiosClient.get("/warranty")
        ]);

        let tCount = 0, wCount = 0, rCount = 0, wPendingCount = 0;

        if (tradeIn.status === "fulfilled") {
           const d = tradeIn.value.data;
           tCount = (Array.isArray(d) ? d : d?.data || []).length;
        }
        if (waiting.status === "fulfilled") {
           const d = waiting.value.data;
           wCount = (Array.isArray(d) ? d : d?.data || []).length;
        }
        if (repair.status === "fulfilled") {
           const d = repair.value.data;
           const list = Array.isArray(d) ? d : d?.data || [];
           rCount = list.filter(o => o.status === "Pending" || o.status === "In Progress").length;
        }
        if (warranty.status === "fulfilled") {
           const d = warranty.value.data;
           const list = Array.isArray(d) ? d : d?.data || [];
           wPendingCount = list.filter(w => w.status === "Pending").length;
        }

        setQueueCount(tCount + wCount + rCount);
        setWarrantyCount(wPendingCount);
      } catch (error) {}
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const items = baseItems.map(item => {
    let badge = item.badge;
    const textLower = item.text.toLowerCase();
    const linkLower = item.link.toLowerCase();

    if (linkLower.includes("warranty") || textLower.includes("bảo hành")) {
      badge = warrantyCount > 0 ? warrantyCount : null;
    } else if (
      linkLower.includes("repair") || 
      linkLower.includes("queue") || 
      textLower.includes("chờ") || 
      textLower.includes("sửa")
    ) {
      badge = queueCount > 0 ? queueCount : null;
    }

    return { ...item, badge };
  });

  return (
    <div className="h-screen w-64 bg-blue-900 text-white flex flex-col shadow-lg">
      <div className="text-xl font-bold p-6 border-b border-blue-800 bg-blue-900">
        Kỹ thuật viên
      </div>
      <nav className="flex flex-col p-4 gap-2">
        {items.map((item, index) => {
          const isActive = location.pathname.startsWith(item.link);
          return (
            <div
              key={index}
              className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                 isActive ? "bg-blue-700 shadow-md" : "hover:bg-blue-800 text-blue-100"
              }`}
              onClick={() => navigate(item.link)}
            >
              <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium text-sm">{item.text}</span>
              </div>
            
              {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {item.badge}
                  </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}