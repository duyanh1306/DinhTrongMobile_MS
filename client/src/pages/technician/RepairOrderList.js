import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { Calendar, User, Phone, Store, CheckCircle, Clock, XCircle, AlertCircle, Eye, Filter, Play, Ban, Wrench, Calculator, DollarSign, X } from "lucide-react";
import dayjs from "dayjs";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const RepairOrderList = () => {
  const [activeTab, setActiveTab] = useState("REPAIR"); // "REPAIR" | "TRADE_IN"

  // =========================================================================
  // STATE: REPAIR ORDERS (KHÁCH CHỜ SỬA CHỮA)
  // =========================================================================
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
    storeId: 'ALL',
    customerName: ''
  });

  // =========================================================================
  // STATE: TRADE IN (ĐỊNH GIÁ THU MUA)
  // =========================================================================
  const [tradeInRequests, setTradeInRequests] = useState([]);
  const [selectedTradeIn, setSelectedTradeIn] = useState(null);
  const [phoneModels, setPhoneModels] = useState([]);
  const [valuation, setValuation] = useState({ price: "", techNote: "", phoneModelId: "", imei: "" });

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    if (activeTab === "REPAIR") {
      fetchRepairOrders();
      fetchStores();
    } else {
      fetchTradeInRequests();
      fetchPhoneModels();
    }
  }, [activeTab]);

  // =========================================================================
  // FUNCTIONS: REPAIR ORDERS
  // =========================================================================
  const fetchStores = async () => {
    try {
      const response = await axiosClient.get('/stores');
      setStores(response.data);
    } catch (err) { console.error("Error fetching stores:", err); }
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
    } finally {
      setLoading(false);
    }
  };

  const fetchInProgressOrders = async () => {
    try {
      setLoading(true);
      // Fetch only IN_PROGRESS orders - backend will automatically filter by user's store
      const response = await axiosClient.get('/repair-orders/filter?status=IN_PROGRESS');
      setOrders(response.data);
      setFilteredOrders(response.data);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách đơn đang sửa chữa");
      console.error("Error fetching in-progress orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredOrders = async () => {
    try {
      setFilterLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status !== 'ALL') queryParams.append('status', filters.status);
      if (filters.type !== 'ALL') queryParams.append('type', filters.type);
      if (filters.storeId !== 'ALL') queryParams.append('storeId', filters.storeId);
      
      const url = queryParams.toString() ? `/repair-orders/filter?${queryParams.toString()}` : '/repair-orders';
      const response = await axiosClient.get(url);
      setFilteredOrders(response.data);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách đơn sửa chữa đã lọc");
    } finally {
      setFilterLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const applyFilters = () => fetchFilteredOrders();

  const handleSearch = (searchTerm) => {
    handleFilterChange('customerName', searchTerm);
    
    // If search term is empty, reset to all orders
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }
    
    // Filter orders by customer name (case-insensitive)
    const filtered = orders.filter(order => 
      order.customerName && 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredOrders(filtered);
  };

  const resetFilters = () => {
    setFilters({ status: 'ALL', type: 'ALL', storeId: 'ALL' });
    setFilteredOrders(orders);
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axiosClient.get(`/repair-orders/${orderId}/details`);
      setOrderDetails(response.data);
    } catch (err) { setOrderDetails([]); }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    await fetchOrderDetails(order._id);
  };

  const acceptRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/accept`);
      const updateOrderStatus = (orderList) => 
        orderList.map(order => order._id === orderId ? { ...order, status: "In Progress" } : order);
      
      setOrders(updateOrderStatus(orders));
      setFilteredOrders(updateOrderStatus(filteredOrders));
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể chấp nhận đơn sửa chữa");
    }
  };

  const cancelRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/cancel`);
      const updateOrderStatus = (orderList) => 
        orderList.map(order => order._id === orderId ? { ...order, status: "Cancelled" } : order);
      
      setOrders(updateOrderStatus(orders));
      setFilteredOrders(updateOrderStatus(filteredOrders));
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy đơn sửa chữa");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return <Clock className="w-4 h-4" />;
      case "In Progress": return <AlertCircle className="w-4 h-4" />;
      case "Completed": return <CheckCircle className="w-4 h-4" />;
      case "Cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Pending": return "Chờ xử lý";
      case "In Progress": return "Đang xử lý";
      case "Completed": return "Hoàn thành";
      case "Cancelled": return "Đã hủy";
      default: return status;
    }
  };

  // =========================================================================
  // FUNCTIONS: TRADE IN (ĐỊNH GIÁ)
  // =========================================================================
  const fetchPhoneModels = async () => {
    try {
      const res = await axiosClient.get("/phone_models/all");
      setPhoneModels(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) { console.error("Lỗi tải Phone Models"); }
  };

  const fetchTradeInRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/purchase-orders?orderType=PURCHASE&status=Pending_Tech");
      setTradeInRequests(Array.isArray(res.data) ? res.data : res.data.data || []);
      setError(null);
    } catch (err) { 
      setError("Lỗi lấy danh sách định giá"); 
    } finally {
      setLoading(false);
    }
  };

  const submitValuation = async () => {
    if(!valuation.phoneModelId) return toast.error("Vui lòng chọn dòng máy!");
    if(!valuation.imei) return toast.error("Vui lòng nhập IMEI thiết bị!");
    if(!valuation.price) return toast.error("Vui lòng nhập giá thu mua!");
    
    try {
      const payload = {
        totalPrice: Number(valuation.price), 
        status: "Pending",
        note: valuation.techNote ? `[KẾT QUẢ TEST]: ${valuation.techNote}` : "Tech đã chốt giá",
        tempPhoneData: {
            phoneModelId: valuation.phoneModelId,
            imei: valuation.imei
        }
      };

      await axiosClient.put(`/purchase-orders/${selectedTradeIn._id}`, payload);
      
      toast.success("Đã định giá xong! Đã chuyển lại cho Sale.");
      setSelectedTradeIn(null);
      setValuation({ price: "", techNote: "", phoneModelId: "", imei: "" });
      fetchTradeInRequests();
    } catch(err) { toast.error("Lỗi cập nhật giá"); }
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  if (loading && activeTab === "REPAIR" && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Kỹ thuật</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("REPAIR")}
            className={`pb-2 px-2 text-lg font-bold transition-all border-b-4 ${
              activeTab === "REPAIR" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Khách chờ sửa chữa
          </button>
          <button
            onClick={() => setActiveTab("TRADE_IN")}
            className={`pb-2 px-2 text-lg font-bold transition-all border-b-4 ${
              activeTab === "TRADE_IN" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Định giá thu mua
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={activeTab === "REPAIR" ? fetchRepairOrders : fetchTradeInRequests}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 1: REPAIR ORDERS */}
      {/* ================================================================= */}
      {activeTab === "REPAIR" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="ALL">Tất cả</option>
                  <option value="Pending">Chờ xử lý</option>
                  <option value="In Progress">Đang xử lý</option>
                  <option value="Completed">Hoàn thành</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại sửa chữa</label>
                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="ALL">Tất cả</option>
                  <option value="REPAIR">Sửa chữa</option>
                  <option value="WARRANTY">Bảo hành</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cửa hàng</label>
                <select value={filters.storeId} onChange={(e) => handleFilterChange('storeId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="ALL">Tất cả</option>
                  {stores.map(store => (
                    <option key={store._id} value={store._id}>{store.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end gap-2">
                <button onClick={applyFilters} disabled={filterLoading} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2">
                  {filterLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Áp dụng
                </button>
                <button onClick={resetFilters} disabled={filterLoading} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
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
                  <p className="text-xl font-bold">{filteredOrders.filter(o => o.status === 'Pending').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Đang xử lý</p>
                  <p className="text-xl font-bold">{filteredOrders.filter(o => o.status === 'In Progress').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Hoàn thành</p>
                  <p className="text-xl font-bold">{filteredOrders.filter(o => o.status === 'Completed').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cửa hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại sửa chữa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{String(index + 1).padStart(4, '0')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> {dayjs(order.repairOrderDate).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          {order.customerPhone && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Phone className="w-3 h-3" /> {order.customerPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4" /> {order.storeId?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.repairType || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button onClick={() => handleViewDetails(order)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                            <Eye className="w-4 h-4" /> Chi tiết
                          </button>
                          {order.status === "Pending" && (
                            <button onClick={() => acceptRepairOrder(order._id)} className="text-green-600 hover:text-green-900 flex items-center gap-1">
                              <Play className="w-4 h-4" /> Chấp nhận
                            </button>
                          )}
                          {(order.status === "Pending" || order.status === "In Progress") && (
                            <button onClick={() => cancelRepairOrder(order._id)} className="text-red-600 hover:text-red-900 flex items-center gap-1">
                              <Ban className="w-4 h-4" /> Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOrders.length === 0 && !filterLoading && (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Không có đơn sửa chữa nào phù hợp</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: TRADE IN (ĐỊNH GIÁ THU MUA) */}
      {/* ================================================================= */}
      {activeTab === "TRADE_IN" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Wrench className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">Danh sách cần định giá</h3>
                <p className="text-purple-700">Tổng số: {tradeInRequests.length} máy đang chờ Kỹ thuật test và chốt giá</p>
              </div>
            </div>
          </div>

          {/* Trade In Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thiết bị dự kiến</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú từ Sale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tradeInRequests.map((req, index) => (
                    <tr key={req._id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{req._id.substring(req._id.length - 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> {dayjs(req.createdAt || new Date()).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{req.customerName}</div>
                          {req.customerPhone && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Phone className="w-3 h-3" /> {req.customerPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-medium text-gray-900">{req.tempPhoneData?.phoneModelId?.name || "Sale chưa nhập"}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">IMEI: {req.tempPhoneData?.imei || "Chờ cập nhật"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                        {req.note ? <span title={req.note}>{req.note}</span> : <span className="italic text-gray-400">Không có ghi chú</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => { setSelectedTradeIn(req); setValuation({price: "", techNote: "", phoneModelId: "", imei: ""}); }} 
                          className="text-purple-700 bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors"
                        >
                          <Calculator className="w-4 h-4" /> Định giá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && tradeInRequests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Không có yêu cầu định giá nào đang chờ...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS CỦA TAB REPAIR */}
      {/* ================================================================= */}
      {showDetailsModal && selectedOrder && activeTab === "REPAIR" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden m-4 flex flex-col">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Chi tiết đơn sửa chữa #{filteredOrders.findIndex(o => o._id === selectedOrder._id) + 1}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{dayjs(selectedOrder.repairOrderDate).format('DD/MM/YYYY HH:mm')}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-red-600"><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> <span>{selectedOrder.customerName}</span></div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> <span>{selectedOrder.customerPhone}</span></div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Thông tin cửa hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Store className="w-4 h-4 text-gray-400" /> <span>{selectedOrder.storeId?.name || 'N/A'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-gray-500">Mã cửa hàng:</span> <span>{selectedOrder.storeId?.code || 'N/A'}</span></div>
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
                              <p className="text-sm text-gray-600">{detail.serviceId.price?.toLocaleString('vi-VN') || 0} đ</p>
                            </div>
                          )}
                          {detail.targetPhoneId && (
                            <div>
                              <span className="text-sm text-gray-500">Thiết bị:</span>
                              <p className="font-medium">{detail.targetPhoneId.phoneModelId?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-600">IMEI: {detail.targetPhoneId.imei || 'N/A'}</p>
                            </div>
                          )}
                          {detail.itemIds && detail.itemIds.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-sm text-gray-500">Linh kiện:</span>
                              <div className="mt-1 space-y-1">
                                {detail.itemIds.map((item, itemIndex) => (
                                  <div key={itemIndex} className="text-sm">
                                    <span className="font-medium">{item.name}</span>
                                    {item.serialCode && <span className="text-gray-600 ml-2">(SN: {item.serialCode})</span>}
                                    <span className="text-gray-600 ml-2">{item.price?.toLocaleString('vi-VN') || 0} đ</span>
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
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
              <span className="text-xl font-bold text-blue-600">{selectedOrder.totalPrice?.toLocaleString('vi-VN') || 0} đ</span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS CỦA TAB TRADE IN */}
      {/* ================================================================= */}
      {selectedTradeIn && activeTab === "TRADE_IN" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-0 rounded-2xl w-[500px] shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="text-xl font-bold text-gray-800">Định giá thiết bị</h3>
              <button onClick={() => setSelectedTradeIn(null)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <p className="text-sm text-orange-800 font-medium">Ghi chú từ Sale:</p>
                  <p className="text-sm text-orange-600 italic mt-1">{selectedTradeIn.note || "Không có ghi chú"}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Dòng máy <span className="text-red-500">*</span></label>
                <select value={valuation.phoneModelId} onChange={e => setValuation({...valuation, phoneModelId: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50">
                  <option value="">-- Chọn dòng máy --</option>
                  {phoneModels.map(pm => (<option key={pm._id} value={pm._id}>{pm.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Số IMEI thiết bị <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Bấm *#06# trên máy để xem" value={valuation.imei} onChange={e => setValuation({...valuation, imei: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 font-mono" />
              </div>

              <div>
                  <label className="block font-bold text-gray-700 mb-1">Kết quả test / Lý do trừ tiền</label>
                  <textarea value={valuation.techNote} onChange={e => setValuation({...valuation, techNote: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500" placeholder="VD: Pin chai, vỏ móp, màn hình xước..." rows="3"></textarea>
              </div>

              <div>
                  <label className="block font-bold text-gray-700 mb-1">CHỐT GIÁ THU MUA (VND) <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={20}/>
                      <input type="number" value={valuation.price} onChange={e => setValuation({...valuation, price: e.target.value})} className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:border-purple-600 text-xl font-black text-purple-700" placeholder="0" />
                  </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-3 bg-gray-50 sticky bottom-0">
                <button onClick={() => setSelectedTradeIn(null)} className="flex-1 bg-white border border-gray-300 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100">Hủy</button>
                <button onClick={submitValuation} className="flex-1 bg-purple-600 py-3 rounded-xl font-bold text-white shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2 transition-transform hover:-translate-y-1">
                    <CheckCircle size={20}/> CHỐT GIÁ
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairOrderList;