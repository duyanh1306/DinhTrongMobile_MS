import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  X,
  FileText,
  Calendar,
  Smartphone,
  Package,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ManagerPurchaseHistory() {
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
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:9999/api/purchase-orders/manager/store-purchases`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (!Array.isArray(data)) {
          toast.error("Phản hồi từ máy chủ không hợp lệ.");
          setOrders([]);
          return;
        }
        const updatedOrders = await Promise.all(
          data.map(async (order) => {
            const detailRes = await fetch(
              `http://localhost:9999/api/purchase-orders/${order._id}/details`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (detailRes.ok) {
              const details = await detailRes.json();

              if (details.length > 0) {
                const total = details.reduce((sum, d) => {
                  const pPrice =
                    d.phoneId?.importPrice || d.purchasePrice || 0;
                  const iPrice =
                    d.itemId?.baseCost || d.itemId?.price || 0;
                  const subItemsTotal =
                    d.items?.reduce(
                      (s, item) => s + (item.purchasePrice || 0),
                      0,
                    ) || 0;
                  return sum + pPrice + iPrice + subItemsTotal;
                }, 0);
                return { ...order, totalPrice: total };
              }
            }
            return order;
          }),
        );
        setOrders(updatedOrders);
      } else if (res.status === 403) {
        toast.error("Bạn không có quyền xem lịch sử thu mua.");
        setOrders([]);
      } else {
        toast.error("Không tải được danh sách đơn thu mua.");
        setOrders([]);
      }
    } catch (error) {
      toast.error("Lỗi tải dữ liệu: " + error.message);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setIsLoadingDetails(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:9999/api/purchase-orders/${orderId}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (res.ok) setOrderDetails(await res.json());
    } catch (error) {
      toast.error("Lỗi tải chi tiết");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const calculateGrandTotal = () => {
    return orderDetails.reduce((total, d) => {
      const pPrice = d.phoneId?.importPrice || d.purchasePrice || 0;
      const iPrice = d.itemId?.baseCost || d.itemId?.price || 0;
      const subItemsTotal =
        d.items?.reduce((s, item) => s + (item.purchasePrice || 0), 0) || 0;
      return total + pPrice + iPrice + subItemsTotal;
    }, 0);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  const formatDate = (date) =>
    date ? new Date(date).toLocaleString("vi-VN") : "N/A";
  const getStatusBadge = (s) =>
    s === "Completed"
      ? "bg-green-100 text-green-800"
      : s === "Pending" || s === "Pending_Tech"
        ? "bg-yellow-100 text-yellow-800"
        : s === "Cancelled"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800";

  const filteredOrders = orders.filter(
    (o) =>
      (o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone?.includes(searchQuery)) &&
      (statusFilter === "ALL" || o.status === statusFilter),
  );

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <FileText className="text-blue-600" /> Lịch sử Giao dịch
        </h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm tên/SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md bg-white outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Completed">Đã hoàn thành</option>
            <option value="Pending_Tech">Chờ kỹ thuật</option>
            <option value="Pending">Đang xử lý</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Mã đơn</th>
                <th className="p-3 font-semibold text-gray-700">Đối tác</th>
                <th className="p-3 font-semibold text-gray-700">Tổng tiền</th>
                <th className="p-3 font-semibold text-gray-700">Ngày tạo</th>
                <th className="p-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="p-3 font-semibold text-gray-700 text-center">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">
                    #{order._id?.substring(order._id.length - 6).toUpperCase()}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customerPhone}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-red-600">
                    {formatCurrency(order.totalPrice)}
                  </td>
                  <td className="p-3 text-sm">
                    {formatDate(order.purchaseOrderDate)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsModalOpen(true);
                        fetchOrderDetails(order._id);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-gray-500 italic"
                  >
                    Không có đơn thu mua nào cho cửa hàng của bạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold">
                Chi tiết giao dịch #
                {selectedOrder._id
                  ?.substring(selectedOrder._id.length - 6)
                  .toUpperCase()}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <p className="text-xs text-gray-500 font-bold">ĐỐI TÁC</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold">TỔNG TIỀN</p>
                  <p className="text-xl font-black text-red-600">
                    {formatCurrency(
                      orderDetails.length > 0
                        ? calculateGrandTotal()
                        : selectedOrder.totalPrice,
                    )}
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Sản phẩm</th>
                    <th className="p-3 text-right">Giá bán</th>
                    <th className="p-3 text-center">BH</th>
                    <th className="p-3 text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.length > 0 ? (
                    // LOGIC CŨ KHI ĐƠN CÓ CHI TIẾT
                    orderDetails.map((detail, idx) => {
                      let rows = [];
                      if (detail.phoneId)
                        rows.push({
                          icon: (
                            <Smartphone size={16} className="text-blue-500" />
                          ),
                          name: detail.phoneId.phoneModelId?.name,
                          code: `IMEI: ${detail.phoneId.imei}`,
                          price:
                            detail.phoneId?.importPrice ||
                            detail.purchasePrice,
                        });
                      if (detail.itemId)
                        rows.push({
                          icon: (
                            <Package size={16} className="text-orange-500" />
                          ),
                          name: detail.itemId.item_type?.name,
                          code: `SN: ${detail.itemId.serialCode}`,
                          price:
                            detail.itemId?.baseCost ||
                            detail.itemId?.price ||
                            detail.purchasePrice,
                        });
                      detail.items?.forEach((sub) =>
                        rows.push({
                          icon: <Package size={14} className="text-gray-400" />,
                          name: sub.name,
                          code: "Linh kiện kèm máy",
                          price: sub.purchasePrice || sub.salePrice,
                        }),
                      );
                      return rows.map((row, rIdx) => (
                        <tr key={`${detail._id}-${rIdx}`} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {row.icon} <b>{row.name}</b>
                            </div>
                            <div className="text-xs font-mono text-gray-400">
                              {row.code}
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold">
                            {formatCurrency(row.price)}
                          </td>
                          <td className="p-3 text-center text-xs">
                            {detail.warranty ? (
                              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                Có
                              </span>
                            ) : (
                              "Không"
                            )}
                          </td>
                          <td className="p-3 text-xs italic text-gray-500">
                            {detail.note}
                          </td>
                        </tr>
                      ));
                    })
                  ) : // GIAO DIỆN DỰ PHÒNG KHI ĐƠN BỊ HUỶ SỚM (KHÔNG CÓ DETAILS)
                  selectedOrder.tempPhoneData &&
                    selectedOrder.tempPhoneData.imei ? (
                    <tr className="border-t bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Smartphone size={16} />{" "}
                          <b>
                            {selectedOrder.tempPhoneData.phoneModelId?.name ||
                              "Máy khách mua"}
                          </b>
                        </div>
                        <div className="text-xs font-mono text-gray-400">
                          IMEI: {selectedOrder.tempPhoneData.imei}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-gray-500">
                        {formatCurrency(selectedOrder.totalPrice)}
                      </td>
                      <td className="p-3 text-center text-xs text-gray-400">
                        —
                      </td>
                      <td className="p-3 text-xs italic text-red-500">
                        {selectedOrder.note || "Đơn huỷ chưa xuất kho"}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-4 text-center text-gray-400 italic"
                      >
                        Không có thông tin thiết bị
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded font-bold"
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