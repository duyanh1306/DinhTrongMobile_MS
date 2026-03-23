import { useState, useEffect } from "react";
import { Search, Eye, X, Truck, Calendar, CheckCircle, Clock } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TransferRequestList() {
  const [requests, setRequests] = useState([]);
  const [requestDetails, setRequestDetails] = useState([]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/transfer-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách yêu cầu chuyển kho: " + error.message);
    }
  };

  const fetchRequestDetails = async (requestId) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`http://localhost:9999/api/transfer-requests/${requestId}/details`);
      if (res.ok) {
        const data = await res.json();
        setRequestDetails(data);
      } else {
        toast.error("Không thể tải chi tiết yêu cầu");
      }
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleOpenDetailModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
    fetchRequestDetails(req._id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setRequestDetails([]);
  };

  const filteredRequests = requests.filter((req) => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      req.fromStoreId?.name?.toLowerCase().includes(searchLower) ||
      req.toStoreId?.name?.toLowerCase().includes(searchLower) ||
      req.requestedBy?.fullName?.toLowerCase().includes(searchLower);
    
    const matchStatus = statusFilter === "ALL" || req.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-teal-600" />
            Yêu cầu chuyển kho
          </h2>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên cửa hàng hoặc người yêu cầu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Mã YC</th>
                <th className="p-3 font-semibold text-gray-700">Từ cửa hàng</th>
                <th className="p-3 font-semibold text-gray-700">Đến cửa hàng</th>
                <th className="p-3 font-semibold text-gray-700">Người yêu cầu</th>
                <th className="p-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="p-3 font-semibold text-gray-700">Ngày tạo</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {currentRequests.map((req) => (
                <tr key={req._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-500 font-mono">
                    #{req._id?.substring(req._id.length - 6).toUpperCase()}
                  </td>
                  <td className="p-3 font-medium text-gray-800">
                    {req.fromStoreId?.name || "N/A"}
                  </td>
                  <td className="p-3 font-medium text-teal-700">
                    {req.toStoreId?.name || "N/A"}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {req.requestedBy?.fullName || "N/A"}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="p-3 flex justify-center">
                    <button
                      onClick={() => handleOpenDetailModal(req)}
                      className="text-teal-600 hover:text-teal-800 transition bg-teal-50 p-2 rounded-full hover:bg-teal-100"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentRequests.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    Không tìm thấy yêu cầu chuyển kho nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredRequests.length)}</span> trên tổng số <span className="font-semibold text-gray-900">{filteredRequests.length}</span> yêu cầu
            </span>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition ${
                    currentPage === index + 1
                      ? "bg-teal-600 text-white"
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

      {/* --- MODAL CHI TIẾT YÊU CẦU --- */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl relative shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  Chi tiết yêu cầu #{selectedRequest._id?.substring(selectedRequest._id.length - 6).toUpperCase()}
                  {getStatusBadge(selectedRequest.status)}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                  <Clock size={14} /> Cập nhật lần cuối: {formatDate(selectedRequest.updatedAt)}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Thông tin kho</h4>
                  <p className="text-sm mb-1"><span className="text-gray-500">Từ (Kho xuất):</span> <span className="font-medium text-gray-800">{selectedRequest.fromStoreId?.name}</span></p>
                  <p className="text-sm mb-1"><span className="text-gray-500">Đến (Kho nhận):</span> <span className="font-medium text-teal-700">{selectedRequest.toStoreId?.name}</span></p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Thông tin xét duyệt</h4>
                  <p className="text-sm mb-1"><span className="text-gray-500">Người yêu cầu:</span> <span className="font-medium">{selectedRequest.requestedBy?.fullName}</span></p>
                  <p className="text-sm mb-1">
                    <span className="text-gray-500">Người duyệt:</span> 
                    <span className="font-medium ml-1">
                      {selectedRequest.approvedBy?.fullName ? (
                        <span className="text-green-600 flex items-center gap-1 inline-flex"><CheckCircle size={14}/> {selectedRequest.approvedBy.fullName}</span>
                      ) : "Chưa có"}
                    </span>
                  </p>
                  <p className="text-sm mb-1"><span className="text-gray-500">Ngày duyệt:</span> <span className="font-medium">{formatDate(selectedRequest.approvedAt)}</span></p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm"><span className="text-gray-500">Ghi chú chung:</span> <span className="italic">{selectedRequest.note || "Không có ghi chú"}</span></p>
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-3">Danh sách sản phẩm cần chuyển ({requestDetails.length})</h4>
              {isLoadingDetails ? (
                <div className="text-center py-8 text-gray-500">Đang tải danh sách sản phẩm...</div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700">Tên sản phẩm</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Serial Code</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Trạng thái SP</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Ghi chú SP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestDetails.map((detail, idx) => {
                        const itemName = detail.itemId?.item_type?.name 
                                      || detail.itemId?.itemTypeId?.name 
                                      || "Sản phẩm không xác định";

                        return (
                          <tr key={detail._id || idx} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="p-3 text-sm font-medium text-gray-800">
                              {itemName}
                            </td>
                            <td className="p-3 text-sm text-gray-600 font-mono">
                              {detail.itemId?.serialCode || "N/A"}
                            </td>
                            <td className="p-3 text-sm">
                              <span className={`px-2 py-1 text-xs rounded font-medium ${
                                detail.status === 'TRANSFERRED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {detail.status}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-gray-500 max-w-[200px] truncate" title={detail.note}>
                              {detail.note || "-"}
                            </td>
                          </tr>
                        );
                      })}
                      {requestDetails.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-sm text-gray-500">Không có dữ liệu chi tiết.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}