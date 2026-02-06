import React from "react";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { label: "Tổng doanh thu", value: "120.5M ₫", icon: <DollarSign />, color: "bg-blue-500" },
    { label: "Đơn hàng mới", value: "1,250", icon: <ShoppingCart />, color: "bg-green-500" },
    { label: "Khách hàng", value: "3,400", icon: <Users />, color: "bg-orange-500" },
    { label: "Tăng trưởng", value: "+12.5%", icon: <TrendingUp />, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition">
            <div>
              <p className="text-gray-500 text-sm font-medium">{item.label}</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{item.value}</h3>
            </div>
            <div className={`p-3 rounded-full text-white ${item.color}`}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Mock Chart / Table Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm h-64 border border-gray-100 flex items-center justify-center text-gray-400">
             [Biểu đồ doanh thu theo tháng sẽ hiển thị ở đây]
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm h-64 border border-gray-100">
             <h3 className="font-bold text-gray-700 mb-4">Hoạt động gần đây</h3>
             <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex justify-between border-b pb-2">
                    <span>Đơn hàng #DH001 vừa được tạo</span>
                    <span className="text-xs text-gray-400">2 phút trước</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                    <span>Kỹ thuật viên Tùng đã hoàn thành sửa chữa #SC99</span>
                    <span className="text-xs text-gray-400">15 phút trước</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                    <span>User mới: Nguyen Van A đăng ký</span>
                    <span className="text-xs text-gray-400">1 giờ trước</span>
                </li>
             </ul>
        </div>
      </div>
    </div>
  );
}