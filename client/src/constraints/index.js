  import { 
  LayoutDashboard, 
  Cpu,
  Wrench, 
  Smartphone,
  List,
} from "lucide-react";
  
export const items = [
    { text: "Dashboard", link: "/tech/dashboard", icon: <LayoutDashboard size={20} /> },
    { text: "Kho", link: "/tech/storage", icon: <Wrench size={20} /> },
    { text: "Hàng chờ", link: "/tech/repair-orders", icon: <List size={20} /> },
    { text: "Yêu cầu linh kiện", link: "/tech/components", icon: <Cpu size={20} /> },
    { text: "Ghép/gỡ điện thoại", link: "/tech/assemble", icon: <Smartphone size={20}/>},
  ];

export const categories = [
    { code: 'LCD', name: 'Màn hình (LCD)', required: true },
    { code: 'BAT', name: 'Pin (Battery)', required: true },
    { code: 'MAIN', name: 'Mainboard', required: true },
    { code: 'CAM', name: 'Camera', required: true },
    { code: 'SPK', name: 'Loa (Speaker)', required: false },
    { code: 'MIC', name: 'Microphone', required: false },
    { code: 'VIB', name: 'Rung (Vibrator)', required: false },
    { code: 'FLE', name: 'Cáp Flex (Flex Cable)', required: false },
    { code: 'BUT', name: 'Nút bấm (Buttons)', required: false },
    { code: 'CAS', name: 'Vỏ máy (Case)', required: false },
    { code: 'GLA', name: 'Kính (Glass)', required: false },
    { code: 'ANT', name: 'Antenna', required: false },
    { code: 'CHG', name: 'Cổng sạc (Charging Port)', required: false },
    { code: 'JAC', name: 'Jack tai nghe (Jack)', required: false },
    { code: 'SEN', name: 'Cảm biến (Sensors)', required: false }
  ];
  