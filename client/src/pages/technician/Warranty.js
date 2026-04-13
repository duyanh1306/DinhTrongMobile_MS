import { useState, useEffect } from "react";
import { Shield, RefreshCw, Plus, Search, Filter, CheckCircle, XCircle, Clock, Wrench } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../../components/technician/shared/LoadingSpinner";
import {
  fetchWarrantiesApi,
  fetchStoresApi,
  fetchPhonesApi,
  createWarrantyApi,
  processWarrantyApi,
  completeWarrantyApi,
  deleteWarrantyApi,
} from "../../api/technician/warranty";

export default function Warranty() {
  const [warranties, setWarranties] = useState([]);
  const [filteredWarranties, setFilteredWarranties] = useState([]);
  const [stores, setStores] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    storeId: "ALL",
    search: "",
  });

  // Form state for creating warranty
  const [formData, setFormData] = useState({
    storeId: "",
    customerName: "",
    customerPhone: "",
    phoneId: "",
    phoneModel: "",
    serialCode: "",
    purchaseDate: "",
    issueDescription: "",
  });

  const [processData, setProcessData] = useState({
    action: "",
    notes: "",
  });

  useEffect(() => {
    fetchWarranties();
    fetchStores();
    fetchPhones();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [warranties, filters]);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const data = await fetchWarrantiesApi();
      setWarranties(data);
      setFilteredWarranties(data);
      setError(null);
    } catch (err) {
      setError("Lỗi tải danh sách bảo hành");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    const data = await fetchStoresApi();
    setStores(data);
  };

  const fetchPhones = async () => {
    const data = await fetchPhonesApi();
    setPhones(data);
  };

  const applyFilters = () => {
    let filtered = [...warranties];

    if (filters.status !== "ALL") {
      filtered = filtered.filter((w) => w.status === filters.status);
    }

    if (filters.storeId !== "ALL") {
      filtered = filtered.filter((w) => w.storeId._id === filters.storeId);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.customerName.toLowerCase().includes(searchLower) ||
          w.serialCode.toLowerCase().includes(searchLower) ||
          w.phoneModel.toLowerCase().includes(searchLower)
      );
    }

    setFilteredWarranties(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateWarranty = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const payload = {
        ...formData,
        createdBy: user?._id || user?.id,
      };
      await createWarrantyApi(payload);
      toast.success("Đã tạo yêu cầu bảo hành thành công");
      setShowCreateModal(false);
      setFormData({
        storeId: "",
        customerName: "",
        customerPhone: "",
        phoneId: "",
        phoneModel: "",
        serialCode: "",
        purchaseDate: "",
        issueDescription: "",
      });
      fetchWarranties();
    } catch (err) {
      toast.error("Lỗi tạo yêu cầu bảo hành");
      console.error(err);
    }
  };

  const handleProcessWarranty = async (e) => {
    e.preventDefault();
    try {
      await processWarrantyApi(selectedWarranty._id, processData);
      toast.success("Đã xử lý yêu cầu bảo hành");
      setShowProcessModal(false);
      setProcessData({
        action: "",
        notes: "",
      });
      setSelectedWarranty(null);
      fetchWarranties();
    } catch (err) {
      toast.error("Lỗi xử lý yêu cầu bảo hành");
      console.error(err);
    }
  };

  const handleCompleteWarranty = async (id) => {
    try {
      await completeWarrantyApi(id);
      toast.success("Đã hoàn thành yêu cầu bảo hành");
      fetchWarranties();
    } catch (err) {
      toast.error("Lỗi hoàn thành yêu cầu bảo hành");
      console.error(err);
    }
  };

  const handleDeleteWarranty = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa yêu cầu bảo hành này?")) return;
    try {
      await deleteWarrantyApi(id);
      toast.success("Đã xóa yêu cầu bảo hành");
      fetchWarranties();
    } catch (err) {
      toast.error("Lỗi xóa yêu cầu bảo hành");
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Pending":
        return "Chờ xử lý";
      case "In Progress":
        return "Đang xử lý";
      case "Completed":
        return "Đã hoàn thành";
      case "Rejected":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const getWarrantyTypeBadge = (type) => {
    return "bg-cyan-100 text-cyan-700 border-cyan-200";
  };

  const getWarrantyTypeText = (type) => {
    return "Sửa chữa";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getDaysSincePurchase = (purchaseDate) => {
    if (!purchaseDate) return 0;
    const purchase = new Date(purchaseDate);
    const now = new Date();
    return Math.floor((now - purchase) / (1000 * 60 * 60 * 24));
  };

  if (loading && warranties.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="md" text="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-600" /> Quản lý Bảo hành
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Tạo yêu cầu bảo hành
          </button>
          <button
            onClick={fetchWarranties}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên, Serial Code, model..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="Pending">Chờ xử lý</option>
              <option value="In Progress">Đang xử lý</option>
              <option value="Completed">Đã hoàn thành</option>
              <option value="Rejected">Đã từ chối</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng</label>
            <select
              value={filters.storeId}
              onChange={(e) => handleFilterChange("storeId", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Warranty List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thiết bị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày mua
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại bảo hành
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWarranties.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Không có yêu cầu bảo hành nào
                  </td>
                </tr>
              ) : (
                filteredWarranties.map((warranty) => (
                  <tr key={warranty._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {warranty.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {warranty.customerPhone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {warranty.phoneModel}
                      </div>
                      <div className="text-xs text-gray-500">
                        {warranty.storeId?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warranty.serialCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(warranty.purchaseDate)}</div>
                      <div className="text-xs text-gray-500">
                        {getDaysSincePurchase(warranty.purchaseDate)} ngày
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getWarrantyTypeBadge(
                          warranty.warrantyType
                        )}`}
                      >
                        {getWarrantyTypeText(warranty.warrantyType)}
                      </span>
                      {warranty.isNewDevice && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Mới mua
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(
                          warranty.status
                        )}`}
                      >
                        {getStatusText(warranty.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {warranty.status === "Pending" && (
                          <button
                            onClick={() => {
                              setSelectedWarranty(warranty);
                              setProcessData({
                                action: "repair",
                                notes: "",
                              });
                              setShowProcessModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xử lý"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}
                        {warranty.status === "In Progress" && (
                          <button
                            onClick={() => handleCompleteWarranty(warranty._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Hoàn thành"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(warranty.status === "Pending" || warranty.status === "Rejected") && (
                          <button
                            onClick={() => handleDeleteWarranty(warranty._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Warranty Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Tạo yêu cầu bảo hành mới</h3>
            </div>
            <form onSubmit={handleCreateWarranty} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cửa hàng *
                  </label>
                  <select
                    required
                    value={formData.storeId}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Chọn cửa hàng</option>
                    {stores.map((store) => (
                      <option key={store._id} value={store._id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serialCode}
                    onChange={(e) => setFormData({ ...formData, serialCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model điện thoại *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phoneModel}
                    onChange={(e) => setFormData({ ...formData, phoneModel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày mua *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả vấn đề *
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Tạo yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Warranty Modal */}
      {showProcessModal && selectedWarranty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Xử lý yêu cầu bảo hành</h3>
            </div>
            <form onSubmit={handleProcessWarranty} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Thông tin yêu cầu</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="ml-2 font-medium">{selectedWarranty.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Serial Code:</span>
                    <span className="ml-2 font-medium">{selectedWarranty.serialCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Model:</span>
                    <span className="ml-2 font-medium">{selectedWarranty.phoneModel}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Loại bảo hành:</span>
                    <span className="ml-2 font-medium">
                      {getWarrantyTypeText(selectedWarranty.warrantyType)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Vấn đề:</span>
                  <p className="mt-1 text-gray-900">{selectedWarranty.issueDescription}</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900">Bảo hành sửa chữa</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      Đơn sửa chữa bảo hành sẽ được tạo tự động.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú xử lý
                </label>
                <textarea
                  rows="3"
                  value={processData.notes}
                  onChange={(e) => setProcessData({ ...processData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProcessModal(false);
                    setSelectedWarranty(null);
                    setProcessData({ action: "", notes: "" });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Xử lý
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
