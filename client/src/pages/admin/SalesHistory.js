import { useState, useEffect } from "react";
import { Search, Eye, X, FileText, Calendar, Smartphone, Package } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SalesHistory() {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders");
      if (res.ok) {
        const data = await res.json();
        
        // ĐỒNG BỘ GIÁ: Tính toán lại tổng tiền dựa trên chi tiết của từng đơn hàng
        const updatedOrders = await Promise.all(data.map(async (order) => {
          const detailRes = await fetch(`http://localhost:9999/api/purchase-orders/${order._id}/details`);
          if (detailRes.ok) {
            const details = await detailRes.json();
            // Cộng dồn: sellingPrice của Phone + price của ItemType (Giá bán)
            const total = details.reduce((sum, d) => {
              const pPrice = d.phoneId?.sellingPrice || 0;
              const iPrice = d.itemId?.item_type?.price || 0;
              return sum + pPrice + iPrice;
            }, 0);
            return { ...order, totalPrice: total };
          }
          return order;
        }));

        const salesOrders = updatedOrders.filter(order => order.orderType === "SALE");
        setOrders(salesOrders);
      }
    } catch (error) {
      toast.error("Lỗi khi đồng bộ giá bán hàng: " + error.message);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`http://localhost:9999/api/purchase-orders/${orderId}/details`);
      if (res.ok) {
        const data = await res.json();
        setOrderDetails(data);
      } else {
        toast.error("Không thể tải chi tiết đơn hàng");
      }
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết: " + error.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleOpenDetailModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    fetchOrderDetails(order._id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setOrderDetails([]);
  };

  const calculateGrandTotal = () => {
    return orderDetails.reduce((total, detail) => {
      const phonePrice = detail.phoneId?.sellingPrice || 0;
      const itemPrice = detail.itemId?.item_type?.price || 0;
      return total + phonePrice + itemPrice;
    }, 0);
  };

  const filteredOrders = orders.filter((order) => {
    const matchSearch = order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        order.customerPhone?.includes(searchQuery);
    const matchStatus = statusFilter === "ALL" || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Completed": return "Đã hoàn thành";
      case "Pending": return "Đang xử lý";
      case "Cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const getOrderTypeText = (type) => {
    switch (type) {
      case "PURCHASE": return "Thu mua";
      case "SALE": return "Bán hàng";
      case "REPAIR": return "Sửa chữa";
      default: return type;
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Lịch sử bán hàng
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc SĐT khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Completed">Đã hoàn thành</option>
            <option value="Pending">Đang xử lý</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Mã đơn</th>
                <th className="p-3 font-semibold text-gray-700">Khách hàng</th>
                <th className="p-3 font-semibold text-gray-700">Tổng tiền</th>
                <th className="p-3 font-semibold text-gray-700">Ngày tạo</th>
                <th className="p-3 font-semibold text-gray-700">Loại đơn</th>
                <th className="p-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-600">
                    #{order._id?.substring(order._id.length - 6).toUpperCase()}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="p-3 font-semibold text-red-600">
                    {/* Hiển thị tổng tiền đã được tính toán lại */}
                    {formatCurrency(order.totalPrice)}
                  </td>
                  <td className="p-3 text-gray-600">
                    {formatDate(order.purchaseOrderDate)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 font-medium">
                      {getOrderTypeText(order.orderType)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="p-3 flex justify-center">
                    <button
                      onClick={() => handleOpenDetailModal(order)}
                      className="text-blue-500 hover:text-blue-700 transition bg-blue-50 p-2 rounded-full hover:bg-blue-100"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
             <span className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
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

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl relative shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Chi tiết đơn {getOrderTypeText(selectedOrder.orderType).toLowerCase()} #{selectedOrder._id?.substring(selectedOrder._id.length - 6).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <Calendar size={14} /> {formatDate(selectedOrder.purchaseOrderDate)}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Thông tin khách hàng</h4>
                  <p className="text-sm mb-1"><span className="text-gray-500">Tên:</span> <span className="font-medium">{selectedOrder.customerName}</span></p>
                  <p className="text-sm mb-1"><span className="text-gray-500">SĐT:</span> <span className="font-medium">{selectedOrder.customerPhone}</span></p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Thông tin đơn hàng</h4>
                  <p className="text-sm mb-1"><span className="text-gray-500">Nhân viên bán:</span> <span className="font-medium">{selectedOrder.createdBy?.fullName || "N/A"}</span></p>
                  <p className="text-sm mb-1"><span className="text-gray-500">Cửa hàng:</span> <span className="font-medium">{selectedOrder.storeId?.name || "N/A"}</span></p>
                  <p className="text-sm mb-1">
                    <span className="text-gray-500">Tổng thanh toán:</span> 
                    <span className="font-bold text-red-600 ml-2">
                      {formatCurrency(calculateGrandTotal())}
                    </span>
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-3">Danh sách sản phẩm ({orderDetails.length})</h4>
              {isLoadingDetails ? (
                <div className="text-center py-8 text-gray-500">Đang tải chi tiết sản phẩm...</div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700">Sản phẩm / Định danh</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Giá</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Bảo hành</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Hạn bảo hành</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.map((detail, idx) => {
                        let subItems = [];
                        if (detail.phoneId) {
                          subItems.push({
                            name: detail.phoneId?.phoneModelId?.name || "Điện thoại",
                            identifier: `IMEI: ${detail.phoneId?.imei || "N/A"}`,
                            extraInfo: `${detail.phoneId?.colorName || ""} - ${detail.phoneId?.capacity || ""}`,
                            price: detail.phoneId?.sellingPrice || 0,
                            isPhone: true
                          });
                        }
                        if (detail.itemId) {
                          subItems.push({
                            name: detail.itemId?.item_type?.name || detail.itemId?.name || "Linh kiện",
                            identifier: `SN: ${detail.itemId?.serialCode || "N/A"}`,
                            extraInfo: "",
                            price: detail.itemId?.item_type?.price || 0,
                            isPhone: false
                          });
                        }

                        return subItems.map((item, sIdx) => (
                          <tr key={`${detail._id}-${sIdx}`} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-sm text-gray-800">
                              <div className="flex items-center gap-2">
                                {item.isPhone ? <Smartphone size={16} className="text-blue-500"/> : <Package size={16} className="text-orange-500"/>}
                                <div className="font-semibold">{item.name}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="bg-gray-100 px-1 py-0.5 rounded font-mono">{item.identifier}</span>
                                {item.extraInfo && <span className="ml-2 text-blue-600">{item.extraInfo}</span>}
                              </div>
                            </td>
                            <td className="p-3 text-sm font-semibold text-gray-700">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="p-3 text-sm text-center">
                              {detail.warranty ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Có</span>
                              ) : "Không"}
                            </td>
                            <td className="p-3 text-sm text-gray-600 text-center">
                              {detail.warranty && detail.warrantyExpireDate ? formatDate(detail.warrantyExpireDate) : "-"}
                            </td>
                            <td className="p-3 text-sm text-gray-500 italic">
                              {detail.note || "-"}
                            </td>
                          </tr>
                        ));
                      })}
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