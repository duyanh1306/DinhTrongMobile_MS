import {useNavigate} from "react-router-dom";
import { Cpu, Hammer ,Store, LayoutDashboard, Smartphone, UserCircle,Users, BookOpen, GraduationCap, Newspaper } from "lucide-react";

export default function AdminSidebar() {
    const navigate = useNavigate();
    const items = [
        {
            text: "Dashboard",
            link: "/admin/dashboard",
            icon: <LayoutDashboard className="h-5 w-5"/>,
        },
        {
            icon: <UserCircle size={20}/>,
            text: "Profile",
            link: "/profile", 
          },
        { icon: <Users size={20} />, text: "Manage Users", link: "/admin/users" },
        {
            icon: <Store size={20} />,
            text: "Manage Stores",
            link: "/admin/stores"
        },
        {
            icon: <Users size={20} />,
            text: "Manage Users",
            link: "/admin/users"
        },
        {   icon: <Smartphone size={20}/>,
            text: "Manage Phone Model",
            link: "/admin/phone_model"
        },
        {
            icon: <Cpu size={20}/>,
            text: "Manage Item Types",
            link: "/admin/item_type",
        },
        {
            icon: <Hammer size={20}/>,
            text: "Manage Repair Service",
            link: "/admin/repair_service",
        },
{
      icon: <Store size={20} />,
      text: "Manage Stores",
      link: "/admin/stores",
    },
    ];

    return (
        <div className="h-screen w-64 bg-blue-900 text-white flex flex-col shadow-lg">
            <div className="text-2xl font-bold p-4 border-b border-blue-700">
                Admin Panel
            </div>
            <nav className="flex flex-col p-4 gap-3">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition"
                        onClick={() => navigate(item.link)}
                    >
                        {item.icon}
                        <span className="text-sm">{item.text}</span>
                    </div>
                ))}
            </nav>
        </div>
    );
}
