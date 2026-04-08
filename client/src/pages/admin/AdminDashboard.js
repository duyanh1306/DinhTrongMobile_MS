import React, { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, Users, AlertCircle, Clock, Store, Calendar, TrendingUp } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchDashboardDataApi, fetchStoresApi } from "../../api/admin/dashboard"; 

export default function AdminDashboard() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");

  const [dashboardData, setDashboardData] = useState({
    stats: { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, pendingTransfers: 0 },
    monthlyChartData: [], 
    yearlyChartData: [],  
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      const storeList = await fetchStoresApi();
      setStores(storeList || []);
    };
    loadStores();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [selectedStore]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const data = await fetchDashboardDataApi(selectedStore);
    if (data) {
      setDashboardData({
        stats: data.stats || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, pendingTransfers: 0 },
        monthlyChartData: data.monthlyChartData || [],
        yearlyChartData: data.yearlyChartData || data.chartData || [],
        recentActivities: data.recentActivities || []
      }); 
    }
    setIsLoading(false);
  };

  const formatCurrency = (value) => {
    if (value >= 1000000000) return (value / 1000000000).toFixed(2) + " Tỷ ₫";
    if (value >= 1000000) return (value / 1000000).toFixed(1) + " Tr ₫";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

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
    { label: "Tổng đơn hàng", value: (dashboardData.stats.totalOrders || 0).toLocaleString(), icon: <ShoppingCart />, color: "bg-green-500" },
    { label: "Khách hàng", value: (dashboardData.stats.totalCustomers || 0).toLocaleString(), icon: <Users />, color: "bg-orange-500" },
    { label: "Yêu cầu chờ duyệt", value: dashboardData.stats.pendingTransfers || 0, icon: <AlertCircle />, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h2>
          
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition">
              <Store size={20} className="text-blue-600 mr-2" />
              <select 
                  value={selectedStore} 
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="bg-transparent outline-none text-gray-700 font-bold text-sm min-w-[200px] cursor-pointer"
              >
                  <option value="">TẤT CẢ CỬA HÀNG</option>
                  {stores.map(store => (
                      <option key={store._id} value={store._id}>{store.name}</option>
                  ))}
              </select>
          </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Calendar className="text-blue-500" size={20}/> 
                        Doanh thu trong tháng (Ngày)
                    </h3>
                    <div className="h-72 w-full">
                        {dashboardData.monthlyChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboardData.monthlyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRepair" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} minTickGap={15} />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#6B7280', fontSize: 11 }}
                                        tickFormatter={(value) => `${value / 1000000}M`}
                                    />
                                    <Tooltip 
                                        formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area type="monotone" name="Bán hàng" dataKey="sale" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSale)" />
                                    <Area type="monotone" name="Sửa chữa" dataKey="repair" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRepair)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 italic">Không có dữ liệu tháng này</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" size={20}/>
                        Tổng quan doanh thu năm nay (Tháng)
                    </h3>
                    <div className="h-72 w-full">
                        {dashboardData.yearlyChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dashboardData.yearlyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 italic">Không có dữ liệu năm nay</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-fit">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gray-500"/>
                Hoạt động gần đây
              </h3>
              
              <div className="flex-1 overflow-y-auto max-h-[650px] pr-2">
                <ul className="space-y-4">
                  {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
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
        </>
      )}
    </div>
  );
}