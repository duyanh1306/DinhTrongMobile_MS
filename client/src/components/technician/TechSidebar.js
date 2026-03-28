import { useNavigate, useLocation } from "react-router-dom";
import { items } from "../../constraints";

export default function TechSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
                 isActive ? "bg-slate-900 text-blue-400" : "hover:bg-slate-700"
              }`}
              onClick={() => navigate(item.link)}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.text}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
