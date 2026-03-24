import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { Wrench } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
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
  const [valuation, setValuation] = useState({ price: "", techNote: "", phoneModelId: "", colorName: "", capacity: "", ram: "" });

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
  // STATE: WAITING DECISION (XỬ LÝ MÁY THU CŨ)
  // =========================================================================
  const [waitingPhones, setWaitingPhones] = useState([]);
  const [selectedDecisionPhone, setSelectedDecisionPhone] = useState(null);
  const [decision, setDecision] = useState("DIRECT_IMPORT"); 
  const [itemTypes, setItemTypes] = useState([]);
  const [sellForm, setSellForm] = useState({ sellingPrice: "", capacity: "", colorName: "" });
  const [dismantleParts, setDismantleParts] = useState([]);
  const [replacementParts, setReplacementParts] = useState([]); 
  const [availablePartsInStock, setAvailablePartsInStock] = useState([]); 

  // =========================================================================
  // STATE: REPAIR ORDERS 
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
    } catch (error) { console.error(error); }
  };

  const fetchTradeInRequests = async () => {
    try { 
      setLoading(true); 
      const res = await axiosClient.get("/purchase-orders?orderType=PURCHASE&status=Pending_Tech"); 
      setTradeInRequests(Array.isArray(res.data) ? res.data : res.data.data || []); 
      setError(null); 
    } catch (err) { setError("Lỗi lấy danh sách"); } finally { setLoading(false); }
  };

  const handleChecklistChange = (key, field, value) => { 
    setChecklist(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } })); 
  };

  const submitValuationDetailed = async (req) => {
    if(!valuation.phoneModelId || !valuation.colorName || !valuation.capacity || !valuation.ram) return toast.error("Vui lòng điền đủ thông tin cấu hình!");
    if(!valuation.price) return toast.error("Vui lòng chốt giá thu mua!");
    
    const checklistStr = Object.values(checklist).map(item => `- ${item.name}: ${item.status === 'OK' ? 'Hoạt động tốt' : `Kém/Hỏng (${item.detail})`}`).join('\n');
    const reportNote = `[BÁO CÁO KỸ THUẬT]\n- Cấu hình: Màu ${valuation.colorName} | ${valuation.capacity} | ${valuation.ram} RAM\n${checklistStr}\n- Ghi chú thêm: ${valuation.techNote || "Không có"}`;
    
    try {
      const payload = { 
        totalPrice: Number(valuation.price), 
        status: "Pending", 
        note: reportNote, 
        tempPhoneData: { phoneModelId: valuation.phoneModelId, capacity: valuation.capacity, colorName: valuation.colorName, ram: valuation.ram } 
      };
      await axiosClient.put(`/purchase-orders/${req._id}`, payload);
      toast.success("Đã lưu báo cáo định giá!"); 
      setSelectedTradeIn(null); 
      fetchTradeInRequests();
    } catch(err) { toast.error("Lỗi cập nhật"); }
  };

  // =========================================================================
  // FUNCTIONS: WAITING DECISION
  // =========================================================================
  const fetchWaitingPhones = async () => {
    try { 
      setLoading(true); 
      const res = await axiosClient.get("/phones?status=waiting_for_tech_decision"); 
      setWaitingPhones(Array.isArray(res.data) ? res.data : res.data.data || []); 
      setError(null); 
    } catch (err) { setError("Lỗi lấy danh sách chờ quyết định"); } finally { setLoading(false); }
  };

  const fetchItemTypes = async () => {
    try { const res = await axiosClient.get("/item_types"); setItemTypes(Array.isArray(res.data) ? res.data : res.data.data || []); } catch (err) { console.log(err); } 
  };

  const fetchAvailablePartsForReplacement = async () => {
    try {
      const res = await axiosClient.get("/items?status=in_stock");
      setAvailablePartsInStock(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) { toast.error("Không thể lấy kho linh kiện"); }
  };

  const addPartRow = () => setDismantleParts([...dismantleParts, { itemTypeId: "", name: "", serialCode: "", quality: "Zin bóc máy", ram: "", capacity: "", color: "", baseCost: "", price: "" }]);
  const removePartRow = (index) => setDismantleParts(dismantleParts.filter((_, i) => i !== index));
  const handlePartChange = (index, field, value) => { const newParts = [...dismantleParts]; newParts[index][field] = value; setDismantleParts(newParts); };
  
  const handleDecisionSubmit = async () => {
    if (decision === "SELL" && !sellForm.sellingPrice) return toast.error("Vui lòng nhập giá bán!");
    if (decision === "DISMANTLE" && (dismantleParts.length === 0 || dismantleParts.some(p => !p.itemTypeId || !p.name))) return toast.error("Vui lòng nhập đủ thông tin rã xác!");
    try {
      const payload = { 
        decision, ...sellForm, parts: dismantleParts, 
        replacedItems: replacementParts.map(p => p._id),
        phoneName: selectedDecisionPhone.phoneModelId?.name 
      };
      await axiosClient.put(`/phones/${selectedDecisionPhone._id}/tech-decision`, payload);
      toast.success("Xử lý thành công! Máy/Linh kiện đã được luân chuyển kho.");
      setSelectedDecisionPhone(null);
      fetchWaitingPhones();
    } catch (err) { toast.error("Lỗi cập nhật quyết định"); }
  };

  // =========================================================================
  // FUNCTIONS: REPAIR (KHÁCH CHỜ SỬA CHỮA)
  // =========================================================================
  const fetchStores = async () => { try { const response = await axiosClient.get('/stores'); const storesData = response.data?.data || response.data || []; setStores(Array.isArray(storesData) ? storesData : []); } catch (err) { setStores([]); } };
  
  const fetchRepairOrders = async () => { try { setLoading(true); const response = await axiosClient.get('/repair-orders'); setOrders(response.data); setFilteredOrders(response.data); setError(null); } catch (err) { setError("Lỗi tải đơn"); } finally { setLoading(false); } };
  
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
    } catch (err) { setError("Lỗi lọc đơn"); } finally { setFilterLoading(false); } 
  };

  const handleFilterChange = (filterType, value) => setFilters(prev => ({ ...prev, [filterType]: value }));
  const applyFilters = () => fetchFilteredOrders();
  const resetFilters = () => { setFilters({ status: 'ALL', type: 'ALL', storeId: 'ALL' }); setFilteredOrders(orders); };
  
  const handleViewDetails = async (order) => { setSelectedOrder(order); setShowDetailsModal(true); try { const response = await axiosClient.get(`/repair-orders/${order._id}/details`); setOrderDetails(response.data); } catch (err) { setOrderDetails([]); } };
  
  const acceptRepairOrder = async (orderId) => { try { await axiosClient.put(`/repair-orders/${orderId}/accept`); const updateOrderStatus = (orderList) => orderList.map(order => order._id === orderId ? { ...order, status: "In Progress" } : order); setOrders(updateOrderStatus(orders)); setFilteredOrders(updateOrderStatus(filteredOrders)); toast.success("Đã nhận đơn"); } catch (error) { toast.error("Lỗi nhận đơn"); } };
  
  const cancelRepairOrder = async (orderId) => { try { await axiosClient.put(`/repair-orders/${orderId}/cancel`); const updateOrderStatus = (orderList) => orderList.map(order => order._id === orderId ? { ...order, status: "Cancelled" } : order); setOrders(updateOrderStatus(orders)); setFilteredOrders(updateOrderStatus(filteredOrders)); toast.success("Đã hủy đơn"); } catch (error) { toast.error("Lỗi hủy đơn"); } };

  if (loading && orders.length === 0 && waitingPhones.length === 0 && tradeInRequests.length === 0) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="md" text="Đang tải..." /></div>;

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Wrench className="text-blue-600" /> Quản lý Hàng chờ Kỹ thuật</h2>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

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

      {activeTab === "WAITING_DECISION" && (
        <WaitingDecisionTab 
          waitingPhones={waitingPhones}
          loading={loading}
          selectedDecisionPhone={selectedDecisionPhone}
          decision={decision}
          sellForm={sellForm}
          dismantleParts={dismantleParts}
          itemTypes={itemTypes}
          replacementParts={replacementParts}
          availablePartsInStock={availablePartsInStock}
          onFetchAvailableParts={fetchAvailablePartsForReplacement}
          onSetReplacementParts={setReplacementParts}
          onProcess={(phone) => {
            setSelectedDecisionPhone(phone);
            setDecision("DIRECT_IMPORT");
            setSellForm({ sellingPrice: "", capacity: phone.capacity || "", colorName: phone.colorName || "" });
            setDismantleParts([]);
            setReplacementParts([]);
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
          onCloseDetailsModal={() => setShowDetailsModal(false)} 
        />
      )}
    </div>
  );
};
export default RepairOrderList;