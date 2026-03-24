import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { Wrench } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { fetchRepairOrders, completeRepairOrder } from "../../api/repairOrder";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../../components/technician/shared/LoadingSpinner";
import TabNavigation from "../../components/technician/TabNavigation";
import TradeInTab from "../../components/technician/trade-in/TradeInTab";
import WaitingDecisionTab from "../../components/technician/waiting-decision/WaitingDecisionTab";
import RepairOrdersTab from "../../components/technician/repair-orders/RepairOrdersTab";

const RepairOrderList = () => {
  const [activeTab, setActiveTab] = useState("TRADE_IN"); 

  // =========================================================================
  // STATE: TRADE IN (ĐỊNH GIÁ THU MUA)
  // =========================================================================
  const [tradeInRequests, setTradeInRequests] = useState([]);
  const [selectedTradeIn, setSelectedTradeIn] = useState(null);
  const [phoneModels, setPhoneModels] = useState([]);
  
  // State Thông tin cơ bản
  const [valuation, setValuation] = useState({ 
    price: "", techNote: "", phoneModelId: "", colorName: "", capacity: "", ram: "" 
  });

  const initialChecklist = {
    screen: { name: "Màn hình", status: "OK", detail: "95%" },
    battery: { name: "Pin", status: "OK", detail: "95%" },
    camera: { name: "Camera & FaceID", status: "OK", detail: "95%" },
    mainboard: { name: "Mainboard", status: "OK", detail: "95%" },
    casing: { name: "Vỏ / Ngoại hình", status: "OK", detail: "95%" },
  };
  const [checklist, setChecklist] = useState(initialChecklist);

  const isBasicInfoFilled = valuation.phoneModelId && valuation.colorName && valuation.capacity && valuation.ram;

  // =========================================================================
  // STATE: WAITING DECISION & REPAIR ORDERS 
  // =========================================================================
  const [waitingPhones, setWaitingPhones] = useState([]);
  const [selectedDecisionPhone, setSelectedDecisionPhone] = useState(null);
  const [decision, setDecision] = useState("SELL"); 
  const [itemTypes, setItemTypes] = useState([]);
  const [sellForm, setSellForm] = useState({ sellingPrice: "", capacity: "", colorName: "" });
  const [dismantleParts, setDismantleParts] = useState([]);

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

  const handleChecklistChange = (key, field, value) => {
    setChecklist(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const submitValuationDetailed = async (req) => {
    if(!valuation.phoneModelId || !valuation.colorName || !valuation.capacity || !valuation.ram) {
      return toast.error("Vui lòng điền đủ thông tin Dòng máy, Màu sắc, Dung lượng và RAM!");
    }
    if(!valuation.price) return toast.error("Vui lòng chốt giá thu mua!");
    
    const checklistStr = Object.values(checklist)
      .map(item => `- ${item.name}: ${item.status === 'OK' ? 'Hoạt động tốt' : `Kém/Hỏng (${item.detail})`}`)
      .join('\n');

    const reportNote = `[BÁO CÁO KỸ THUẬT]
    - Cấu hình: Màu ${valuation.colorName} | ${valuation.capacity} | ${valuation.ram} RAM
    ${checklistStr}
    - Ghi chú thêm: ${valuation.techNote || "Không có"}`;

    try {
      const payload = {
        totalPrice: Number(valuation.price), 
        status: "Pending",
        note: reportNote,
        tempPhoneData: { 
          phoneModelId: valuation.phoneModelId, 
          capacity: valuation.capacity, 
          colorName: valuation.colorName,
          ram: valuation.ram
        }
      };

      await axiosClient.put(`/purchase-orders/${req._id}`, payload);
      toast.success("Đã lưu báo cáo định giá chi tiết!");
      setSelectedTradeIn(null);
      fetchTradeInRequests();
    } catch(err) { toast.error("Lỗi cập nhật báo cáo định giá"); }
  };

  // =========================================================================
  // CÁC HÀM CỦA WAITING DECISION VÀ REPAIR
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
      const payload = { decision, ...sellForm, parts: dismantleParts, phoneName: selectedDecisionPhone.phoneModelId?.name };
      await axiosClient.put(`/phones/${selectedDecisionPhone._id}/tech-decision`, payload);
      toast.success("Xử lý thành công! Máy/Linh kiện đã vào kho.");
      setSelectedDecisionPhone(null);
      fetchWaitingPhones();
    } catch (err) { toast.error("Lỗi cập nhật quyết định"); }
  };

  const fetchStores = async () => {
    try {
      const response = await axiosClient.get('/stores');
      const storesData = response.data?.data || response.data || [];
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (err) { setStores([]); }
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
    } catch (err) { setError("Lỗi lọc đơn"); } finally { setFilterLoading(false); }
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

  const handleOrderUpdate = async () => {
    if (selectedOrder) {
      try {
        const response = await axiosClient.get(`/repair-orders/${selectedOrder._id}/details`);
        setOrderDetails(response.data);
        // Also update the selected order to reflect any changes
        const orderResponse = await axiosClient.get(`/repair-orders/${selectedOrder._id}`);
        setSelectedOrder(orderResponse.data);
      } catch (err) {
        setOrderDetails([]);
      }
    }
  };

  const acceptRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/accept`);
      const updateOrderStatus = (orderList) => orderList.map(order => order._id === orderId ? { ...order, status: "In Progress" } : order);
      setOrders(updateOrderStatus(orders)); setFilteredOrders(updateOrderStatus(filteredOrders));
      toast.success(response.data.message);
    } catch (error) { toast.error("Không thể chấp nhận đơn"); }
  };

  const cancelRepairOrder = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/cancel`);
      const updateOrderStatus = (orderList) => orderList.map(order => order._id === orderId ? { ...order, status: "Cancelled" } : order);
      setOrders(updateOrderStatus(orders)); setFilteredOrders(updateOrderStatus(filteredOrders));
      toast.success(response.data.message);
    } catch (error) { toast.error("Không thể hủy đơn"); }
  };

  const completeRepairOrderHandler = async (orderId) => {
    try {
      const response = await axiosClient.put(`/repair-orders/${orderId}/complete`);
      const updateOrderStatus = (orderList) => orderList.map(order => order._id === orderId ? { ...order, status: "Completed" } : order);
      setOrders(updateOrderStatus(orders)); setFilteredOrders(updateOrderStatus(filteredOrders));
      toast.success(response.data.message);
    } catch (error) { toast.error("Không thể hoàn thành đơn"); }
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  if (loading && orders.length === 0 && waitingPhones.length === 0 && tradeInRequests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="md" text="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wrench className="text-blue-600" /> Quản lý Hàng chờ Kỹ thuật
        </h2>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* ================================================================= */}
      {/* TAB 1: TRADE IN (ĐỊNH GIÁ THU MUA) */}
      {/* ================================================================= */}
      {activeTab === "TRADE_IN" && (
        <TradeInTab 
          tradeInRequests={tradeInRequests}
          loading={loading}
          selectedTradeIn={selectedTradeIn}
          valuation={valuation}
          checklist={checklist}
          phoneModels={phoneModels}
          isBasicInfoFilled={isBasicInfoFilled}
          onValuate={(req) => {
            setSelectedTradeIn(req);
            setValuation({ price: "", techNote: "", phoneModelId: "", capacity: "", colorName: "", ram: "" });
            setChecklist(initialChecklist);
          }}
          onCloseModal={() => setSelectedTradeIn(null)}
          onValuationChange={setValuation}
          onChecklistChange={handleChecklistChange}
          onSubmit={submitValuationDetailed}
        />
      )}

      {/* ================================================================= */}
      {/* TAB 2: WAITING_DECISION (CHỜ QUYẾT ĐỊNH XỬ LÝ) */}
      {/* ================================================================= */}
      {activeTab === "WAITING_DECISION" && (
        <WaitingDecisionTab 
          waitingPhones={waitingPhones}
          loading={loading}
          selectedDecisionPhone={selectedDecisionPhone}
          decision={decision}
          sellForm={sellForm}
          dismantleParts={dismantleParts}
          itemTypes={itemTypes}
          onProcess={(phone) => {
            setSelectedDecisionPhone(phone);
            setDecision("SELL");
            setSellForm({ sellingPrice: "", capacity: phone.capacity || "", colorName: phone.colorName || "" });
            setDismantleParts([]);
          }}
          onCloseModal={() => setSelectedDecisionPhone(null)}
          onDecisionChange={setDecision}
          onSellFormChange={setSellForm}
          onAddPart={addPartRow}
          onRemovePart={removePartRow}
          onPartChange={handlePartChange}
          onSubmit={handleDecisionSubmit}
        />
      )}

      {/* ================================================================= */}
      {/* TAB 3: REPAIR ORDERS (SỬA CHỮA) */}
      {/* ================================================================= */}
      {activeTab === "REPAIR" && (
        <RepairOrdersTab 
          filteredOrders={filteredOrders}
          filters={filters}
          stores={stores}
          filterLoading={filterLoading}
          selectedOrder={selectedOrder}
          orderDetails={orderDetails}
          showDetailsModal={showDetailsModal}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
          onViewDetails={handleViewDetails}
          onAccept={acceptRepairOrder}
          onCancel={cancelRepairOrder}
          onComplete={completeRepairOrderHandler}
          onCloseDetailsModal={() => setShowDetailsModal(false)}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
};

export default RepairOrderList;
