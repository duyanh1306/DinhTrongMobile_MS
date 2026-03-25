import { useState, useEffect } from "react";
import { Wrench, AlertCircle, CheckSquare, Calendar, Clock, User, Phone, RefreshCw } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { formatPrice, formatDate, getStatusColor, getStatusBadge, getStatusText } from "../../utils";

export default function TechDashboard() {
  const [repairOrders, setRepairOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    assigned: 0,
    waitingParts: 0,
    completedToday: 0,
    appointments: 0
  });

  useEffect(() => {
    fetchRepairOrders();
  }, []);

  const fetchRepairOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/repair-orders');
      setRepairOrders(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error fetching repair orders:', err);
      setError('Không thể tải dữ liệu đơn sửa chữa');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assigned = orders.filter(order => 
      order.status === 'Pending' || order.status === 'In Progress'
    ).length;

    const waitingParts = orders.filter(order => 
      order.status === 'In Progress' && order.repairType === 'Sửa chữa'
    ).length;

    const completedToday = orders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.repairOrderDate);
      return order.status === 'Completed' && orderDate >= today;
    }).length;

    const appointments = orders.filter(order => {
      const orderDate = new Date(order.repairOrderDate);
      return orderDate >= today && order.status === 'Pending';
    }).length;

    setStats({ assigned, waitingParts, completedToday, appointments });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Khu vực kỹ thuật</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
              </span>
            </div>
            <button
              onClick={fetchRepairOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
              <Wrench className="w-4 h-4" />
              Tạo Request
            </button>
          </div>
        </header>

        {/* Main dashboard content */}
        <main className="flex-1 p-6 md:p-10 bg-gray-50">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Card thống kê */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Tổng quan yêu cầu */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between hover:shadow-xl transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Tổng yêu cầu</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">{repairOrders.length}</h3>
                  <p className="text-xs text-gray-400 mt-2">{stats.completedToday} hoàn thành hôm nay</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Wrench className="text-blue-500 w-6 h-6" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-green-600 font-semibold">{repairOrders.filter(o => o.status === 'Completed').length} đã xong</span>
                <span className="text-xs text-orange-500 font-semibold">{repairOrders.filter(o => o.status !== 'Completed').length} đang xử lý</span>
              </div>
            </div>

            {/* Đang xử lý */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between hover:shadow-xl transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Đang xử lý</p>
                  <h3 className="text-3xl font-bold mt-1 text-blue-600">{repairOrders.filter(o => o.status === 'In Progress').length}</h3>
                  <p className="text-xs text-gray-400 mt-2">{stats.assigned} đơn được giao</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <RefreshCw className="text-blue-400 w-6 h-6" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">{stats.waitingParts} chờ linh kiện</span>
                <span className="text-xs text-gray-500">{stats.appointments} lịch hẹn</span>
              </div>
            </div>

            {/* Đã hoàn thành hôm nay */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between hover:shadow-xl transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Hoàn thành hôm nay</p>
                  <h3 className="text-3xl font-bold mt-1 text-green-600">{stats.completedToday}</h3>
                  <p className="text-xs text-gray-400 mt-2">Tổng: {repairOrders.filter(o => o.status === 'Completed').length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <CheckSquare className="text-green-500 w-6 h-6" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">{stats.completedToday} trong ngày</span>
                <span className="text-xs text-gray-500">{repairOrders.filter(o => o.status === 'Completed').length} tổng</span>
              </div>
            </div>

            {/* Đơn chờ xử lý (Overdue) */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between hover:shadow-xl transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Đơn chờ xử lý</p>
                  <h3 className="text-3xl font-bold mt-1 text-orange-500">{repairOrders.filter(o => o.status === 'Pending').length}</h3>
                  <p className="text-xs text-gray-400 mt-2">{stats.appointments} lịch hẹn khách</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="text-orange-500 w-6 h-6" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">{repairOrders.filter(o => o.status === 'Pending').length} chưa nhận</span>
                <span className="text-xs text-gray-500">{stats.waitingParts} chờ linh kiện</span>
              </div>
            </div>

            </div>
            {/* Recent Activity */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col min-h-[320px] transition-all duration-200 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 text-base">Hoạt động gần đây</h4>
                  <span className="text-xs text-gray-400">{repairOrders.length > 0 ? `Hiển thị ${Math.min(7, repairOrders.length)} đơn mới nhất` : ''}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="py-2 pr-4 text-left font-medium">Tên đơn</th>
                        <th className="py-2 pr-4 text-left font-medium">Khách</th>
                        <th className="py-2 pr-4 text-left font-medium">Trạng thái</th>
                        <th className="py-2 pr-4 text-left font-medium">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repairOrders.slice(0, 5).map((order) => (
                        <tr key={order._id} className="border-b last:border-0 hover:bg-blue-50/40 transition-all">
                          <td className="py-2 pr-4 font-semibold text-gray-800">{order.repairType || 'Sửa chữa'}</td>
                          <td className="py-2 pr-4 text-gray-600">{order.customerName}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm border ${getStatusBadge(order.status)} ${order.status==='Completed'?'bg-green-50 border-green-200 text-green-700':order.status==='In Progress'?'bg-blue-50 border-blue-200 text-blue-700':order.status==='Pending'?'bg-orange-50 border-orange-200 text-orange-700':'bg-gray-50 border-gray-200 text-gray-500'}`}>{getStatusText(order.status)}</span>
                          </td>
                          <td className="py-2 pr-4 text-gray-500">{formatDate(order.repairOrderDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {repairOrders.length === 0 && (
                    <div className="text-gray-400 text-center py-8">Không có hoạt động gần đây</div>
                  )}
                </div>
              </div>
              {/* Assigned Vendor */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col min-h-[320px] transition-all duration-200 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 text-base">Assigned Vendor</h4>
                  <span className="text-xs text-gray-400">{repairOrders.filter(o => o.technicianName).length} người được giao</span>
                </div>
                <div className="flex flex-col gap-4">
                  {repairOrders.filter(o => o.technicianName).slice(0, 3).map((order, idx) => (
                    <div key={order._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50/40 transition-all border border-gray-50 shadow-sm">
                      <img src={order.technicianAvatar || '/avatar-default.png'} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 bg-gray-100" onError={e => {e.target.onerror=null;e.target.src='/avatar-default.png'}} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-base">{order.technicianName}</div>
                        <div className="text-xs text-gray-500 font-medium">{order.repairType || 'Sửa chữa'} <span className="mx-1">•</span> {order.unit || 'N/A'}</div>
                      </div>
                      <div className="text-xs text-blue-500 font-semibold">
                        {order.dueDate ? `${Math.max(0, Math.ceil((new Date(order.dueDate) - new Date()) / (1000*60*60*24)))} ngày còn lại` : ''}
                      </div>
                    </div>
                  ))}
                  {repairOrders.filter(o => o.technicianName).length === 0 && (
                    <div className="text-gray-400 text-center py-8 italic">Tính năng đang được phát triển</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
