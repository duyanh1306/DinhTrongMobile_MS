import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  Eye,
  Search,
  X,
  Calendar,
  Smartphone,
  Package,
  Printer,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";

const InvoicePrint = ({ order, details, formatCurrency, contentRef }) => {
  return (
    <div
      ref={contentRef}
      className="p-8 bg-white text-black"
      style={{ width: "80mm", fontSize: "12px", fontFamily: "monospace" }}
    >
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">DINHTRONGMOBILE</h2>
        <p className="text-[10px]">HÓA ĐƠN GIAO DỊCH</p>
      </div>

      <div className="border-t border-b border-black border-dashed py-2 mb-4 text-[11px] space-y-1">
        <p>
          Mã đơn: #{order?._id.substring(order._id.length - 6).toUpperCase()}
        </p>
        <p>
          {order?.orderType === "SALE" ? "Người mua" : "Khách hàng"}:{" "}
          {order?.customerName}
        </p>
        <p>SĐT: {order?.customerPhone}</p>
        <p>
          Nhân viên:{" "}
          {order?.createdBy?.fullName ||
            order?.createdBy?.name ||
            order?.createdBy?.username ||
            "N/A"}
        </p>
        <p>Loại: {order?.orderType === "SALE" ? "BÁN RA" : "THU MUA"}</p>
        <p>Ngày: {new Date().toLocaleString("vi-VN")}</p>
      </div>

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-black text-[11px]">
            <th className="text-left pb-1">S.Phẩm</th>
            <th className="text-center pb-1 w-8">SL</th>
            <th className="text-right pb-1">Giá</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, idx) => (
            <tr key={idx} className="border-b border-gray-300 border-dotted">
              <td className="py-2 pr-1">
                <div className="font-bold text-[11px]">
                  {d.phoneId?.phoneModelId?.name ||
                    d.itemId?.item_type?.name ||
                    "SP"}
                </div>
                <div className="text-[9px] italic mt-0.5">
                  {d.phoneId
                    ? `Mã: ${d.phoneId._id.substring(d.phoneId._id.length - 6).toUpperCase()}`
                    : `SN: ${d.itemId?.serialCode}`}
                </div>
                <div className="text-[9px] mt-0.5">
                  Hạn BH:{" "}
                  {d.warrantyExpireDate
                    ? new Date(d.warrantyExpireDate).toLocaleDateString("vi-VN")
                    : d.warranty
                      ? "Tiêu chuẩn"
                      : "Không"}
                </div>
              </td>
              <td className="text-center align-top py-2 text-[11px]">1</td>
              <td className="text-right align-top py-2 font-bold text-[11px]">
                {formatCurrency(
                  d.purchasePrice || d.phoneId?.sellingPrice || 0,
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black pt-2 flex justify-between font-bold text-sm">
        <span>TỔNG:</span>
        <span>{formatCurrency(order?.totalPrice)}</span>
      </div>

      <div className="text-center mt-6 text-[10px]">
        <p>Cảm ơn quý khách!</p>
        <p>Hẹn gặp lại!</p>
      </div>
    </div>
  );
};

export default function SaleOrders() {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // States cho Lọc và Phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, Pending, Completed, Cancelled
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const printRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset về trang 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders");
      const data = await res.json();

      const updatedOrders = await Promise.all(
        data.map(async (order) => {
          if (order.orderType === "SALE") {
            const detailRes = await fetch(
              `http://localhost:9999/api/purchase-orders/${order._id}/details`,
            );
            if (detailRes.ok) {
              const details = await detailRes.json();

              const total = details.reduce((sum, d) => {
                const pPrice = d.phoneId ? d.phoneId.sellingPrice : 0;
                const iPrice = d.itemId
                  ? d.itemId.item_type?.price || d.itemId.price
                  : 0;

                const itemFinalPrice = d.purchasePrice || pPrice + iPrice;
                return sum + itemFinalPrice;
              }, 0);

              return { ...order, totalPrice: total };
            }
          }
          return order;
        }),
      );

      // Sắp xếp đơn mới nhất lên đầu
      setOrders(updatedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      toast.error("Lỗi tải danh sách đơn hàng");
    }
  };

  const handleOpenDetail = async (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(
        `http://localhost:9999/api/purchase-orders/${order._id}/details`,
      );
      if (res.ok) setOrderDetails(await res.json());
    } catch (err) {
      toast.error("Không thể tải chi tiết");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bill_${selectedOrder?._id.substring(0, 6)}`,
  });

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm("Xác nhận hoàn tất thanh toán và IN hóa đơn?")) return;

    try {
      const res = await fetch(
        `http://localhost:9999/api/purchase-orders/${orderId}/confirm-payment`,
        {
          method: "PATCH",
        },
      );

      if (res.ok) {
        toast.success("Xác nhận thành công!");
        const order = orders.find((o) => o._id === orderId);
        await handleOpenDetail(order);
        setTimeout(() => handlePrint(), 500);
        fetchOrders();
      }
    } catch (err) {
      toast.error("Thao tác thất bại");
    }
  };

  const handleCancelOrder = async (order) => {
    if (
      !window.confirm(
        "Xác nhận HUỶ đơn hàng này? Thao tác này không thể hoàn tác.",
      )
    )
      return;

    try {
      const res = await fetch(
        `http://localhost:9999/api/purchase-orders/${order._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Cancelled",
            totalPrice: order.totalPrice,
            note: order.note,
          }),
        },
      );

      if (res.ok) {
        toast.success("Đã hủy đơn hàng!");
        fetchOrders();
      } else {
        toast.error("Lỗi khi hủy đơn hàng");
      }
    } catch (err) {
      toast.error("Lỗi hệ thống");
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  // LỌC VÀ PHÂN TRANG
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.customerPhone?.includes(searchQuery) || o.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Giao dịch</h1>
        
        <div className="flex gap-3">
          <div className="flex items-center bg-white border rounded-lg px-3 focus-within:ring-2 focus-within:ring-orange-500">
             <Filter size={18} className="text-gray-400" />
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)}
               className="bg-transparent py-2 px-2 outline-none font-medium text-gray-600"
             >
               <option value="ALL">Tất cả trạng thái</option>
               <option value="Pending">Chờ xác nhận</option>
               <option value="Completed">Đã hoàn tất</option>
               <option value="Cancelled">Đã hủy</option>
             </select>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm tên hoặc SĐT khách..."
              value={searchQuery}
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-orange-500 outline-none"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-black tracking-wider">
                <tr>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4 text-right">Tổng tiền</th>
                <th className="p-4">Loại đơn</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {currentOrders.map((order) => (
                <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition-colors"
                >
                    <td className="p-4 font-mono text-xs text-orange-600 font-bold uppercase">
                    #{order._id.substring(order._id.length - 6)}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                    <div className="font-semibold text-gray-800">
                        {order.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                        {order.customerPhone || "N/A"}
                    </div>
                    </td>
                    <td className="p-4 font-bold text-gray-700 text-right">
                    {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="p-4">
                    <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        order.orderType === "SALE"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                        }`}
                    >
                        {order.orderType === "SALE" ? "Bán hàng" : "Thu mua"}
                    </span>
                    </td>
                    <td className="p-4 text-sm">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : order.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                        {order.status === "Completed"
                        ? "Đã hoàn tất"
                        : order.status === "Cancelled"
                        ? "Đã hủy"
                        : "Chờ xác nhận"}
                    </span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                    <button
                        onClick={() => handleOpenDetail(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                        <Eye size={18} />
                    </button>
                    {order.status === "Pending" && (
                        <>
                        <button
                            onClick={() => handleConfirmPayment(order._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                            title="Xác nhận"
                        >
                            <CheckCircle size={18} />
                        </button>
                        <button
                            onClick={() => handleCancelOrder(order)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            title="Huỷ đơn"
                        >
                            <XCircle size={18} />
                        </button>
                        </>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {currentOrders.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                Không tìm thấy đơn hàng nào phù hợp.
            </div>
        )}

        {/* Thanh Phân trang */}
        {totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} / {filteredOrders.length}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1}
                        className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                    >
                        <ChevronLeft size={16}/>
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold bg-white border rounded">{currentPage}</span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                        className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                    >
                        <ChevronRight size={16}/>
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Modal Chi tiết đơn hàng */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">
                Chi tiết giao dịch #
                {selectedOrder._id
                  .substring(selectedOrder._id.length - 6)
                  .toUpperCase()}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow-md"
                >
                  <Printer size={16} /> IN BILL
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-8 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase">
                    Khách hàng
                  </p>
                  <p className="font-bold text-gray-800 text-lg">
                    {selectedOrder.customerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.customerPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-black uppercase">
                    Tổng thanh toán
                  </p>
                  <p className="text-2xl font-black text-orange-600">
                    {formatCurrency(selectedOrder.totalPrice)}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-center">Bảo hành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.map((detail, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2 font-bold italic">
                            {detail.phoneId ? (
                              <Smartphone size={16} className="text-blue-500" />
                            ) : (
                              <Package size={16} className="text-emerald-500" />
                            )}
                            {detail.phoneId?.phoneModelId?.name ||
                              detail.itemId?.item_type?.name ||
                              "SP"}
                          </div>
                          <div className="text-[10px] text-gray-400 ml-6">
                            {detail.phoneId
                              ? `Mã: ${detail.phoneId._id.substring(detail.phoneId._id.length - 6).toUpperCase()}`
                              : `SN: ${detail.itemId?.serialCode}`}
                          </div>
                        </td>
                        <td className="p-3 text-right font-black">
                          {formatCurrency(
                            detail.purchasePrice ||
                              detail.phoneId?.sellingPrice ||
                              0,
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {detail.warranty ? (
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                              CÓ BH
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">
                              KHÔNG
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border rounded-lg font-bold hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>

            <div className="hidden">
              <InvoicePrint
                contentRef={printRef}
                order={selectedOrder}
                details={orderDetails}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}