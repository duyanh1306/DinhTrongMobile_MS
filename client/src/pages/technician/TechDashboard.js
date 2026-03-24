import React, { useState, useEffect } from "react";
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

  const getPriorityBadge = (order) => {
    const orderDate = new Date(order.repairOrderDate);
    const now = new Date();
    const hoursDiff = (now - orderDate) / (1000 * 60 * 60);

    if (hoursDiff < 24 && order.status === 'In Progress') {
      return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Ưu tiên cao</span>;
    } else if (hoursDiff < 48 && order.status === 'In Progress') {
      return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Ưu tiên trung bình</span>;
    }
    return null;
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const endpoint = newStatus === 'In Progress' ? 'accept' : 
                      newStatus === 'Completed' ? 'complete' : 'cancel';
      await axiosClient.put(`/repair-orders/${orderId}/${endpoint}`);
      fetchRepairOrders();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Không thể cập nhật trạng thái đơn sửa chữa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Khu vực kỹ thuật</h2>
        <button
          onClick={fetchRepairOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tech KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Được giao</p>
              <h3 className="text-3xl font-bold mt-1">{stats.assigned}</h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Wrench className="text-blue-400 w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {repairOrders.filter(o => o.status === 'In Progress').length} máy đang sửa
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Chờ linh kiện</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-800">{stats.waitingParts}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="text-red-500 w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Đơn cần linh kiện bổ sung
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Đã xong hôm nay</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-800">{stats.completedToday}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckSquare className="text-green-500 w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Hoàn thành trong ngày
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Lịch hẹn khách</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-800">{stats.appointments}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="text-purple-500 w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Đơn chờ xử lý
          </p>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Danh sách đơn sửa chữa</h3>
          <p className="text-sm text-gray-500 mt-1">
            Hiển thị {repairOrders.length} đơn sửa chữa
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : repairOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có đơn sửa chữa nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {repairOrders.map((order) => (
              <div
                key={order._id}
                className={`border-l-4 ${getStatusColor(order.status)} rounded-lg p-6 hover:shadow-md transition`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-gray-800">
                        {order.repairType || 'Sửa chữa'}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      {getPriorityBadge(order)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Khách:</span>
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">SĐT:</span>
                        <span>{order.customerPhone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Ngày tạo:</span>
                        <span>{formatDate(order.repairOrderDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Tổng tiền:</span>
                        <span className="font-bold text-blue-600">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </div>

                    {order.storeId && (
                      <div className="mt-3 text-sm text-gray-500">
                        <span className="font-medium">Cửa hàng:</span> {order.storeId.name || order.storeId.code}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'In Progress')}
                        className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                      >
                        <Wrench className="w-4 h-4" />
                        Nhận đơn
                      </button>
                    )}
                    {order.status === 'In Progress' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'Completed')}
                        className="text-sm bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Hoàn thành
                      </button>
                    )}
                    {(order.status === 'Pending' || order.status === 'In Progress') && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'Cancelled')}
                        className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
