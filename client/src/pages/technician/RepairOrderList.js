import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { Wrench } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../../components/technician/shared/LoadingSpinner";
import TabNavigation from "../../components/technician/TabNavigation";
import TradeInTab from "../../components/technician/trade-in/TradeInTab";
import WaitingDecisionTab from "../../components/technician/waiting-decision/WaitingDecisionTab";
import RepairOrdersTab from "../../components/technician/repair-orders/RepairOrdersTab";

const RepairOrderList = () => {
  const location = useLocation();
  const routeNavigate = useNavigate();

  const [activeTab, setActiveTab] = useState("TRADE_IN");
  const [counts, setCounts] = useState({ TRADE_IN: 0, WAITING_DECISION: 0, REPAIR: 0 });

  const [selectedTradeIn, setSelectedTradeIn] = useState(null);
  const [phoneModels, setPhoneModels] = useState([]);
  const [valuation, setValuation] = useState({
    price: "",
    techNote: "",
    phoneModelId: "",
    colorName: "",
    capacity: "",
    ram: "",
  });

  const [checklist, setChecklist] = useState({});
  const isBasicInfoFilled =
    valuation.phoneModelId &&
    valuation.colorName &&
    valuation.capacity &&
    valuation.ram;

  const [waitingPhones, setWaitingPhones] = useState([]);
  const [selectedDecisionPhone, setSelectedDecisionPhone] = useState(null);
  const [decision, setDecision] = useState("DIRECT_IMPORT");
  const [itemTypes, setItemTypes] = useState([]);
  const [sellForm, setSellForm] = useState({
    sellingPrice: "",
    capacity: "",
    colorName: "",
  });
  const [dismantleParts, setDismantleParts] = useState([]);

  const [replacementParts, setReplacementParts] = useState([]);
  const [availablePartsInStock, setAvailablePartsInStock] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState("PENDING");
  const [showMyOrdersOnly, setShowMyOrdersOnly] = useState(false);
  
  const [filters, setFilters] = useState({
    status: ["Pending", "In Progress"],
    type: "ALL",
    storeId: "ALL",
    customerName: "",
  });

  useEffect(() => {
    if (location.state?.triggerRepairTab) {
      setActiveTab("REPAIR");
      setViewMode("PENDING");
    }
  }, [location.state]);

  const fetchAllCounts = async () => {
    try {
      const [waitingRes, repairRes] = await Promise.all([
        axiosClient.get("/phones?status=waiting_for_tech_decision"),
        axiosClient.get("/repair-orders")
      ]);

      const wCount = (Array.isArray(waitingRes.data) ? waitingRes.data : waitingRes.data?.data || []).length;
      const rList = Array.isArray(repairRes.data) ? repairRes.data : repairRes.data?.data || [];
      const rCount = rList.filter(o => o.status === "Pending" || o.status === "In Progress").length;

      setCounts({ TRADE_IN: 0, WAITING_DECISION: wCount, REPAIR: rCount });
    } catch (err) {}
  };

  useEffect(() => {
    fetchAllCounts();
    if (activeTab === "TRADE_IN") {
      fetchPhoneModels();
      setLoading(false);
    } else if (activeTab === "WAITING_DECISION") {
      fetchWaitingPhones();
      fetchItemTypes();
    } else if (activeTab === "REPAIR") {
      if (viewMode === "PENDING") {
        fetchFilteredOrders();
      } else {
        fetchHistoryOrders();
      }
      fetchStores();
    }
  }, [activeTab, viewMode, showMyOrdersOnly, filters]);

  useEffect(() => {
    if (location.state?.triggerRepairTab && activeTab === "REPAIR" && !filterLoading) {
      const autoOpenId = location.state.openRepairOrderId;
      let targetOrder = null;

      if (filteredOrders.length > 0) {
        if (autoOpenId) {
          targetOrder = filteredOrders.find(o => o._id === autoOpenId);
        }
        if (!targetOrder) {
          targetOrder = filteredOrders.find(o => o.status === "Pending");
        }
      }

      if (targetOrder) {
        handleViewDetails(targetOrder);
        routeNavigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [filteredOrders, location.state, activeTab, filterLoading]);

  const fetchPhoneModels = async () => {
    try {
      const res = await axiosClient.get("/phone_models/all");
      setPhoneModels(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {}
  };

  const handleChecklistChange = (partCode, conditionObj) => {
    setChecklist((prev) => ({
      ...prev,
      [partCode]: conditionObj
    }));
  };

  const submitValuationDetailed = async (req) => {
    if (!valuation.phoneModelId || !valuation.colorName || !valuation.capacity || !valuation.ram)
      return toast.error("Vui lòng điền đủ thông tin máy!");
    if (!valuation.price) return toast.error("Vui lòng nhập giá thu mua dự kiến!");

    const isNew = req.isNewPurchase;
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;

    const checklistArr = Object.entries(checklist || {}).map(([code, item]) => ({
      code,
      name: item.partName || code,
      label: item.label,
      isFaulty: item.isFaulty
    }));

    const checklistStr = checklistArr.map((item) => `- ${item.name}: ${item.label}`).join("\n");
    const reportNote = `[BÁO CÁO KỸ THUẬT]\n- Cấu hình: ${valuation.capacity} | ${valuation.ram} RAM | Màu ${valuation.colorName}\n- Tình trạng:\n${checklistStr || "Máy bình thường"}\n- Ghi chú: ${valuation.techNote || "Không có"}`;

    const payload = {
      totalPrice: Number(valuation.price),
      status: "Pending", 
      note: reportNote,
      checklistData: JSON.stringify(checklistArr), 
      tempPhoneData: {
        phoneModelId: valuation.phoneModelId,
        capacity: valuation.capacity,
        colorName: valuation.colorName,
        ram: valuation.ram,
      },
      orderType: "PURCHASE",
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      storeId: user?.storeId?._id || user?.storeId,
      createdBy: user?._id || user?.id
    };

    try {
      if (isNew) {
        await axiosClient.post("/purchase-orders", payload);
        toast.success("Đã tạo đơn thu máy thành công!");
      } else {
        const orderId = req._id || req.id;
        if (!orderId) return toast.error("Lỗi: Không lấy được ID đơn hàng để cập nhật!");
        await axiosClient.put(`/purchase-orders/${orderId}`, payload);
        toast.success("Đã cập nhật báo cáo thành công!");
      }
      
      setSelectedTradeIn(null);
      setValuation({ price: "", techNote: "", phoneModelId: "", colorName: "", capacity: "", ram: "" });
      setChecklist({});
      fetchAllCounts();
    } catch (err) {
      toast.error("Lỗi hệ thống: " + (err.response?.data?.message || err.message));
    }
  };

  const fetchWaitingPhones = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/phones?status=waiting_for_tech_decision");
      setWaitingPhones(Array.isArray(res.data) ? res.data : res.data.data || []);
      setError(null);
    } catch (err) {
      setError("Lỗi lấy danh sách chờ quyết định");
    } finally {
      setLoading(false);
    }
  };

  const fetchItemTypes = async () => {
    try {
      const res = await axiosClient.get("/item_types/all");
      setItemTypes(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {}
  };

  const fetchAvailablePartsForReplacement = async () => {
    try {
      const res = await axiosClient.get("/items?status=in_stock");
      setAvailablePartsInStock(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error("Không thể lấy kho linh kiện");
    }
  };

  const addPartRow = (prefill = null) =>
    setDismantleParts([
      ...dismantleParts,
      prefill && prefill.name ? prefill : {
        itemTypeId: "", name: "", serialCode: "", quality: "Zin bóc máy",
        ram: "", capacity: "", color: "", baseCost: "", price: ""
      },
    ]);
    
  const removePartRow = (index) => setDismantleParts(dismantleParts.filter((_, i) => i !== index));
  
  const handlePartChange = (index, field, value) => {
    const newParts = [...dismantleParts];
    newParts[index][field] = value;
    setDismantleParts(newParts);
  };

  const handleDecisionSubmit = async () => {
    if (decision === "SELL" && !sellForm.sellingPrice) return toast.error("Vui lòng nhập giá bán!");
    
    if (decision === "DISMANTLE") {
      if (dismantleParts.length === 0 || dismantleParts.some((p) => !p.name || Number(p.price) <= 0)) {
        return toast.error("Vui lòng nhập đủ Tên hiển thị và Giá bán (>0) cho linh kiện rã xác!");
      }
      
      let parsedChecklist = [];
      try {
        if (selectedDecisionPhone?.checklistData) parsedChecklist = JSON.parse(selectedDecisionPhone.checklistData);
      } catch(e){}
      
      const goodPartsCount = parsedChecklist.filter(i => !i.isFaulty).length;
      const extractedCount = dismantleParts.length;
      
      if (extractedCount < goodPartsCount) {
         const diff = goodPartsCount - extractedCount;
         const confirm = await Swal.fire({
            title: 'Chưa bóc hết linh kiện?',
            text: `Còn ${diff} linh kiện 100% nữa vẫn chưa được chọn. Bạn có chắc chắn muốn xác nhận rã xác không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vẫn rã xác',
            cancelButtonText: 'Hủy để chọn thêm',
            buttonsStyling: false,
            customClass: {
              confirmButton: 'bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 transition mx-2',
              cancelButton: 'bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition mx-2'
            }
         });
         if (!confirm.isConfirmed) return;
      }
    }
      
    try {
      const payload = {
        decision,
        ...sellForm,
        parts: dismantleParts,
        replacedItems: replacementParts.map((p) => p._id),
        phoneName: selectedDecisionPhone.phoneModelId?.name,
      };
      await axiosClient.put(`/phones/${selectedDecisionPhone._id}/tech-decision`, payload);
      toast.success("Xử lý thành công! Máy/Linh kiện đã được luân chuyển kho.");
      setSelectedDecisionPhone(null);
      fetchWaitingPhones();
      fetchAllCounts();
    } catch (err) {
      toast.error("Lỗi cập nhật quyết định");
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axiosClient.get("/stores");
      const storesData = response.data?.data || response.data || [];
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (err) {
      setStores([]);
    }
  };

  const fetchFilteredOrders = async () => {
    if (viewMode !== "PENDING") return;
    try {
      setFilterLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.status !== "ALL") {
        if (Array.isArray(filters.status)) {
          filters.status.forEach(status => queryParams.append("status", status));
        } else {
          queryParams.append("status", filters.status);
        }
      }
      
      if (filters.type !== "ALL") queryParams.append("type", filters.type);
      if (filters.storeId !== "ALL") queryParams.append("storeId", filters.storeId);
      
      const url = queryParams.toString() ? `/repair-orders/filter?${queryParams.toString()}` : "/repair-orders";
      const response = await axiosClient.get(url);
      setFilteredOrders(response.data);
      setError(null);
    } catch (err) {
      setError("Lỗi lọc đơn");
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchHistoryOrders = async () => {
    if (viewMode !== "HISTORY") return;
    try {
      setFilterLoading(true);
      const user = JSON.parse(localStorage.getItem('user')) || {};
      const currentUserId = user?._id || user?.id || "";
      
      const queryParams = new URLSearchParams();
      if (showMyOrdersOnly && currentUserId) {
        queryParams.append("technicianId", currentUserId);
      }
      
      if (filters.type !== "ALL") queryParams.append("type", filters.type);
      if (filters.storeId !== "ALL") queryParams.append("storeId", filters.storeId);
      
      queryParams.append("status", "Completed");
      
      const url = queryParams.toString() ? `/repair-orders/filter?${queryParams.toString()}` : "/repair-orders";
      const response = await axiosClient.get(url);
      setFilteredOrders(response.data);
      setError(null);
    } catch (err) {
      setError("Lỗi tải lịch sử đơn");
    } finally {
      setFilterLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };
  
  const applyFilters = () => {
      if (viewMode === "PENDING") fetchFilteredOrders();
      else fetchHistoryOrders();
  };
  
  const resetFilters = () => {
    if (viewMode === "PENDING") {
        setFilters({ status: ["Pending", "In Progress"], type: "ALL", storeId: "ALL", customerName: "" });
    } else {
        setFilters({ status: "Completed", type: "ALL", storeId: "ALL", customerName: "" });
    }
  };
  
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    if (mode === "PENDING") {
      setFilters({ status: ["Pending", "In Progress"], type: "ALL", storeId: "ALL", customerName: "" });
    } else {
      setFilters({ status: "Completed", type: "ALL", storeId: "ALL", customerName: "" });
    }
  };
  
  const toggleMyOrders = () => {
    setShowMyOrdersOnly(!showMyOrdersOnly);
  };
  
  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    try {
      const response = await axiosClient.get(`/repair-orders/${order._id}/details`);
      setOrderDetails(response.data);
    } catch (err) {
      setOrderDetails([]);
    }
  };

  const handleOpenNewPurchase = () => {
    setSelectedTradeIn({ isNewPurchase: true, customerName: "", customerPhone: "" });
    setValuation({ price: "", techNote: "", phoneModelId: "", colorName: "", capacity: "", ram: "" });
    setChecklist({});
  };

  const acceptRepairOrder = async (orderId, serviceId = [], itemIds = [], totalPrice = 0, phoneModelId = null) => {
    try {
      await axiosClient.put(`/repair-orders/${orderId}/accept`, {
        serviceId, itemIds, totalPrice, phoneModelId
      });

      toast.success("Đã nhận đơn và cập nhật chi tiết!");
      fetchFilteredOrders();
      fetchAllCounts();
    } catch (error) {
      toast.error("Lỗi nhận đơn: " + (error.response?.data?.message || error.message));
    }
  };

  const handleOrderUpdate = async (orderId, serviceId = [], itemIds = [], totalPrice = 0, phoneModelId = null) => {
    try {
      await axiosClient.put(`/repair-orders/${orderId}/details-transfer`, { serviceId, itemIds });
      await axiosClient.put(`/repair-orders/${orderId}`, { totalPrice, phoneModelId });
      toast.success("Đã lưu cập nhật chi tiết và tổng tiền!");
      fetchFilteredOrders();
    } catch (error) {
      toast.error("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
    }
  };

  const completeRepairOrder = async (orderId) => {
    try {
      await axiosClient.put(`/repair-orders/${orderId}/complete`, {});
      toast.success("Đã hoàn thành đơn sửa chữa!");
      fetchFilteredOrders();
      fetchAllCounts();
    } catch (error) {
      toast.error("Lỗi hoàn thành đơn: " + (error.response?.data?.message || error.message));
    }
  };

  const cancelRepairOrder = async (orderId) => {
    try {
      await axiosClient.put(`/repair-orders/${orderId}/cancel`);
      toast.success("Đã hủy đơn");
      fetchFilteredOrders();
      fetchAllCounts();
    } catch (error) {
      toast.error("Lỗi hủy đơn");
    }
  };

  if (loading && filteredOrders.length === 0 && waitingPhones.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="md" text="Đang tải..." />
      </div>
    );

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wrench className="text-blue-600" /> Quản lý Hàng chờ Kỹ thuật
        </h2>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
      </div>

     {activeTab === "TRADE_IN" && (
        <TradeInTab
            selectedTradeIn={selectedTradeIn}
            valuation={valuation}
            checklist={checklist}
            phoneModels={phoneModels}
            isBasicInfoFilled={isBasicInfoFilled}
            onOpenNewPurchase={handleOpenNewPurchase}
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
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 m-4">
            <div className="flex gap-2">
              <button
                onClick={() => toggleViewMode("PENDING")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === "PENDING" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                Đơn chờ xử lý
              </button>
              <button
                onClick={() => toggleViewMode("HISTORY")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === "HISTORY" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                Lịch sử đơn sửa chữa
              </button>
            </div>
            {viewMode === "HISTORY" && (
              <button
                onClick={toggleMyOrders}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${showMyOrdersOnly ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                {showMyOrdersOnly ? "Hiện tất cả đơn" : "Chỉ hiện đơn của tôi"}
              </button>
            )}
          </div>
          <RepairOrdersTab
            filteredOrders={filteredOrders}
            filters={filters}
            stores={stores}
            filterLoading={filterLoading}
            selectedOrder={selectedOrder}
            orderDetails={orderDetails}
            showDetailsModal={showDetailsModal}
            viewMode={viewMode}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
            onResetFilters={resetFilters}
            onViewDetails={handleViewDetails}
            onAccept={acceptRepairOrder}
            onOrderUpdate={handleOrderUpdate}
            onCancel={cancelRepairOrder}
            onComplete={completeRepairOrder}
            onCloseDetailsModal={() => setShowDetailsModal(false)}
          />
        </div>
      )}
    </div>
  );
};
export default RepairOrderList;