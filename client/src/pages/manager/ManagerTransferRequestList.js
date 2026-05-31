import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Check, X, Package, Calendar, Store, User, ArrowLeft, ChevronDown, ChevronUp, Filter, Clock, Archive } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';

import { 
  fetchStoresApi, 
  fetchTransferRequestsApi, 
  approveTransferRequestApi, 
  rejectTransferRequestApi, 
  confirmReceiptApi 
} from "../../api/manager/transferRequest";

export default function ManagerTransferRequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  

  const [activeTab, setActiveTab] = useState("ACTIVE"); 

  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); 
  const [selectedDate, setSelectedDate] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stores, setStores] = useState([]);
  const [userStoreId, setUserStoreId] = useState("");

  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    
    fetchStoresAndSetUserStore(userData._id || userData.id);
    loadTransferRequests();
  }, [selectedDate]);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, storeFilter, statusFilter, selectedDate, activeTab]);

  const fetchStoresAndSetUserStore = async (userId) => {
    const storesArray = await fetchStoresApi();
    setStores(storesArray);
    
    const userStore = storesArray.find(store => store.staff && store.staff.includes(userId));
    if (userStore) {
      setUserStoreId(userStore._id);
    }
  };

  const loadTransferRequests = async () => {
    setLoading(true);
    const data = await fetchTransferRequestsApi();
    setRequests(data);
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    const result = await Swal.fire({
        title: 'Duyệt yêu cầu này?',
        text: "Bạn xác nhận đồng ý xuất kho cấp hàng cho yêu cầu này?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý duyệt',
        cancelButtonText: 'Hủy bỏ',
        customClass: {
            confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
            cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
            popup: 'rounded-2xl'
        },
        buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
      await approveTransferRequestApi(requestId, user._id || user.id);
      toast.success("Đã duyệt yêu cầu chuyển kho");
      loadTransferRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể duyệt yêu cầu");
    }
  };

  const handleReject = async (requestId) => {
    const result = await Swal.fire({
        title: 'Từ chối yêu cầu?',
        text: "Bạn có chắc chắn muốn từ chối yêu cầu luân chuyển này?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận Từ chối',
        cancelButtonText: 'Hủy bỏ',
        customClass: {
            confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
            cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
            popup: 'rounded-2xl'
        },
        buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
      await rejectTransferRequestApi(requestId, user._id || user.id);
      toast.success("Đã từ chối yêu cầu chuyển kho");
      loadTransferRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể từ chối yêu cầu");
    }
  };

  const handleConfirm = async (requestId) => {
    const result = await Swal.fire({
        title: 'Xác nhận nhận hàng?',
        text: "Sản phẩm sẽ tự động được cập nhật vào kho của bạn. Hành động này không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Vâng, tôi đã nhận đủ!',
        cancelButtonText: 'Hủy bỏ',
        customClass: {
            confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
            cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
            popup: 'rounded-2xl'
        },
        buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
      await confirmReceiptApi(requestId);
      toast.success("Đã xác nhận nhận hàng và nhập kho thành công!");
      loadTransferRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xác nhận nhận hàng");
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };


  const filteredRequests = requests.filter((req) => {
    const involvesUserStore = req.fromStoreId?._id === userStoreId || req.toStoreId?._id === userStoreId;
    if (!involvesUserStore) return false;

 
    const validActiveStatuses = ['PENDING', 'APPROVED', 'DELIVERING'];
    const validHistoryStatuses = ['COMPLETED', 'REJECTED'];
    if (activeTab === "ACTIVE" && !validActiveStatuses.includes(req.status)) return false;
    if (activeTab === "HISTORY" && !validHistoryStatuses.includes(req.status)) return false;

    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      req.requestedBy?.fullName?.toLowerCase().includes(searchLower) ||
      req.fromStoreId?.name?.toLowerCase().includes(searchLower) ||
      req.toStoreId?.name?.toLowerCase().includes(searchLower) ||
      req.note?.toLowerCase().includes(searchLower);

    const matchStore = storeFilter === "ALL" || 
      (storeFilter === "SENT" && req.fromStoreId?._id === userStoreId) ||
      (storeFilter === "RECEIVED" && req.toStoreId?._id === userStoreId);

    const matchStatus = statusFilter === "ALL" || req.status === statusFilter;

    const matchDate = !selectedDate || 
      new Date(req.createdAt).toDateString() === new Date(selectedDate).toDateString();

    return matchSearch && matchStore && matchStatus && matchDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED": return <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs rounded-md font-bold border border-green-200 whitespace-nowrap">Đã hoàn thành</span>;
      case "APPROVED": return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-bold border border-blue-200 whitespace-nowrap">Đã duyệt</span>;
      case "DELIVERING": return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs rounded-md font-bold border border-purple-200 whitespace-nowrap">Đang vận chuyển</span>;
      case "PENDING": return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md font-bold border border-yellow-200 whitespace-nowrap">Chờ duyệt</span>;
      case "REJECTED": return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs rounded-md font-bold border border-red-200 whitespace-nowrap">Từ chối</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs rounded-md font-bold border border-gray-200 whitespace-nowrap">{status}</span>;
    }
  };

  const getActionButtons = (request) => {
    const isFromUserStore = request.fromStoreId?._id === userStoreId;
    const isToUserStore = request.toStoreId?._id === userStoreId;

    if (isFromUserStore && request.status === "PENDING") {
      return (
        <div className="flex justify-center gap-1">
          <button onClick={() => handleApprove(request._id)} className="text-green-600 hover:text-green-800 transition bg-green-50 p-1.5 rounded-md hover:bg-green-100 border border-green-200 shadow-sm" title="Duyệt"><Check size={16} /></button>
          <button onClick={() => handleReject(request._id)} className="text-red-600 hover:text-red-800 transition bg-red-50 p-1.5 rounded-md hover:bg-red-100 border border-red-200 shadow-sm" title="Từ chối"><X size={16} /></button>
          <button onClick={() => navigate(`/manager/transfer_requests/${request._id}`)} className="text-blue-600 hover:text-blue-800 transition bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 border border-blue-200 shadow-sm" title="Chi tiết"><Eye size={16} /></button>
        </div>
      );
    } else if (isToUserStore && request.status === "DELIVERING") {
      return (
        <div className="flex justify-center gap-1">
          <button onClick={() => handleConfirm(request._id)} className="text-green-600 hover:text-green-800 transition bg-green-50 p-1.5 rounded-md hover:bg-green-100 border border-green-200 shadow-sm" title="Xác nhận nhận hàng"><Check size={16} /></button>
          <button onClick={() => navigate(`/manager/transfer_requests/${request._id}`)} className="text-blue-600 hover:text-blue-800 transition bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 border border-blue-200 shadow-sm" title="Chi tiết"><Eye size={16} /></button>
        </div>
      );
    } else {
      return (
        <button onClick={() => navigate(`/manager/transfer_requests/${request._id}`)} className="text-blue-600 hover:text-blue-800 transition bg-blue-50 p-2 rounded-md hover:bg-blue-100 border border-blue-200 shadow-sm mx-auto flex" title="Chi tiết"><Eye size={16} /></button>
      );
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/manager/dashboard")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-white shadow-sm border border-gray-200"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="text-indigo-600" />Yêu cầu chuyển kho</h1>
          </div>
          <button onClick={() => navigate("/manager/transfer_requests/new")} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md">
            <Package size={18} /> Tạo yêu cầu luân chuyển mới
          </button>
        </div>

        <div className="flex border-b border-gray-200 mb-6 bg-white px-2 pt-2 rounded-t-xl shadow-sm">
            <button
                onClick={() => { setActiveTab("ACTIVE"); setStatusFilter("ALL"); }}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "ACTIVE"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
                <Clock size={18} /> Đang xử lý (Chờ duyệt / Đang giao)
            </button>
            <button
                onClick={() => { setActiveTab("HISTORY"); setStatusFilter("ALL"); }}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "HISTORY"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
                <Archive size={18} /> Lịch sử (Đã hoàn thành / Từ chối)
            </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 rounded-tl-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input type="text" placeholder="Tìm theo tên, ghi chú..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            </div>
            
            <div className="relative">
              <Store className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer text-sm font-semibold text-gray-700">
                <option value="ALL">Tất cả (Gửi & Nhận)</option>
                <option value="SENT">Gửi đi (Xin xuất kho)</option>
                <option value="RECEIVED">Nhận về (Xin nhập kho)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer text-sm font-semibold text-gray-700">
                <option value="ALL">Tất cả trạng thái</option>
                {activeTab === "ACTIVE" ? (
                    <>
                        <option value="PENDING">Chờ duyệt</option>
                        <option value="APPROVED">Đã duyệt (Chờ xuất)</option>
                        <option value="DELIVERING">Đang vận chuyển</option>
                    </>
                ) : (
                    <>
                        <option value="COMPLETED">Đã hoàn thành</option>
                        <option value="REJECTED">Đã từ chối</option>
                    </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700" />
            </div>
          </div>
          
          {(searchQuery || storeFilter !== "ALL" || statusFilter !== "ALL" || selectedDate) && (
            <div className="mt-3 flex justify-end">
              <button onClick={() => { setSearchQuery(""); setStoreFilter("ALL"); setStatusFilter("ALL"); setSelectedDate(""); }} className="px-4 py-1.5 text-sm font-bold bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors">
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
        
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200 uppercase text-xs text-gray-500">
                  <th className="p-4 font-bold text-center w-12 align-middle">STT</th>
                  <th className="p-4 font-bold text-center w-24 align-middle">Loại phiếu</th>
                  <th className="p-4 font-bold w-[30%] align-middle">Danh sách sản phẩm</th>
                  <th className="p-4 font-bold text-center w-20 align-middle">Tổng SL</th>
                  <th className="p-4 font-bold align-middle">Người yêu cầu</th>
                  <th className="p-4 font-bold align-middle">Ngày tạo</th>
                  <th className="p-4 font-bold text-center align-middle">Trạng thái</th>
                  <th className="p-4 font-bold text-center align-middle">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="p-10 text-center text-gray-500 align-middle"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div></td></tr>
                ) : currentRequests.length === 0 ? (
                  <tr><td colSpan="8" className="p-10 text-center text-gray-500 font-medium align-middle">Không có dữ liệu trong mục này.</td></tr>
                ) : (
                  currentRequests.map((req, index) => {
                   const itemTypes = req.itemType || [];
                    const phonesList = req.phones || [];
                    
                    const totalItemQty = itemTypes.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
                    const totalPhoneQty = phonesList.length;
                    const totalQuantity = totalItemQty + totalPhoneQty;

                    const isExpanded = expandedRows[req._id];

                    const phoneGroupMap = {};
                    phonesList.forEach(p => {
                        const name = p.phoneModelId?.name || "Máy điện thoại";
                        const color = p.colorName || "N/A";
                        const capacity = p.capacity || "N/A";
                        const key = `${name} (${color} - ${capacity})`;
                        phoneGroupMap[key] = (phoneGroupMap[key] || 0) + 1;
                    });
                    
                    const phoneDisplayNames = Object.entries(phoneGroupMap).map(
                        ([key, count]) => `${key} x${count}`
                    );

                    const allItems = [
                      ...phoneDisplayNames,
                      ...itemTypes.map(it => `${it.itemTypes?.name || "Linh kiện"} x${it.quantity || 0}`)
                    ];

                    const displayNames = allItems.slice(0, 2).join(', ');
                    const hasMore = allItems.length > 2;

                    const isExport = req.fromStoreId?._id === userStoreId;

                    return (
                      <tr key={req._id} className="border-b border-gray-100 hover:bg-blue-50/20 transition">
                        <td className="p-4 text-sm text-gray-600 text-center font-bold align-middle">{indexOfFirstItem + index + 1}</td>
                        
                        <td className="p-4 text-center align-middle">
                            {isExport ? (
                                <span className="px-2.5 py-1 bg-orange-100 text-orange-800 text-xs rounded-md font-bold border border-orange-200 whitespace-nowrap">Xuất đi</span>
                            ) : (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-md font-bold border border-emerald-200 whitespace-nowrap">Nhận về</span>
                            )}
                        </td>

                        <td className="p-4 text-sm text-gray-800 align-middle max-w-[280px]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-gray-700 font-medium leading-relaxed">
                              {!isExpanded ? (
                                <>
                                  {displayNames}
                                  {hasMore && <span className="text-gray-400 italic"> ... (+{allItems.length - 2})</span>}
                                </>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  {allItems.map((name, idx) => (
                                    <span key={idx}>{name}{idx < allItems.length - 1 ? ',' : ''}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {hasMore && (
                              <button
                                onClick={() => toggleRow(req._id)}
                                className="mt-0.5 text-gray-500 hover:text-indigo-600 transition bg-gray-50 hover:bg-indigo-50 p-1 rounded-md flex-shrink-0"
                              >
                                {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-sm text-center font-semibold text-gray-800 align-middle">
                            {totalQuantity}
                        </td>
                        <td className="p-4 text-sm text-gray-600 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-bold"><User size={16} className="text-gray-400"/>{req.requestedBy?.fullName || "N/A"}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-500 font-medium align-middle">{formatDate(req.createdAt)}</td>
                        <td className="p-4 text-center align-middle">{getStatusBadge(req.status)}</td>
                        <td className="p-4 align-middle">
                            {getActionButtons(req)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-600">
                Hiển thị <span className="font-bold text-indigo-600">{indexOfFirstItem + 1}</span> - <span className="font-bold text-indigo-600">{Math.min(indexOfLastItem, filteredRequests.length)}</span> trên tổng số <span className="font-bold text-gray-800">{filteredRequests.length}</span> yêu cầu
              </span>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-8 h-8 rounded-md text-sm font-bold transition shadow-sm ${
                      currentPage === index + 1 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    } border`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}