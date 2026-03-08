import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { Calendar, User, Phone, Store, CheckCircle, Clock, XCircle, AlertCircle, Eye, Filter, Play, Ban } from "lucide-react";
import dayjs from "dayjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RepairOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    storeId: 'ALL'
  });

  useEffect(() => {
    fetchRepairOrders();
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await axiosClient.get('/stores');
      setStores(response.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchRepairOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/repair-orders');
      setOrders(response.data);
      setFilteredOrders(response.data);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách đơn sửa chữa");
      console.error("Error fetching repair orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredOrders = async () => {
    try {
      setFilterLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.status !== 'ALL') {
        queryParams.append('status', filters.status);
      }
      if (filters.type !== 'ALL') {
        queryParams.append('type', filters.type);
      }
      if (filters.storeId !== 'ALL') {
        queryParams.append('storeId', filters.storeId);
      }
      
      const url = queryParams.toString() 
        ? `/repair-orders/filter?${queryParams.toString()}`
        : '/repair-orders';
      
      const response = await axiosClient.get(url);
      setFilteredOrders(response.data);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách đơn sửa chữa đã lọc");
      console.error("Error fetching filtered repair orders:", err);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const applyFilters = () => {
    fetchFilteredOrders();
  };

  const resetFilters = () => {
    setFilters({
      status: 'ALL',
      type: 'ALL',
      storeId: 'ALL'
    });
    // Immediately show all orders when reset
    setFilteredOrders(orders);
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axiosClient.get(`/repair-orders/${orderId}/details`);
      setOrderDetails(response.data);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setOrderDetails([]);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    await fetchOrderDetails(order._id);
  };

  const acceptRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/accept`);
      
      // Update the order in both orders and filteredOrders arrays
      const updateOrderStatus = (orderList) => 
        orderList.map(order => 
          order._id === orderId 
            ? { ...order, status: "In Progress" }
            : order
        );
      
      setOrders(updateOrderStatus(orders));
      setFilteredOrders(updateOrderStatus(filteredOrders));
      
      // Show success toast
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error accepting repair order:", error);
      toast.error(error.response?.data?.message || "Không thể chấp nhận đơn sửa chữa");
    }
  };

  const cancelRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/cancel`);
      
      // Update the order in both orders and filteredOrders arrays
      const updateOrderStatus = (orderList) => 
        orderList.map(order => 
          order._id === orderId 
            ? { ...order, status: "Cancelled" }
            : order
        );
      
      setOrders(updateOrderStatus(orders));
      setFilteredOrders(updateOrderStatus(filteredOrders));
      
      // Show success toast
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error cancelling repair order:", error);
      toast.error(error.response?.data?.message || "Không thể hủy đơn sửa chữa");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "In Progress":
        return <AlertCircle className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Pending":
        return "Chờ xử lý";
      case "In Progress":
        return "Đang xử lý";
      case "Completed":
        return "Hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={fetchRepairOrders}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Danh sách đơn sửa chữa</h2>
        <div className="text-sm text-gray-500">
          Sắp xếp theo: Thời gian tạo (FIFO)
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="Pending">Chờ xử lý</option>
              <option value="In Progress">Đang xử lý</option>
              <option value="Completed">Hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại sửa chữa
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="REPAIR">Sửa chữa</option>
              <option value="WARRANTY">Bảo hành</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cửa hàng
            </label>
            <select
              value={filters.storeId}
              onChange={(e) => handleFilterChange('storeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              {stores.map(store => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              disabled={filterLoading}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {filterLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Áp dụng
            </button>
            <button
              onClick={resetFilters}
              disabled={filterLoading}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Tổng số đơn</p>
              <p className="text-xl font-bold">{filteredOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Chờ xử lý</p>
              <p className="text-xl font-bold">
                {filteredOrders.filter(o => o.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Đang xử lý</p>
              <p className="text-xl font-bold">
                {filteredOrders.filter(o => o.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Hoàn thành</p>
              <p className="text-xl font-bold">
                {filteredOrders.filter(o => o.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden relative">
        {filterLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Đang lọc...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cửa hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order, index) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{String(index + 1).padStart(4, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {dayjs(order.repairOrderDate).format('DD/MM/YYYY HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{order.customerName}</div>
                      {order.customerPhone && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      {order.storeId?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.totalPrice?.toLocaleString('vi-VN') || 0} đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {/* Details button - always show */}
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Chi tiết
                      </button>
                      
                      {/* Accept button - only for Pending orders */}
                      {order.status === "Pending" && (
                        <button
                          onClick={() => acceptRepairOrder(order._id)}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <Play className="w-4 h-4" />
                          Chấp nhận
                        </button>
                      )}
                      
                      {/* Cancel button - for Pending and In Progress orders */}
                      {(order.status === "Pending" || order.status === "In Progress") && (
                        <button
                          onClick={() => cancelRepairOrder(order._id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <Ban className="w-4 h-4" />
                          Hủy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Không có đơn sửa chữa nào phù hợp với bộ lọc</p>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Chi tiết đơn sửa chữa #{filteredOrders.findIndex(o => o._id === selectedOrder._id) + 1}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {dayjs(selectedOrder.repairOrderDate).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedOrder.customerName}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Thông tin cửa hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-400" />
                      <span>{selectedOrder.storeId?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Mã cửa hàng:</span>
                      <span>{selectedOrder.storeId?.code || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Chi tiết dịch vụ</h4>
                {orderDetails.length > 0 ? (
                  <div className="space-y-3">
                    {orderDetails.map((detail, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {detail.serviceId && (
                            <div>
                              <span className="text-sm text-gray-500">Dịch vụ:</span>
                              <p className="font-medium">{detail.serviceId.name}</p>
                              <p className="text-sm text-gray-600">
                                {detail.serviceId.price?.toLocaleString('vi-VN') || 0} đ
                              </p>
                            </div>
                          )}
                          
                          {detail.targetPhoneId && (
                            <div>
                              <span className="text-sm text-gray-500">Thiết bị:</span>
                              <p className="font-medium">
                                {detail.targetPhoneId.phoneModelId?.name || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                IMEI: {detail.targetPhoneId.imei || 'N/A'}
                              </p>
                            </div>
                          )}
                          
                          {detail.itemIds && detail.itemIds.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-sm text-gray-500">Linh kiện:</span>
                              <div className="mt-1 space-y-1">
                                {detail.itemIds.map((item, itemIndex) => (
                                  <div key={itemIndex} className="text-sm">
                                    <span className="font-medium">{item.name}</span>
                                    {item.serialCode && (
                                      <span className="text-gray-600 ml-2">
                                        (SN: {item.serialCode})
                                      </span>
                                    )}
                                    <span className="text-gray-600 ml-2">
                                      {item.price?.toLocaleString('vi-VN') || 0} đ
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Không có chi tiết dịch vụ</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {selectedOrder.totalPrice?.toLocaleString('vi-VN') || 0} đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Container */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default RepairOrderList;
