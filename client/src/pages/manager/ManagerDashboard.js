import React, { useState, useEffect } from "react";
import { 
  Users, Package, DollarSign, ClipboardList, 
  TrendingUp, ArrowRight, Clock, CheckCircle, Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import axiosClient from "../../api/axiosClient";

const formatCurrency = (val) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);
const formatCompact = (val) => {
  if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' Tỷ';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Tr';
  if (val >= 1000) return (val / 1000).toFixed(1) + ' K';
  return val;
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [staffCount, setStaffCount] = useState(0);
  
  // State lưu trữ tháng được chọn (Mặc định là tháng hiện tại)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  
  const [performanceData, setPerformanceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [totalMonthRevenue, setTotalMonthRevenue] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
      const storeId = userData.storeId?._id || userData.storeId;

      if (storeId) {
        try {
          // 1. LẤY NHÂN SỰ
          const usersRes = await axiosClient.get("/users");
          const usersArray = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
          
          const storeStaff = usersArray.filter(u => {
            const uStoreId = u.storeId?._id || u.storeId;
            const roleId = u.roleId?.id || u.roleId;
            return uStoreId === storeId && ["SALE_STAFF", "TECHNICIAN"].includes(roleId);
          });
          
          setStaffCount(storeStaff.length);

          const staffPerformance = {};
          storeStaff.forEach(staff => {
            const nameParts = (staff.fullName || staff.userName).split(" ");
            const shortName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
            staffPerformance[staff._id] = { name: shortName, fullName: staff.fullName || staff.userName, value: 0 };
          });

          // 2. KHỞI TẠO MẢNG NGÀY THEO THÁNG ĐƯỢC CHỌN
          const targetDate = dayjs(`${selectedMonth}-01`);
          const targetMonth = targetDate.month();
          const targetYear = targetDate.year();
          const daysInMonth = targetDate.daysInMonth();
          
          let dailyRevenue = {};
          for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${i.toString().padStart(2, '0')}/${(targetMonth + 1).toString().padStart(2, '0')}`;
            dailyRevenue[dateStr] = { date: dateStr, revenue: 0 };
          }

          let calcTotalRev = 0;

          // Hàm kiểm tra xem đơn hàng có nằm trong tháng được chọn không
          const isSameMonthYear = (dateObj) => {
             return dateObj.month() === targetMonth && dateObj.year() === targetYear;
          };

          // 3. LẤY DATA BÁN HÀNG
          const saleRes = await axiosClient.get(`/purchase-orders?orderType=SALE`);
          const saleArray = Array.isArray(saleRes.data) ? saleRes.data : saleRes.data?.data || [];
          
          saleArray.forEach(order => {
            const orderStoreId = order.storeId?._id || order.storeId;
            const creatorId = order.createdBy?._id || order.createdBy;
            const orderDate = dayjs(order.createdAt);
            
            if (orderStoreId === storeId && isSameMonthYear(orderDate)) {
              // Tính hiệu suất (Tất cả đơn)
              if (staffPerformance[creatorId]) staffPerformance[creatorId].value += 1;
              
              // Tính doanh thu (Chỉ đơn Completed)
              if (order.status === "Completed") {
                const dateStr = orderDate.format('DD/MM');
                if (dailyRevenue[dateStr]) {
                  dailyRevenue[dateStr].revenue += (order.totalPrice || 0);
                  calcTotalRev += (order.totalPrice || 0);
                }
              }
            }
          });

          // 4. LẤY DATA SỬA CHỮA
          const repairRes = await axiosClient.get(`/repair-orders`);
          const repairArray = Array.isArray(repairRes.data) ? repairRes.data : repairRes.data?.data || [];
          
          repairArray.forEach(order => {
            const orderStoreId = order.storeId?._id || order.storeId;
            const creatorId = order.createdBy?._id || order.createdBy;
            const orderDate = dayjs(order.createdAt || order.repairOrderDate);

            if (orderStoreId === storeId && isSameMonthYear(orderDate)) {
              // Tính hiệu suất
              if (staffPerformance[creatorId]) staffPerformance[creatorId].value += 1;

              // Tính doanh thu
              if (order.status === "Completed") {
                const dateStr = orderDate.format('DD/MM');
                if (dailyRevenue[dateStr]) {
                  dailyRevenue[dateStr].revenue += (order.totalPrice || 0);
                  calcTotalRev += (order.totalPrice || 0);
                }
              }
            }
          });

          // Set Data cho Biểu đồ Cột (Hiệu suất)
          const chartData = Object.values(staffPerformance).filter(s => s.value > 0).sort((a, b) => b.value - a.value);
          setPerformanceData(chartData);

          // Set Data cho Biểu đồ Vùng (Doanh thu)
          const revenueArr = Object.values(dailyRevenue);
          let finalRevenueData = revenueArr;

          // Cắt bớt mảng nếu tháng đang chọn là tháng hiện tại
          const isCurrentRealMonth = targetDate.isSame(dayjs(), 'month');
          if (isCurrentRealMonth) {
              const currentDayStr = dayjs().format('DD/MM');
              const currentDayIndex = revenueArr.findIndex(d => d.date === currentDayStr);
              if (currentDayIndex !== -1) {
                  finalRevenueData = revenueArr.slice(0, currentDayIndex + 1);
              }
          }

          setRevenueData(finalRevenueData);
          setTotalMonthRevenue(calcTotalRev);

        } catch (error) {
          console.error("Lỗi tải dữ liệu dashboard", error);
        }
      }
    };

    loadDashboardData();
  }, [selectedMonth]); // Chạy lại hàm mỗi khi selectedMonth thay đổi

  const stats = [
    { title: "Tổng nhân sự", value: staffCount, icon: <Users size={24} />, color: "bg-blue-500", link: "/manager/staffs" },
    { title: "Sản phẩm trong kho", value: "1,250", icon: <Package size={24} />, color: "bg-indigo-500", link: "/manager/inventory" },
    { title: "Doanh thu tháng chọn", value: formatCompact(totalMonthRevenue), icon: <DollarSign size={24} />, color: "bg-emerald-500", link: "/manager/purchase-history" },
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Chào mừng trở lại, <span className="text-indigo-600">{user.fullName || user.userName || "Quản lý"}</span>! 👋
          </h1>
          <p className="text-gray-500 mt-1">Dưới đây là tổng quan tình hình hoạt động của chi nhánh.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium">
          <TrendingUp size={18} />
          <span>Hiệu suất đang tăng 15% so với tuần trước</span>
        </div>
      </div>

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

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DOANH THU (AREA CHART) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-emerald-500" size={20} /> 
              Tổng Doanh Thu
            </h2>
            
            {/* THÊM BỘ LỌC CHỌN THÁNG Ở ĐÂY */}
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer bg-gray-50 hover:bg-white"
                  />
               </div>
               <div className="text-right hidden sm:block border-l pl-4 border-gray-200">
                 <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cộng dồn</p>
                 <p className="text-xl font-black text-emerald-600">{formatCurrency(totalMonthRevenue)}</p>
               </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [<span className="font-bold text-emerald-600">{formatCurrency(value)}</span>, "Doanh thu"]}
                  labelFormatter={(label) => <span className="text-gray-500 font-medium">Ngày {label}</span>}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HIỆU SUẤT NHÂN VIÊN (BAR CHART) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} /> Top Nhân Viên
          </h2>
          <div className="flex-1 w-full min-h-[250px]">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name, props) => [`${value} đơn`, <span className="font-bold">{props.payload.fullName}</span>]}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Không có dữ liệu hiệu suất tháng {dayjs(selectedMonth).format('MM/YYYY')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVITIES & SHORTCUTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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