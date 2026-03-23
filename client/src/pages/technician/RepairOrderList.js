import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { 
  Calendar, User, Phone, Store, CheckCircle, Clock, XCircle, AlertCircle, 
  Eye, Filter, Play, Ban, Wrench, Calculator, DollarSign, X, 
  Settings, Hammer, Scissors, Save, Plus, Trash2, Package 
} from "lucide-react";
import dayjs from "dayjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RepairOrderList = () => {
  // SET TAB MẶC ĐỊNH LÀ ĐỊNH GIÁ THU MUA
  const [activeTab, setActiveTab] = useState("TRADE_IN"); 

  // =========================================================================
  // STATE: TRADE IN (ĐỊNH GIÁ THU MUA)
  // =========================================================================
  const [tradeInRequests, setTradeInRequests] = useState([]);
  const [selectedTradeIn, setSelectedTradeIn] = useState(null);
  const [phoneModels, setPhoneModels] = useState([]);
  const [valuation, setValuation] = useState({ price: "", techNote: "", phoneModelId: "", imei: "", battery: "", appearance: "", screen: "", camera: "", capacity: "", colorName: "" });

  // =========================================================================
  // STATE: WAITING DECISION (CHỜ QUYẾT ĐỊNH XỬ LÝ - TÂN TRANG / RÃ XÁC)
  // =========================================================================
  const [waitingPhones, setWaitingPhones] = useState([]);
  const [selectedDecisionPhone, setSelectedDecisionPhone] = useState(null);
  const [decision, setDecision] = useState("SELL"); 
  const [itemTypes, setItemTypes] = useState([]);
  const [sellForm, setSellForm] = useState({ sellingPrice: "", capacity: "", colorName: "" });
  const [dismantleParts, setDismantleParts] = useState([]);

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
  const [filters, setFilters] = useState({ status: 'ALL', type: 'ALL', storeId: 'ALL', customerName: '' });

  // =========================================================================
  // EFFECTS ĐIỀU HƯỚNG TABS
  // =========================================================================
  useEffect(() => {
    if (activeTab === "TRADE_IN") {
      fetchTradeInRequests();
      fetchPhoneModels();
    } else if (activeTab === "WAITING_DECISION") {
      fetchWaitingPhones();
      fetchItemTypes();
    } else if (activeTab === "REPAIR") {
      fetchRepairOrders();
      fetchStores();
    }
  }, [activeTab]);

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
    } catch (err) { setError("Lỗi lấy danh sách định giá"); } finally { setLoading(false); }
  };

  const submitValuationDetailed = async (req) => {
    if(!valuation.phoneModelId) return toast.error("Vui lòng chọn dòng máy!");
    if(!valuation.price) return toast.error("Vui lòng nhập giá thu mua!");
    
    const reportNote = `[BÁO CÁO KỸ THUẬT]\n- Cấu hình: ${valuation.colorName || "N/A"} | ${valuation.capacity || "N/A"}\n- Ngoại hình: ${valuation.appearance || "Chưa đánh giá"}\n- Pin: ${valuation.battery || "Chưa đánh giá"}\n- Màn hình: ${valuation.screen || "Chưa đánh giá"}\n- Camera: ${valuation.camera || "Chưa đánh giá"}\n- Ghi chú lỗi: ${valuation.techNote || "Không có lỗi."}`;

    try {
      const payload = {
        totalPrice: Number(valuation.price), 
        status: "Pending",
        note: reportNote,
        tempPhoneData: { phoneModelId: valuation.phoneModelId, capacity: valuation.capacity, colorName: valuation.colorName }
      };

      await axiosClient.put(`/purchase-orders/${req._id}`, payload);
      toast.success("Đã lưu báo cáo định giá chi tiết!");
      setSelectedTradeIn(null);
      setValuation({ price: "", techNote: "", phoneModelId: "", battery: "", appearance: "", screen: "", camera: "", capacity: "", colorName: "" });
      fetchTradeInRequests();
    } catch(err) { toast.error("Lỗi cập nhật báo cáo định giá"); }
  };

  // =========================================================================
  // FUNCTIONS: WAITING DECISION (CHỜ QUYẾT ĐỊNH XỬ LÝ)
  // =========================================================================
  const fetchWaitingPhones = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/phones?status=waiting_for_tech_decision");
      setWaitingPhones(Array.isArray(res.data) ? res.data : res.data.data || []);
      setError(null);
    } catch (err) { setError("Lỗi tải danh sách chờ quyết định"); } finally { setLoading(false); }
  };

  const fetchItemTypes = async () => {
    try {
      const res = await axiosClient.get("/item_types");
      setItemTypes(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) { console.log("Lỗi tải loại linh kiện"); }
  };

  const addPartRow = () => {
    setDismantleParts([...dismantleParts, { itemTypeId: "", name: "", serialCode: "", quality: "Zin bóc máy", ram: "", capacity: "", color: "", baseCost: "", price: "" }]);
  };
  const removePartRow = (index) => setDismantleParts(dismantleParts.filter((_, i) => i !== index));
  const handlePartChange = (index, field, value) => {
    const newParts = [...dismantleParts];
    newParts[index][field] = value;
    setDismantleParts(newParts);
  };

  const handleDecisionSubmit = async () => {
    if (decision === "SELL" && !sellForm.sellingPrice) return toast.error("Vui lòng nhập giá bán!");
    if (decision === "DISMANTLE") {
        if (dismantleParts.length === 0) return toast.error("Vui lòng thêm ít nhất 1 linh kiện!");
        if (dismantleParts.some(p => !p.itemTypeId || !p.name)) return toast.error("Vui lòng nhập Loại và Tên cho tất cả linh kiện!");
    }

    try {
      const payload = {
        decision,
        ...sellForm,
        parts: dismantleParts,
        phoneName: selectedDecisionPhone.phoneModelId?.name
      };

      await axiosClient.put(`/phones/${selectedDecisionPhone._id}/tech-decision`, payload);
      toast.success("Xử lý thành công! Máy/Linh kiện đã vào kho.");
      setSelectedDecisionPhone(null);
      fetchWaitingPhones();
    } catch (err) { toast.error("Lỗi cập nhật quyết định"); }
  };

  // =========================================================================
  // FUNCTIONS: REPAIR ORDERS (SỬA CHỮA)
  // =========================================================================
  const fetchStores = async () => {
    try {
      const response = await axiosClient.get('/stores');
      const storesData = response.data?.data || response.data || [];
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (err) { console.error("Error fetching stores:", err); setStores([]); }
  };

  const fetchRepairOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/repair-orders');
      setOrders(response.data);
      setFilteredOrders(response.data);
      setError(null);
    } catch (err) { setError("Không thể tải danh sách đơn sửa chữa"); } finally { setLoading(false); }
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
    } catch (err) { setError("Không thể tải danh sách lọc"); } finally { setFilterLoading(false); }
  };

  const handleFilterChange = (filterType, value) => setFilters(prev => ({ ...prev, [filterType]: value }));
  const applyFilters = () => fetchFilteredOrders();
  const resetFilters = () => { setFilters({ status: 'ALL', type: 'ALL', storeId: 'ALL' }); setFilteredOrders(orders); };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    try {
      const response = await axiosClient.get(`/repair-orders/${order._id}/details`);
      setOrderDetails(response.data);
    } catch (err) { setOrderDetails([]); }
  };

  const acceptRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/accept`);
      const updateOrderStatus = (orderList) => orderList.map(order => order._id === orderId ? { ...order, status: "In Progress" } : order);
      setOrders(updateOrderStatus(orders)); setFilteredOrders(updateOrderStatus(filteredOrders));
      toast.success(response.data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Không thể chấp nhận đơn"); }
  };

  const cancelRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/cancel`);
      const updateOrderStatus = (orderList) => orderList.map(order => order._id === orderId ? { ...order, status: "Cancelled" } : order);
      setOrders(updateOrderStatus(orders)); setFilteredOrders(updateOrderStatus(filteredOrders));
      toast.success(response.data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Không thể hủy đơn"); }
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
  // RENDER
  // =========================================================================
  if (loading && orders.length === 0 && waitingPhones.length === 0 && tradeInRequests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* HEADER & TABS ĐÃ ĐƯỢC SẮP XẾP LẠI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wrench className="text-blue-600" /> Quản lý Hàng chờ Kỹ thuật
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("TRADE_IN")}
            className={`pb-2 px-2 text-lg font-bold transition-all border-b-4 ${
              activeTab === "TRADE_IN" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Định giá thu mua
          </button>

          <button
            onClick={() => setActiveTab("WAITING_DECISION")}
            className={`pb-2 px-2 text-lg font-bold transition-all border-b-4 ${
              activeTab === "WAITING_DECISION" ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Chờ xử lý (Nhập kho)
          </button>

          <button
            onClick={() => setActiveTab("REPAIR")}
            className={`pb-2 px-2 text-lg font-bold transition-all border-b-4 ${
              activeTab === "REPAIR" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Khách chờ sửa chữa
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <p>{error}</p>
          <button 
            onClick={() => {
              if (activeTab === "TRADE_IN") fetchTradeInRequests();
              else if (activeTab === "WAITING_DECISION") fetchWaitingPhones();
              else fetchRepairOrders();
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-bold text-sm"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 1: TRADE IN (ĐỊNH GIÁ THU MUA) */}
      {/* ================================================================= */}
      {activeTab === "TRADE_IN" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full"><Wrench className="w-8 h-8 text-purple-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">Danh sách cần định giá</h3>
                <p className="text-purple-700">Tổng số: {tradeInRequests.length} máy đang chờ Kỹ thuật test và chốt giá</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thiết bị dự kiến</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú từ Sale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tradeInRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">#{req._id.substring(req._id.length - 6).toUpperCase()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {dayjs(req.createdAt).format('DD/MM/YYYY HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.customerName}</div>
                        {req.customerPhone && <div className="flex items-center gap-1 text-gray-500 mt-1"><Phone className="w-3 h-3" /> {req.customerPhone}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-bold text-gray-900">{req.tempPhoneData?.phoneModelId?.name || "Sale chưa nhập"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                        {req.note ? <span title={req.note}>{req.note}</span> : <span className="italic text-gray-400">Không có</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => { setSelectedTradeIn(req); setValuation({price: "", techNote: "", phoneModelId: "", battery: "", appearance: "", screen: "", camera: "", capacity: "", colorName: ""}); }} 
                          className="text-purple-700 bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-lg inline-flex items-center gap-2 font-bold transition-colors"
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
      {/* TAB 2: WAITING_DECISION (CHỜ QUYẾT ĐỊNH XỬ LÝ) */}
      {/* ================================================================= */}
      {activeTab === "WAITING_DECISION" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Settings className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-900">Danh sách thiết bị chờ Quyết định Kỹ thuật</h3>
                <p className="text-orange-700">Tổng số: {waitingPhones.length} máy thu cũ đang chờ phân loại (Tân trang / Rã xác)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mã máy</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian nhập</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dòng máy</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Giá vốn thu mua</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waitingPhones.map((phone) => (
                    <tr key={phone._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                        #{phone._id.substring(phone._id.length - 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {dayjs(phone.createdAt).format('DD/MM/YYYY')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{phone.phoneModelId?.name || "Máy chưa rõ"}</div>
                        <div className="text-xs text-gray-500 mt-1">Màu: {phone.colorName} - {phone.capacity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(phone.importPrice || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold uppercase bg-orange-100 text-orange-800">
                          <Settings size={14}/> Chờ quyết định
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button 
                          onClick={() => { 
                            setSelectedDecisionPhone(phone); 
                            setDecision("SELL"); 
                            setSellForm({ sellingPrice: "", capacity: phone.capacity || "", colorName: phone.colorName || "" });
                            setDismantleParts([]);
                          }} 
                          className="text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                        >
                          Xử lý ngay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && waitingPhones.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-50" />
                <p>Tuyệt vời! Không còn máy nào đang chờ xử lý.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: REPAIR ORDERS (SỬA CHỮA) */}
      {/* ================================================================= */}
      {activeTab === "REPAIR" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ALL">Tất cả</option>
                  <option value="Pending">Chờ xử lý</option>
                  <option value="In Progress">Đang xử lý</option>
                  <option value="Completed">Hoàn thành</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại sửa chữa</label>
                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ALL">Tất cả</option>
                  <option value="REPAIR">Sửa chữa</option>
                  <option value="WARRANTY">Bảo hành</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cửa hàng</label>
                <select value={filters.storeId} onChange={(e) => handleFilterChange('storeId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">#{String(index + 1).padStart(4, '0')}</td>
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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button onClick={() => handleViewDetails(order)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100" title="Chi tiết"><Eye size={18} /></button>
                          {order.status === "Pending" && (
                            <button onClick={() => acceptRepairOrder(order._id)} className="text-green-600 bg-green-50 p-2 rounded-lg hover:bg-green-100" title="Chấp nhận"><Play size={18} /></button>
                          )}
                          {(order.status === "Pending" || order.status === "In Progress") && (
                            <button onClick={() => cancelRepairOrder(order._id)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100" title="Hủy bỏ"><Ban size={18} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOrders.length === 0 && !filterLoading && (
              <div className="text-center py-12 text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Không có đơn sửa chữa nào phù hợp</p></div>
            )}
          </div>
        </div>
      )}


      {/* ================================================================= */}
      {/* MODALS CỦA TAB TRADE IN (ĐỊNH GIÁ) */}
      {/* ================================================================= */}
      {selectedTradeIn && activeTab === "TRADE_IN" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-0 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Định giá chi tiết thiết bị</h3>
                <p className="text-xs text-gray-500 mt-1">Khách hàng: {selectedTradeIn.customerName} - {selectedTradeIn.customerPhone}</p>
              </div>
              <button onClick={() => setSelectedTradeIn(null)} className="text-gray-400 hover:text-red-500 bg-white p-1 border rounded-md shadow-sm"><X size={20}/></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6 shadow-sm">
                  <p className="text-xs text-orange-800 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <User size={14}/> Ghi chú tình trạng từ Sale:
                  </p>
                  <p className="text-sm text-orange-700 italic">{selectedTradeIn.note || "Sale không để lại ghi chú nào."}</p>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <h4 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase">1. Thông tin cấu hình</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Dòng máy <span className="text-red-500">*</span></label>
                      <select value={valuation.phoneModelId} onChange={e => setValuation({...valuation, phoneModelId: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white">
                        <option value="">-- Chọn dòng máy --</option>
                        {phoneModels.map(pm => (<option key={pm._id} value={pm._id}>{pm.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Màu sắc</label>
                      <input type="text" placeholder="VD: Đen, Titan..." value={valuation.colorName || ""} onChange={e => setValuation({...valuation, colorName: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Dung lượng / RAM</label>
                      <input type="text" placeholder="VD: 256GB / 8GB RAM" value={valuation.capacity || ""} onChange={e => setValuation({...valuation, capacity: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <h4 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase">2. Tình trạng linh kiện & Ngoại hình</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Tình trạng Pin (%)</label>
                      <input type="text" placeholder="VD: Pin zin 85%, Pin thay, Pin bảo trì..." value={valuation.battery || ""} onChange={e => setValuation({...valuation, battery: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Ngoại hình</label>
                      <select value={valuation.appearance || ""} onChange={e => setValuation({...valuation, appearance: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                        <option value="">-- Đánh giá ngoại hình --</option>
                        <option value="Đẹp keng 99%">Đẹp keng 99%</option>
                        <option value="Xước lông mèo 98%">Xước dăm lông mèo 98%</option>
                        <option value="Cấn móp nhẹ 95%">Cấn móp xước xát 95%</option>
                        <option value="Vỏ xấu">Vỏ xấu cần thay</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Màn hình</label>
                      <input type="text" placeholder="VD: Màn zin đẹp, Lưu ảnh nhẹ, Ép kính..." value={valuation.screen || ""} onChange={e => setValuation({...valuation, screen: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Camera & Cảm biến</label>
                      <input type="text" placeholder="VD: Bụi cam, FaceID bình thường..." value={valuation.camera || ""} onChange={e => setValuation({...valuation, camera: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">Chi tiết lỗi / Lý do trừ tiền</label>
                      <textarea value={valuation.techNote} onChange={e => setValuation({...valuation, techNote: e.target.value})} className="w-full p-2.5 border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white" placeholder="Ghi chú thêm về các chức năng bị lỗi..." rows="3"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-purple-900 mb-1">CHỐT GIÁ THU MUA (VND) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 text-gray-400" size={20}/>
                            <input type="number" value={valuation.price} onChange={e => setValuation({...valuation, price: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border-2 border-purple-300 rounded-lg outline-none focus:border-purple-600 text-2xl font-black text-purple-700 bg-white" placeholder="0" />
                        </div>
                        <p className="text-[10px] text-purple-600 mt-2 italic">* Giá này sẽ được báo lại cho Sale để chốt với Khách Hàng.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex justify-end gap-4 bg-white rounded-b-2xl">
                <button onClick={() => setSelectedTradeIn(null)} className="px-8 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
                <button onClick={() => submitValuationDetailed(selectedTradeIn)} className="px-8 py-3 bg-purple-600 rounded-xl font-black text-white shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2 transition-transform hover:-translate-y-1">
                    <CheckCircle size={20}/> LƯU BÁO CÁO & CHỐT GIÁ
                </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS CỦA TAB WAITING_DECISION (XỬ LÝ TÂN TRANG / RÃ XÁC) */}
      {/* ================================================================= */}
      {selectedDecisionPhone && activeTab === "WAITING_DECISION" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                Xử lý thiết bị: <span className="text-orange-600">{selectedDecisionPhone.phoneModelId?.name}</span> 
                <span className="text-sm font-mono text-gray-500 ml-2">(#{selectedDecisionPhone._id.substring(selectedDecisionPhone._id.length - 6).toUpperCase()})</span>
              </h3>
              <button onClick={() => setSelectedDecisionPhone(null)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-md border"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => setDecision("SELL")} 
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${decision === "SELL" ? "border-green-500 bg-green-50 text-green-700 shadow-sm" : "border-gray-200 bg-white text-gray-400 hover:border-green-300"}`}
                >
                  <Hammer size={20}/> TÂN TRANG / SỬA ĐỂ BÁN
                </button>
                <button 
                  onClick={() => setDecision("DISMANTLE")} 
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${decision === "DISMANTLE" ? "border-red-500 bg-red-50 text-red-700 shadow-sm" : "border-gray-200 bg-white text-gray-400 hover:border-red-300"}`}
                >
                  <Scissors size={20}/> RÃ XÁC LẤY LINH KIỆN
                </button>
              </div>

              {decision === "SELL" ? (
                <div className="space-y-4 bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Dung lượng</label>
                      <input type="text" placeholder="VD: 128GB" value={sellForm.capacity} onChange={e => setSellForm({...sellForm, capacity: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"/>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Màu sắc</label>
                      <input type="text" placeholder="VD: Đen" value={sellForm.colorName} onChange={e => setSellForm({...sellForm, colorName: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"/>
                    </div>
                  </div>
                  <div className="pt-4 border-t mt-4">
                    <label className="block font-black text-gray-800 mb-2">GIÁ NIÊM YẾT BÁN RA (VNĐ) <span className="text-red-500">*</span></label>
                    <input type="number" placeholder="Nhập giá tiền..." value={sellForm.sellingPrice} onChange={e => setSellForm({...sellForm, sellingPrice: e.target.value})} className="w-full p-4 border-2 border-green-200 rounded-lg outline-none focus:border-green-500 text-2xl font-black text-green-700"/>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-red-100">
                    <label className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                        <Package size={22} className="text-red-600"/> Danh sách linh kiện rã được
                    </label>
                    <button onClick={addPartRow} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-red-100 transition">
                      <Plus size={16}/> Thêm linh kiện
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                      {dismantleParts.map((part, idx) => (
                        <div key={idx} className="p-5 rounded-xl border border-gray-200 relative group bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <button onClick={() => removePartRow(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white hover:bg-red-500 border p-2 rounded-full transition shadow-sm">
                                <Trash2 size={16}/>
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mr-12 mb-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Loại linh kiện *</label>
                                    <select value={part.itemTypeId} onChange={(e) => handlePartChange(idx, "itemTypeId", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500">
                                        <option value="">-- Chọn --</option>
                                        {itemTypes.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tên hiển thị *</label>
                                    <input type="text" placeholder="VD: Mainboard iPhone 14 Pro (Zin bóc máy)" value={part.name} onChange={(e) => handlePartChange(idx, "name", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Serial (SN)</label>
                                    <input type="text" placeholder="Auto tạo nếu trống" value={part.serialCode} onChange={(e) => handlePartChange(idx, "serialCode", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tình trạng</label>
                                    <input type="text" placeholder="VD: Zin keng" value={part.quality} onChange={(e) => handlePartChange(idx, "quality", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Dung lượng</label>
                                    <input type="text" placeholder="VD: 256GB" value={part.capacity} onChange={(e) => handlePartChange(idx, "capacity", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">RAM</label>
                                    <input type="text" placeholder="VD: 6GB" value={part.ram} onChange={(e) => handlePartChange(idx, "ram", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-red-50 p-4 rounded-lg border border-red-100">
                                <div>
                                    <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Màu sắc</label>
                                    <input type="text" placeholder="VD: Tím..." value={part.color} onChange={(e) => handlePartChange(idx, "color", e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Giá vốn (VND)</label>
                                    <input type="number" placeholder="0" value={part.baseCost} onChange={(e) => handlePartChange(idx, "baseCost", e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-800 bg-white"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-red-600 uppercase mb-1.5">Giá bán lẻ (VND) *</label>
                                    <input type="number" placeholder="0" value={part.price} onChange={(e) => handlePartChange(idx, "price", e.target.value)} className="w-full p-2 border-2 border-red-200 rounded-lg outline-none focus:border-red-500 font-black text-red-600 bg-white"/>
                                </div>
                            </div>
                        </div>
                      ))}
                      {dismantleParts.length === 0 && (
                          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-red-200">
                              <Scissors className="mx-auto h-8 w-8 text-red-300 mb-2"/>
                              <p className="text-gray-500 font-medium">Bấm "Thêm linh kiện" để nhập chi tiết các món rã được</p>
                          </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex justify-end gap-4 bg-white rounded-b-2xl">
              <button onClick={() => setSelectedDecisionPhone(null)} className="px-8 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">Hủy</button>
              <button onClick={handleDecisionSubmit} className={`px-8 py-3 rounded-xl font-black text-white flex justify-center items-center gap-2 shadow-lg transition-transform hover:-translate-y-1 ${decision === "SELL" ? "bg-green-600 hover:bg-green-700 shadow-green-200" : "bg-red-600 hover:bg-red-700 shadow-red-200"}`}>
                <Save size={20}/> XÁC NHẬN LƯU KHO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS CỦA TAB REPAIR (XEM CHI TIẾT SỬA CHỮA) */}
      {/* ================================================================= */}
      {showDetailsModal && selectedOrder && activeTab === "REPAIR" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-start bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Chi tiết đơn sửa chữa #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{dayjs(selectedOrder.repairOrderDate).format('DD/MM/YYYY HH:mm')}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-red-600 bg-white p-1 rounded-md shadow-sm border">
                <X size={20} />
              </button>
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
                    <div className="flex items-center gap-2"><span className="text-gray-500">Mã cửa hàng:</span> <span className="font-mono">{selectedOrder.storeId?.code || 'N/A'}</span></div>
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
                              <p className="text-xs text-gray-500 font-mono mt-1">Mã: {detail.targetPhoneId._id?.substring(detail.targetPhoneId._id.length - 6).toUpperCase() || 'N/A'}</p>
                            </div>
                          )}
                          {detail.itemIds && detail.itemIds.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-sm text-gray-500">Linh kiện thay thế:</span>
                              <div className="mt-2 space-y-2 border-t pt-2">
                                {detail.itemIds.map((item, itemIndex) => (
                                  <div key={itemIndex} className="text-sm flex justify-between bg-white p-2 rounded border">
                                    <span className="font-medium">{item.name} <span className="text-xs text-gray-400 font-normal ml-2">(SN: {item.serialCode})</span></span>
                                    <span className="text-gray-800 font-bold">{item.price?.toLocaleString('vi-VN') || 0} đ</span>
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
                  <p className="text-gray-500 text-center py-4 italic">Không có chi tiết dịch vụ</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
              <span className="text-2xl font-black text-blue-600">{selectedOrder.totalPrice?.toLocaleString('vi-VN') || 0} đ</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RepairOrderList;