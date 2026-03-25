import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Check, X, Package, Calendar, Store, User, Filter, ArrowLeft } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ManagerTransferRequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Store options for filter
  const [stores, setStores] = useState([]);
  const [userStoreId, setUserStoreId] = useState("");

  useEffect(() => {
    // Get user info from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    
    // Fetch stores and user store
    fetchStoresAndSetUserStore(userData._id || userData.id);
    
    // Fetch transfer requests
    fetchTransferRequests();
  }, [selectedDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, storeFilter, selectedDate]);

  const fetchStoresAndSetUserStore = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:9999/api/stores", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        const storesArray = result.data || result;
        
        if (Array.isArray(storesArray)) {
          setStores(storesArray);
          
          // Find user's store
          const userStore = storesArray.find(store => 
            store.staff && store.staff.includes(userId)
          );
          
          if (userStore) {
            setUserStoreId(userStore._id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Lỗi khi tải danh sách cửa hàng");
    }
  };

  const fetchTransferRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:9999/api/transfer-requests", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data || []);
      } else {
        toast.error("Không thể tải danh sách yêu cầu chuyển kho");
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách yêu cầu chuyển kho: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:9999/api/transfer-requests/${requestId}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          approvedBy: user._id || user.id
        })
      });

      if (response.ok) {
        toast.success("Đã duyệt yêu cầu chuyển kho");
        fetchTransferRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Không thể duyệt yêu cầu");
      }
    } catch (error) {
      toast.error("Lỗi khi duyệt yêu cầu: " + error.message);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:9999/api/transfer-requests/${requestId}/reject`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          approvedBy: user._id || user.id
        })
      });

      if (response.ok) {
        toast.success("Đã từ chối yêu cầu chuyển kho");
        fetchTransferRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Không thể từ chối yêu cầu");
      }
    } catch (error) {
      toast.error("Lỗi khi từ chối yêu cầu: " + error.message);
    }
  };

  const handleConfirm = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:9999/api/transfer-requests/${requestId}/confirm-receipt`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        toast.success("Đã xác nhận nhận hàng");
        fetchTransferRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Không thể xác nhận nhận hàng");
      }
    } catch (error) {
      toast.error("Lỗi khi xác nhận nhận hàng: " + error.message);
    }
  };

  // Filter requests that involve user's store
  const filteredRequests = requests.filter((req) => {
    // Only show requests involving user's store
    const involvesUserStore = req.fromStoreId?._id === userStoreId || req.toStoreId?._id === userStoreId;
    if (!involvesUserStore) return false;

    // Search filter (item_type or staff name)
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      req.requestedBy?.fullName?.toLowerCase().includes(searchLower) ||
      req.fromStoreId?.name?.toLowerCase().includes(searchLower) ||
      req.toStoreId?.name?.toLowerCase().includes(searchLower) ||
      req.note?.toLowerCase().includes(searchLower);

    // Store filter
    const matchStore = storeFilter === "ALL" || 
      (storeFilter === "SENT" && req.fromStoreId?._id === userStoreId) ||
      (storeFilter === "RECEIVED" && req.toStoreId?._id === userStoreId);

    // Date filter - check if request was created on selected date
    const matchDate = !selectedDate || 
      new Date(req.createdAt).toDateString() === new Date(selectedDate).toDateString();

    return matchSearch && matchStore && matchDate;
  });

  // Pagination
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
      case "COMPLETED": return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Đã hoàn thành</span>;
      case "APPROVED": return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Đã duyệt</span>;
      case "PENDING": return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Chờ duyệt</span>;
      case "REJECTED": return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Từ chối</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">{status}</span>;
    }
  };

  const getActionButtons = (request) => {
    const isFromUserStore = request.fromStoreId?._id === userStoreId;
    const isToUserStore = request.toStoreId?._id === userStoreId;

    if (isFromUserStore && request.status === "PENDING") {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => handleApprove(request._id)}
            className="text-green-600 hover:text-green-800 transition bg-green-50 p-1.5 rounded-full hover:bg-green-100"
            title="Duyệt"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => handleReject(request._id)}
            className="text-red-600 hover:text-red-800 transition bg-red-50 p-1.5 rounded-full hover:bg-red-100"
            title="Từ chối"
          >
            <X size={16} />
          </button>
          <button
            onClick={() => navigate(`/manager/transfer_requests/${request._id}`)}
            className="text-blue-600 hover:text-blue-800 transition bg-blue-50 p-1.5 rounded-full hover:bg-blue-100"
            title="Chi tiết"
          >
            <Eye size={16} />
          </button>
        </div>
      );
    } else if (isToUserStore && request.status === "APPROVED") {
      // Store receiving items - can confirm receipt
      return (
        <div className="flex gap-1">
          <button
            onClick={() => handleConfirm(request._id)}
            className="text-green-600 hover:text-green-800 transition bg-green-50 p-1.5 rounded-full hover:bg-green-100"
            title="Xác nhận nhận hàng"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => navigate(`/manager/transfer_requests/${request._id}`)}
            className="text-blue-600 hover:text-blue-800 transition bg-blue-50 p-1.5 rounded-full hover:bg-blue-100"
            title="Chi tiết"
          >
            <Eye size={16} />
          </button>
        </div>
      );
    } else {
      return (
        <button
          onClick={() => navigate(`/manager/transfer_requests/${request._id}`)}
          className="text-blue-600 hover:text-blue-800 transition bg-blue-50 p-1.5 rounded-full hover:bg-blue-100"
          title="Chi tiết"
        >
          <Eye size={16} />
        </button>
      );
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/manager/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-indigo-600" />
              Yêu cầu chuyển kho
            </h1>
          </div>
          <button
            onClick={() => navigate("/manager/transfer_requests/new")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Package size={16} />
            Tạo yêu cầu mới
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên nhân viên, cửa hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="relative">
              <Store className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              >
                <option value="ALL">Tất cả giao dịch</option>
                <option value="SENT">Cửa hàng gửi</option>
                <option value="RECEIVED">Cửa hàng nhận</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Chọn ngày"
              />
            </div>
          </div>
          
          {(searchQuery || storeFilter !== "ALL" || selectedDate) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStoreFilter("ALL");
                  setSelectedDate("");
                }}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th className="p-3 font-semibold text-gray-700 text-center w-12">STT</th>
                  <th className="p-3 font-semibold text-gray-700">Loại SP</th>
                  <th className="p-3 font-semibold text-gray-700">SL</th>
                  <th className="p-3 font-semibold text-gray-700">Cửa hàng gửi</th>
                  <th className="p-3 font-semibold text-gray-700">Cửa hàng nhận</th>
                  <th className="p-3 font-semibold text-gray-700">Người yêu cầu</th>
                  <th className="p-3 font-semibold text-gray-700">Ngày tạo</th>
                  <th className="p-3 font-semibold text-gray-700">Trạng thái</th>
                  <th className="p-3 font-semibold text-gray-700 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">
                      Không tìm thấy yêu cầu chuyển kho nào.
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((req, index) => {
                    const itemTypes = req.itemType || [];
                    const totalQuantity = itemTypes.reduce((sum, item) => sum + (item.quantity || 0), 0);
                    
                    const itemTypeNames = itemTypes.map(item =>
                      item.itemTypes?.name || item.itemTypes || "Unknown"
                    ).join(", ");

                    return (
                      <tr key={req._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-600 text-center font-medium">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          <div className="max-w-xs truncate" title={itemTypeNames}>
                            {itemTypeNames || "Không có sản phẩm"}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-600 text-center">{totalQuantity}</td>
                        <td className="p-3 text-sm font-medium text-gray-800">
                          {req.fromStoreId?.name || "N/A"}
                        </td>
                        <td className="p-3 text-sm font-medium text-indigo-700">
                          {req.toStoreId?.name || "N/A"}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {req.requestedBy?.fullName || "N/A"}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="p-3 flex justify-center">
                          {getActionButtons(req)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredRequests.length)}</span> trên tổng số <span className="font-semibold text-gray-900">{filteredRequests.length}</span> yêu cầu
              </span>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition ${
                      currentPage === index + 1
                        ? "bg-indigo-600 text-white"
                        : "text-gray-700 hover:bg-gray-100 border border-transparent"
                    }`}
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