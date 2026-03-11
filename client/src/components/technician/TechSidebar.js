import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  Cpu, 
  History,
  User,
  Smartphone,
  List,
  PlayCircle,
} from "lucide-react";

export default function TechSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { text: "Dashboard", link: "/tech/dashboard", icon: <LayoutDashboard size={20} /> },
    { text: "Profile", link: "/profile", icon: <User size={20} /> },
    { text: "Đơn sửa chữa", link: "/tech/repair-orders", icon: <List size={20} /> },
    { text: "Đang sửa chữa", link: "/tech/repair-in-progress", icon: <PlayCircle size={20} /> },
    { text: "Công việc", link: "/tech/tasks", icon: <Wrench size={20} /> },
    { text: "Yêu cầu linh kện", link: "/tech/components", icon: <Cpu size={20} /> },
    { text: "Lịch sử sửa chữa", link: "/tech/history", icon: <History size={20} /> },
    { text: "Intake Tickets", link: "/tech/tickets", icon: <ClipboardList size={20} /> },
    { text: "Ghép điện thoại", link: "/tech/assemble", icon: <Smartphone size={20}/>},
  ];

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
