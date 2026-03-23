import React, { useState, useEffect } from "react";
import { 
  Users, Package, DollarSign, ClipboardList, 
  TrendingUp, ArrowRight, Clock, CheckCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    // Lấy thông tin user từ localStorage để hiển thị lời chào
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
  }, []);

  // Dữ liệu mẫu (Mock data) - Sau này bạn sẽ gọi API để thay thế
  const stats = [
    { title: "Tổng nhân sự", value: "24", icon: <Users size={24} />, color: "bg-blue-500", link: "/manager/staffs" },
    { title: "Sản phẩm trong kho", value: "1,250", icon: <Package size={24} />, color: "bg-indigo-500", link: "/manager/inventory" },
    { title: "Doanh thu tháng", value: "125.5M", icon: <DollarSign size={24} />, color: "bg-emerald-500", link: "/manager/sales_history" },
    { title: "Yêu cầu chờ duyệt", value: "5", icon: <ClipboardList size={24} />, color: "bg-amber-500", link: "/manager/transfer_approvals" },
  ];

  const recentActivities = [
    { id: 1, action: "Yêu cầu xuất kho linh kiện", user: "Nguyễn Văn A (Kỹ thuật)", time: "10 phút trước", status: "pending" },
    { id: 2, action: "Báo cáo doanh thu ca sáng", user: "Trần Thị B (Sale)", time: "1 giờ trước", status: "completed" },
    { id: 3, action: "Yêu cầu nhập thêm Pin IP13", user: "Lê Văn C (Kho)", time: "2 giờ trước", status: "pending" },
    { id: 4, action: "Đã duyệt chuyển kho #TR-001", user: "Bạn", time: "Hôm qua", status: "completed" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER CHÀO MỪNG */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Chào mừng trở lại, <span className="text-indigo-600">{user.fullName || user.userName || "Quản lý"}</span>! 👋
          </h1>
          <p className="text-gray-500 mt-1">Dưới đây là tổng quan tình hình hoạt động của chi nhánh hôm nay.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium">
          <TrendingUp size={18} />
          <span>Hiệu suất đang tăng 15% so với tuần trước</span>
        </div>
      </div>

      {/* CARD THỐNG KÊ (QUICK STATS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            onClick={() => navigate(stat.link)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl text-white shadow-sm ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{stat.title}</p>
              <h3 className="text-3xl font-black text-gray-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* KHU VỰC CHI TIẾT (MAIN CONTENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI: HOẠT ĐỘNG GẦN ĐÂY (Chiếm 2 phần) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock className="text-indigo-500" size={20} /> Hoạt động gần đây
            </h2>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Xem tất cả</button>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="mt-1">
                    {activity.status === 'completed' ? (
                      <CheckCircle size={20} className="text-emerald-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-gray-700">{activity.user}</span> • {activity.time}
                    </p>
                  </div>
                  {activity.status === 'pending' && (
                    <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition">
                      Xử lý ngay
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: LỐI TẮT NHANH (Chiếm 1 phần) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="text-indigo-500" size={20} /> Lối tắt thao tác
            </h2>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <button onClick={() => navigate('/manager/transfer_approvals')} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition group border border-transparent hover:border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><ClipboardList size={18} /></div>
                <span className="font-semibold text-gray-700 group-hover:text-indigo-700">Duyệt yêu cầu kho</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">5</div>
            </button>

            <button onClick={() => navigate('/manager/inventory')} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition group border border-transparent hover:border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Package size={18} /></div>
                <span className="font-semibold text-gray-700 group-hover:text-indigo-700">Kiểm kê kho hàng</span>
              </div>
              <ArrowRight size={18} className="text-gray-400 group-hover:text-indigo-500" />
            </button>

            <button onClick={() => navigate('/manager/staffs')} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition group border border-transparent hover:border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={18} /></div>
                <span className="font-semibold text-gray-700 group-hover:text-indigo-700">Đánh giá nhân sự</span>
              </div>
              <ArrowRight size={18} className="text-gray-400 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}