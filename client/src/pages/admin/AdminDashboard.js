import React, { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, Users, AlertCircle, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, pendingTransfers: 0 },
    chartData: [],
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu Dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Format tiền tệ
  const formatCurrency = (value) => {
    if (value >= 1000000000) return (value / 1000000000).toFixed(2) + " Tỷ ₫";
    if (value >= 1000000) return (value / 1000000).toFixed(1) + " Tr ₫";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Tính thời gian trôi qua (vd: 5 phút trước)
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return Math.floor(seconds) + " giây trước";
  };

  const statCards = [
    { label: "Tổng doanh thu", value: formatCurrency(dashboardData.stats.totalRevenue), icon: <DollarSign />, color: "bg-blue-500" },
    { label: "Tổng đơn hàng", value: dashboardData.stats.totalOrders.toLocaleString(), icon: <ShoppingCart />, color: "bg-green-500" },
    { label: "Khách hàng", value: dashboardData.stats.totalCustomers.toLocaleString(), icon: <Users />, color: "bg-orange-500" },
    { label: "Yêu cầu chờ duyệt", value: dashboardData.stats.pendingTransfers, icon: <AlertCircle />, color: "bg-red-500" },
  ];

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu tổng quan...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((item, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition border border-gray-100">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
            </div>
            <div className={`p-3 rounded-xl text-white shadow-sm ${item.color}`}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="font-bold text-gray-800 mb-6">Biểu đồ doanh thu (Bán hàng vs Sửa chữa)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <Tooltip 
                    formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" name="Bán hàng" dataKey="sale" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Sửa chữa" dataKey="repair" stroke="#F97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-gray-500"/>
              Hoạt động gần đây
            </h3>
            
            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-4">
                {dashboardData.recentActivities.length > 0 ? (
                  dashboardData.recentActivities.map((activity, idx) => (
                    <li key={idx} className="relative pl-4 border-l-2 border-blue-500 pb-2">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full"></div>
                        <p className="text-sm text-gray-800 font-medium">
                          Đơn {activity.type} mới
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Khách hàng: {activity.customer} <br/>
                          Nhân viên: {activity.staff}
                        </p>
                        <span className="text-xs text-blue-500 font-medium mt-2 inline-block">
                          {timeAgo(activity.time)}
                        </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 text-center py-4">Chưa có hoạt động nào</li>
                )}
              </ul>
            </div>
            
        </div>
      </div>
    </div>
  );
}