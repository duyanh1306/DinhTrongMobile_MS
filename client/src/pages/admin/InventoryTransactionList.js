import { useState, useEffect } from "react";
import { Search, ArrowRightLeft, Calendar } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function InventoryTransactionList() {
  const [transactions, setTransactions] = useState([]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/inventory-transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải lịch sử kho: " + error.message);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      transaction.performedBy?.fullName?.toLowerCase().includes(searchLower) ||
      transaction.itemId?.serialCode?.toLowerCase().includes(searchLower);
    
    const matchType = typeFilter === "ALL" || transaction.type === typeFilter;

    return matchSearch && matchType;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "IMPORT": return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">NHẬP KHO</span>;
      case "EXPORT": return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">XUẤT KHO</span>;
      case "TRANSFER": return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">CHUYỂN KHO</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">{type}</span>;
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-600" />
            Lịch sử giao dịch kho
          </h2>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo Serial Code hoặc Tên nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Tất cả loại giao dịch</option>
            <option value="IMPORT">Nhập kho (IMPORT)</option>
            <option value="EXPORT">Xuất kho (EXPORT)</option>
            <option value="TRANSFER">Chuyển kho (TRANSFER)</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Mã GD</th>
                <th className="p-3 font-semibold text-gray-700">Sản phẩm / Serial</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Loại GD</th>
                <th className="p-3 font-semibold text-gray-700">Từ cửa hàng</th>
                <th className="p-3 font-semibold text-gray-700">Đến cửa hàng</th>
                <th className="p-3 font-semibold text-gray-700">Nhân viên</th>
                <th className="p-3 font-semibold text-gray-700">Thời gian</th>
                <th className="p-3 font-semibold text-gray-700">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => {
                const itemName = transaction.itemId?.item_type?.name 
                              || transaction.itemId?.itemTypeId?.name 
                              || "Không xác định";

                return (
                  <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-500 font-mono">
                      {transaction._id?.substring(transaction._id.length - 6).toUpperCase()}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-800">{itemName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">SN: {transaction.itemId?.serialCode || "N/A"}</div>
                    </td>
                    <td className="p-3 text-center">
                      {getTypeBadge(transaction.type)}
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-700">
                      {transaction.fromStoreId ? transaction.fromStoreId.name : <span className="text-gray-400 italic">Bên ngoài</span>}
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-700">
                      {transaction.toStoreId ? transaction.toStoreId.name : <span className="text-gray-400 italic">Bên ngoài</span>}
                    </td>
                    <td className="p-3 text-sm text-gray-800">
                      {transaction.performedBy?.fullName || "N/A"}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="p-3 text-sm text-gray-500 max-w-[150px] truncate" title={transaction.note}>
                      {transaction.note || "-"}
                    </td>
                  </tr>
                );
              })}
              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    Không tìm thấy giao dịch nào.
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
              Hiển thị <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredTransactions.length)}</span> trên tổng số <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> giao dịch
            </span>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition ${
                    currentPage === index + 1
                      ? "bg-blue-600 text-white"
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
    </>
  );
}