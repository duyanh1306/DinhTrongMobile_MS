import { useState, useEffect } from "react";
import { Search, Eye, X, Hammer, Package } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// IMPORT TỪ FILE API
import { fetchRepairOrdersApi, fetchRepairOrderDetailsApi } from "../../api/admin/repairHistory";

export default function RepairHistory() {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // ==============================================================
  // GỌI API QUA HÀM ĐÃ TÁCH
  // ==============================================================
  useEffect(() => { 
    loadOrders(); 
  }, []);

  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchQuery, statusFilter]);

  const loadOrders = async () => {
    const data = await fetchRepairOrdersApi();
    setOrders(data);
  };

  const loadOrderDetails = async (orderId) => {
    setIsLoadingDetails(true);
    const data = await fetchRepairOrderDetailsApi(orderId);
    setOrderDetails(data);
    setIsLoadingDetails(false);
  };

  // ==============================================================
  // LOGIC HIỂN THỊ
  // ==============================================================
  const calculateGrandTotal = () => {
    return orderDetails.reduce((total, d) => {
      const servicePrice = d.serviceId?.price || 0;
      const itemsPrice = d.itemIds?.reduce((iSum, item) => iSum + (item.price || item.item_type?.price || 0), 0) || 0;
      return total + servicePrice + itemsPrice;
    }, 0);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const formatDate = (date) => date ? new Date(date).toLocaleString('vi-VN') : "N/A";

  const getStatusBadge = (s) => {
    switch (s) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders.filter((o) => 
    (o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customerPhone?.includes(searchQuery)) && 
    (statusFilter === "ALL" || o.status === statusFilter)
  );
  const currentOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6"><Hammer className="text-orange-500" /> Lịch sử sửa chữa</h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" placeholder="Tìm tên/SĐT khách hàng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-md bg-white">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Pending">Chờ xử lý</option>
            <option value="In Progress">Đang sửa chữa</option>
            <option value="Completed">Đã hoàn thành</option>
          </select>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y">
                <th className="p-3 font-semibold text-gray-700">Mã đơn</th>
                <th className="p-3 font-semibold text-gray-700">Khách hàng</th>
                <th className="p-3 font-semibold text-gray-700">Tổng tiền</th>
                <th className="p-3 font-semibold text-gray-700">Ngày tạo</th>
                <th className="p-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="p-3 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">#{order._id?.substring(order._id.length - 6).toUpperCase()}</td>
                  <td className="p-3">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="p-3 font-bold text-red-600">{formatCurrency(order.totalPrice)}</td>
                  <td className="p-3 text-sm">{formatDate(order.repairOrderDate)}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => { 
                        setSelectedOrder(order); 
                        setIsModalOpen(true); 
                        loadOrderDetails(order._id); 
                      }} 
                      className="p-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500 italic">Không có đơn sửa chữa nào!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => paginate(i + 1)} className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-orange-500 text-white" : "hover:bg-gray-100"}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL CHI TIẾT --- */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold">Hóa đơn sửa chữa #{selectedOrder._id?.substring(selectedOrder._id.length - 6).toUpperCase()}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase text-[10px]">Khách hàng</p>
                  <p className="font-medium text-gray-800">{selectedOrder.customerName} - {selectedOrder.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase text-[10px]">Tổng thanh toán</p>
                  <p className="text-2xl font-black text-red-600">{formatCurrency(calculateGrandTotal())}</p>
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Hammer size={18}/> Dịch vụ & Linh kiện thay thế</h4>
              {isLoadingDetails ? (
                <div className="py-10 text-center text-gray-400 italic">Đang tải dữ liệu chi tiết...</div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Hạng mục</th>
                        <th className="p-3">Loại</th>
                        <th className="p-3 text-right">Đơn giá</th>
                        <th className="p-3">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.length === 0 ? (
                          <tr><td colSpan="4" className="text-center p-4 text-gray-500 italic">Không có chi tiết nào cho đơn này</td></tr>
                      ) : (
                        orderDetails.map((detail, idx) => {
                          let rows = [];
                          // 1. Dịch vụ sửa chữa (serviceId)
                          if (detail.serviceId) {
                            rows.push({
                              icon: <Hammer size={16} className="text-blue-500"/>,
                              name: detail.serviceId.name,
                              badge: "Dịch vụ",
                              style: "bg-blue-50 text-blue-700",
                              price: detail.serviceId.price || 0
                            });
                          }
                          // 2. Danh sách linh kiện thay thế (itemIds)
                          detail.itemIds?.forEach(item => {
                            rows.push({
                              icon: <Package size={16} className="text-orange-500"/>,
                              name: `${item.item_type?.name || item.name} (SN: ${item.serialCode || "N/A"})`,
                              badge: "Linh kiện",
                              style: "bg-orange-50 text-orange-700",
                              price: item.price || item.item_type?.price || 0
                            });
                          });

                          return rows.map((row, rIdx) => (
                            <tr key={`${detail._id}-${rIdx}`} className="border-t hover:bg-gray-50 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">{row.icon} <span className="font-semibold">{row.name}</span></div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.style}`}>{row.badge}</span>
                                {detail.type === "WARRANTY" && <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Bảo hành</span>}
                              </td>
                              <td className="p-3 text-right font-bold text-gray-700">{formatCurrency(row.price)}</td>
                              <td className="p-3 text-xs italic text-gray-500 max-w-[150px] truncate">{detail.note || "-"}</td>
                            </tr>
                          ));
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-800 text-white rounded font-bold shadow-md">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}