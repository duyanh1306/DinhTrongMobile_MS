import { useState, useEffect } from "react";
import { Search, ArrowRightLeft } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// IMPORT TỪ FILE API
import { fetchTransactionsApi } from "../../api/admin/inventoryTransaction";

export default function InventoryTransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  // ==============================================================
  // GỌI API QUA HÀM ĐÃ TÁCH
  // ==============================================================
  const loadTransactions = async () => {
    setLoading(true);
    const data = await fetchTransactionsApi();
    if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchQuery.toLowerCase();
    
    // Xử lý an toàn khi truy cập các thuộc tính có thể null
    const phoneName = transaction.phoneId?.phoneModelId?.name || "";
    const itemName = transaction.itemId?.name || "";
    const note = transaction.note || "";
    
    const matchSearch = 
      phoneName.toLowerCase().includes(searchLower) ||
      itemName.toLowerCase().includes(searchLower) ||
      note.toLowerCase().includes(searchLower);
    
    const matchType = typeFilter === "ALL" || transaction.transactionType === typeFilter;

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
      case "INBOUND": return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">NHẬP KHO</span>;
      case "OUTBOUND": return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">XUẤT KHO</span>;
      case "REPAIR_CONSUMPTION": return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-bold">TIÊU HAO / RÃ XÁC</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-bold">{type || "N/A"}</span>;
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
              placeholder="Tìm tên sản phẩm hoặc ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
          >
            <option value="ALL">Tất cả giao dịch</option>
            <option value="INBOUND">Nhập kho (INBOUND)</option>
            <option value="OUTBOUND">Xuất kho (OUTBOUND)</option>
            <option value="REPAIR_CONSUMPTION">Tiêu hao / Rã xác</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 relative">
           {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
           )}
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-200">
                <th className="p-3 font-semibold text-gray-700 uppercase text-xs">Mã GD</th>
                <th className="p-3 font-semibold text-gray-700 uppercase text-xs">Sản phẩm / Serial</th>
                <th className="p-3 font-semibold text-gray-700 uppercase text-xs text-center">Loại GD</th>
                <th className="p-3 font-semibold text-gray-700 uppercase text-xs">Cửa hàng</th>
                <th className="p-3 font-semibold text-gray-700 uppercase text-xs">Tham chiếu</th>
                <th className="p-3 font-semibold text-gray-700 uppercase text-xs">Thời gian</th>
                <th className="p-3 font-semibold text-gray-700 uppercase text-xs">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {!loading && currentTransactions.map((transaction) => {
                const isPhone = !!transaction.phoneId;
                
                // An toàn khi truy cập nested object
                const phoneName = transaction.phoneId?.phoneModelId?.name || transaction.phoneId?.phoneModelId;
                const itemName = transaction.itemId?.name;
                
                const productName = isPhone ? phoneName : itemName;
                
                const phoneIdCode = transaction.phoneId?._id ? transaction.phoneId._id.substring(transaction.phoneId._id.length - 6).toUpperCase() : "N/A";
                const itemSerial = transaction.itemId?.serialCode || "N/A";
                
                const identifier = isPhone ? `Mã: ${phoneIdCode}` : `SN: ${itemSerial}`;

                const tranId = transaction._id ? transaction._id.substring(transaction._id.length - 6).toUpperCase() : "N/A";

                return (
                  <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-500 font-mono font-bold">
                      #{tranId}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-800 text-sm">{productName || "Sản phẩm không xác định (Đã xóa)"}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{identifier}</div>
                    </td>
                    <td className="p-3 text-center">
                      {getTypeBadge(transaction.transactionType)}
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-700">
                      {transaction.storeId?.name || "N/A"}
                    </td>
                    <td className="p-3 text-sm text-gray-600 font-medium">
                      {transaction.referenceType || "N/A"}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate italic" title={transaction.note}>
                      {transaction.note || "-"}
                    </td>
                  </tr>
                );
              })}
              {!loading && currentTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
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