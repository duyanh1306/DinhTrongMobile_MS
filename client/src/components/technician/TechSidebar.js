import { useNavigate, useLocation } from "react-router-dom";
import { useTechSidebarItems } from "../../constraints";

export default function TechSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  

  const items = useTechSidebarItems(); 

  return (
    <div className="h-screen w-64 bg-slate-800 text-white flex flex-col shadow-lg">
      <div className="text-xl font-bold p-6 border-b border-slate-700">
        Kỹ thuật viên
      </div>
      <nav className="flex flex-col p-4 gap-2">
        {items.map((item, index) => {
          const isActive = location.pathname.startsWith(item.link);
          return (
            <div
              key={index}
              className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition ${
                 isActive ? "bg-slate-900 text-blue-400" : "hover:bg-slate-700"
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