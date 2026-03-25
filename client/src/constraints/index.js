  import { 
  LayoutDashboard, 
  Cpu,
  Wrench, 
  Smartphone,
  List,
  Notebook
} from "lucide-react";
  
export const items = [
    { text: "Dashboard", link: "/tech/dashboard", icon: <LayoutDashboard size={20} /> },
    { text: "Kho", link: "/tech/storage", icon: <Wrench size={20} /> },
    { text: "Hàng chờ", link: "/tech/repair-orders", icon: <List size={20} /> },
    { text: "Lịch sử sửa chữa", link: "/tech/history", icon: <Notebook size={20} /> },
    { text: "Yêu cầu linh kện", link: "/tech/components", icon: <Cpu size={20} /> },
    { text: "Ghép/gỡ điện thoại", link: "/tech/assemble", icon: <Smartphone size={20}/>},
  ];

  