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
  Filter,
  ShoppingCart,
  Wrench,
  Download,
  Phone // <--- THÊM ĐÚNG CHỮ NÀY VÀO ĐÂY
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import "react-toastify/dist/ReactToastify.css";

// Hàm hỗ trợ đọc số tiền thành chữ
const docSoThanhChu = (so) => {
  if (!so || so === 0) return "Không đồng";
  const chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const hang = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let str = so.toString();
  let result = "";
  let hangCount = 0;

  while (str.length > 0) {
    let chunk = str.slice(-3);
    str = str.slice(0, -3);
    if (parseInt(chunk) !== 0) {
      let chunkStr = "";
      for (let i = 0; i < chunk.length; i++) {
        let digit = parseInt(chunk[chunk.length - 1 - i]);
        if (i === 0) chunkStr = chuSo[digit] + " " + chunkStr;
        if (i === 1) chunkStr = chuSo[digit] + " mươi " + chunkStr;
        if (i === 2) chunkStr = chuSo[digit] + " trăm " + chunkStr;
      }
      chunkStr = chunkStr.replace("không mươi", "lẻ");
      chunkStr = chunkStr.replace("một mươi", "mười");
      chunkStr = chunkStr.replace("mươi năm", "mươi lăm");
      chunkStr = chunkStr.replace("mười năm", "mười lăm");
      chunkStr = chunkStr.replace("mươi một", "mươi mốt");
      
      result = chunkStr.trim() + " " + hang[hangCount] + " " + result;
    }
    hangCount++;
  }
  
  result = result.replace(/không trăm lẻ không/g, "");
  result = result.replace(/không trăm lẻ/g, "lẻ");
  result = result.trim() + " đồng";
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// ==================================================================
// COMPONENT: HÓA ĐƠN KHỔ A4 (PHIẾU XUẤT KHO KIÊM BẢO HÀNH)
// ==================================================================
const InvoicePrintA4 = ({ order, details, formatCurrency, contentRef, activeTab }) => {
  // Xác định Tiêu đề hóa đơn dựa vào loại Tab
  let invoiceTitle = "PHIẾU XUẤT KHO KIÊM BẢO HÀNH";
  if (activeTab === "PURCHASE") invoiceTitle = "PHIẾU BIÊN NHẬN THU MUA MÁY CŨ";
  if (activeTab === "REPAIR") invoiceTitle = "PHIẾU THANH TOÁN KIÊM BẢO HÀNH SỬA CHỮA";

  return (
    <div
      ref={contentRef}
      className="bg-white text-black p-10"
      style={{ 
        width: "210mm", 
        minHeight: "297mm", 
        fontFamily: "'Times New Roman', Times, serif",
        margin: "0 auto"
      }}
    >
      <style type="text/css" media="print">
        {`@page { size: A4 portrait; margin: 10mm; }`}
      </style>

      {/* HEADER CÔNG TY */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
        <div>
            <h1 className="text-xl font-black uppercase tracking-wide">CÔNG TY TNHH DINH TRONG MOBILE</h1>
            <p className="text-sm mt-1"><strong>Showroom:</strong> {order?.storeId?.address || "Hà Nội"}</p>
            <p className="text-sm"><strong>Điện thoại:</strong> {order?.storeId?.hotline || "0987.654.321"}</p>
            <p className="text-sm"><strong>Website:</strong> dinhtrongmobile.vn | <strong>Email:</strong> cskh@dinhtrongmobile.vn</p>
        </div>
        <div className="text-right">
            <div className="w-20 h-20 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 mb-1">
                QR CODE
            </div>
            <p className="text-[10px] italic">Quét để tra cứu bảo hành</p>
        </div>
      </div>

      {/* TIÊU ĐỀ HÓA ĐƠN */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase">{invoiceTitle}</h2>
        <p className="text-sm italic mt-1">Ngày {dayjs(order?.createdAt || new Date()).format('DD')} tháng {dayjs(order?.createdAt || new Date()).format('MM')} năm {dayjs(order?.createdAt || new Date()).format('YYYY')}</p>
        <p className="text-sm font-bold mt-1">Số: #{order?._id?.substring(order._id.length - 8).toUpperCase()}</p>
      </div>

      {/* THÔNG TIN KHÁCH HÀNG */}
      <div className="mb-6 text-sm space-y-2">
        <p><strong>Tên khách hàng:</strong> {order?.customerName}</p>
        <p><strong>Điện thoại:</strong> {order?.customerPhone || "..........................................................."}</p>
        <p><strong>Nhân viên phục vụ:</strong> {order?.createdBy?.fullName || order?.createdBy?.userName || "N/A"}</p>
      </div>

      {/* BẢNG SẢN PHẨM / DỊCH VỤ */}
      <table className="w-full border-collapse border border-gray-800 mb-4 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 p-2 text-center w-12">STT</th>
            <th className="border border-gray-800 p-2 text-left">Tên hàng hóa / Dịch vụ</th>
            <th className="border border-gray-800 p-2 text-center w-16">SL</th>
            <th className="border border-gray-800 p-2 text-center">Số Serial / IMEI</th>
            <th className="border border-gray-800 p-2 text-center w-32">Bảo hành</th>
            <th className="border border-gray-800 p-2 text-right w-32">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, idx) => {
            // Xử lý chung cho Đơn Bán/Thu và Đơn Sửa chữa
            let itemName = "Sản phẩm/Dịch vụ";
            let serial = "";
            let warrantyText = "Không";
            let price = d.purchasePrice || d.price || 0;

            if (activeTab === "REPAIR") {
                itemName = d.serviceId?.name || "Dịch vụ sửa chữa";
                if(d.itemIds && d.itemIds.length > 0) {
                    itemName += ` (Thay: ${d.itemIds.map(i => i.name).join(", ")})`;
                    serial = d.itemIds.map(i => i.serialCode).join(", ");
                }
                price = d.serviceId?.price || 0;
            } else {
                itemName = d.phoneId?.phoneModelId?.name || d.itemId?.item_type?.name || d.name || "Sản phẩm";
                serial = d.phoneId ? d.phoneId.imei || d.phoneId.serialCode || d.phoneId._id?.substring(d.phoneId._id.length - 6).toUpperCase() : (d.itemId?.serialCode || d.identifier || "");
                if (d.warrantyExpireDate) {
                    warrantyText = `Đến ${dayjs(d.warrantyExpireDate).format('DD/MM/YYYY')}`;
                } else if (d.warranty) {
                    warrantyText = "Tiêu chuẩn";
                }
            }

            return (
              <tr key={idx}>
                <td className="border border-gray-800 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-800 p-2 font-medium">{itemName}</td>
                <td className="border border-gray-800 p-2 text-center">1</td>
                <td className="border border-gray-800 p-2 text-center font-mono text-xs">{serial || "-"}</td>
                <td className="border border-gray-800 p-2 text-center text-xs">{warrantyText}</td>
                <td className="border border-gray-800 p-2 text-right font-bold">{formatCurrency(price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TỔNG TIỀN */}
      <div className="flex justify-end mb-6">
        <div className="w-1/2 text-right">
            <div className="text-lg mb-1">
                <strong>Tổng cộng:</strong> <span className="text-xl font-black">{formatCurrency(order?.totalPrice)}</span>
            </div>
            <div className="text-sm italic text-gray-700">
                (Bằng chữ: {docSoThanhChu(order?.totalPrice || 0)})
            </div>
        </div>
      </div>

      {/* ĐIỀU KHOẢN BẢO HÀNH */}
      <div className="text-[11px] mb-10 leading-relaxed text-gray-700">
        <p className="font-bold underline text-black mb-1">Lưu ý / Quy định bảo hành:</p>
        <p>- Quý khách vui lòng kiểm tra kỹ sản phẩm, hình thức, phụ kiện đi kèm trước khi rời khỏi cửa hàng.</p>
        <p>- Cửa hàng không bảo hành đối với các trường hợp: Rơi vỡ, cấn móp, vào nước, chập cháy, mất Tem bảo hành.</p>
        <p>- Đối với máy cũ, hỗ trợ 1 đổi 1 trong 30 ngày đầu nếu phát sinh lỗi từ Nhà sản xuất (Mainboard, Nguồn).</p>
        <p>- Quý khách vui lòng giữ lại phiếu này để thuận tiện cho việc tra cứu và hỗ trợ bảo hành.</p>
      </div>

      {/* CHỮ KÝ */}
      <div className="flex justify-between text-center text-sm font-bold pt-8">
        <div className="w-1/3">
            <p>Người Mua Hàng</p>
            <p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p>
        </div>
        <div className="w-1/3">
            <p>Người Giao Hàng</p>
            <p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p>
        </div>
        <div className="w-1/3">
            <p>Thủ Kho / Kế Toán</p>
            <p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
};


// ==================================================================
// MAIN COMPONENT
// ==================================================================
export default function SaleOrders() {
  const [activeTab, setActiveTab] = useState("SALE"); // "SALE" | "PURCHASE" | "REPAIR"
  
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // States cho Lọc và Phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const printRef = useRef(null);

  // Thay đổi Tab -> Load lại dữ liệu
  useEffect(() => {
    fetchOrders();
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("ALL");
  }, [activeTab]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let url = "";
      if (activeTab === "SALE" || activeTab === "PURCHASE") {
        url = `http://localhost:9999/api/purchase-orders?orderType=${activeTab}`;
      } else if (activeTab === "REPAIR") {
        url = `http://localhost:9999/api/repair-orders`;
      }

      const res = await fetch(url);
      if(res.ok) {
          let data = await res.json();
          // Sắp xếp mới nhất lên đầu
          data = data.sort((a, b) => new Date(b.createdAt || b.repairOrderDate) - new Date(a.createdAt || a.repairOrderDate));
          setOrders(data);
      }
    } catch (err) {
      toast.error("Lỗi tải danh sách hóa đơn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = async (order) => {
    setSelectedOrder(order);
    setOrderDetails([]);
    setIsModalOpen(true);
    
    try {
      let url = "";
      if (activeTab === "REPAIR") {
          url = `http://localhost:9999/api/repair-orders/${order._id}/details`;
      } else {
          url = `http://localhost:9999/api/purchase-orders/${order._id}/details`;
      }

      const res = await fetch(url);
      if (res.ok) setOrderDetails(await res.json());
    } catch (err) {
      toast.error("Không thể tải chi tiết");
    } 
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `HoaDon_${activeTab}_${selectedOrder?._id.substring(0, 6)}`,
  });

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm("Xác nhận hoàn tất thanh toán đơn hàng này?")) return;

    try {
      let url = activeTab === "REPAIR" 
            ? `http://localhost:9999/api/repair-orders/${orderId}/complete` // Giả sử bên Repair m có API này
            : `http://localhost:9999/api/purchase-orders/${orderId}/confirm-payment`;

      const res = await fetch(url, { method: activeTab === "REPAIR" ? "PUT" : "PATCH" });

      if (res.ok) {
        toast.success("Xác nhận thành công!");
        fetchOrders();
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error("Thao tác thất bại");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

  // LỌC VÀ PHÂN TRANG
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.customerPhone?.includes(searchQuery) || o.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Hóa Đơn & Giao Dịch
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("SALE")}
            className={`pb-2 px-4 text-lg font-bold transition-all border-b-4 ${
              activeTab === "SALE" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Đơn Bán Hàng
          </button>

          <button
            onClick={() => setActiveTab("PURCHASE")}
            className={`pb-2 px-4 text-lg font-bold transition-all border-b-4 ${
              activeTab === "PURCHASE" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Đơn Thu Mua
          </button>

          <button
            onClick={() => setActiveTab("REPAIR")}
            className={`pb-2 px-4 text-lg font-bold transition-all border-b-4 ${
              activeTab === "REPAIR" ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Đơn Sửa Chữa
          </button>
        </div>
      </div>

      {/* BỘ LỌC */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center bg-white border rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500 shadow-sm">
            <Filter size={18} className="text-gray-400 mr-1" />
            <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)}
               className="bg-transparent py-2.5 px-2 outline-none font-medium text-gray-600"
            >
               <option value="ALL">Tất cả trạng thái</option>
               <option value="Pending">Chờ xác nhận</option>
               {activeTab === "REPAIR" && <option value="In Progress">Đang xử lý</option>}
               <option value="Completed">Đã hoàn tất</option>
               <option value="Cancelled">Đã hủy</option>
            </select>
        </div>

        <div className="relative w-80 shadow-sm">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm tên hoặc SĐT khách hàng..."
              value={searchQuery}
              className="pl-10 pr-4 py-2.5 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        {isLoading && <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>}
        
        {!isLoading && (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-black tracking-wider">
                    <tr>
                    <th className="p-4">Mã đơn</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4 text-right">Tổng tiền</th>
                    {activeTab === "REPAIR" && <th className="p-4">Loại S.Chữa</th>}
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {currentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold uppercase text-gray-700">
                        #{order._id.substring(order._id.length - 6)}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                            {dayjs(order.createdAt || order.repairOrderDate).format('DD/MM/YYYY HH:mm')}
                        </td>
                        <td className="p-4">
                        <div className="font-semibold text-gray-800">
                            {order.customerName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Phone size={12}/> {order.customerPhone || "N/A"}
                        </div>
                        </td>
                        <td className="p-4 font-bold text-gray-800 text-right">
                            {formatCurrency(order.totalPrice)}
                        </td>
                        
                        {activeTab === "REPAIR" && (
                            <td className="p-4 text-sm font-medium text-gray-600">{order.repairType || "REPAIR"}</td>
                        )}

                        <td className="p-4 text-sm">
                        <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === "Completed"
                                ? "bg-green-100 text-green-700"
                                : order.status === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : order.status === "In Progress" 
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                            {order.status === "Completed" ? "Hoàn tất" : order.status === "Cancelled" ? "Đã hủy" : order.status === "In Progress" ? "Đang xử lý" : "Chờ xác nhận"}
                        </span>
                        </td>
                        <td className="p-4 flex justify-center gap-2">
                        <button
                            onClick={() => handleOpenDetail(order)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                            title="Xem chi tiết & In Bill"
                        >
                            <Eye size={18} />
                        </button>
                        {order.status === "Pending" && activeTab !== "REPAIR" && (
                            <button
                                onClick={() => handleConfirmPayment(order._id)}
                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                                title="Xác nhận thanh toán"
                            >
                                <CheckCircle size={18} />
                            </button>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}
        
        {!isLoading && currentOrders.length === 0 && (
            <div className="text-center py-16 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                Chưa có hóa đơn {activeTab === "SALE" ? "Bán hàng" : activeTab === "PURCHASE" ? "Thu mua" : "Sửa chữa"} nào.
            </div>
        )}

        {/* Thanh Phân trang */}
        {!isLoading && totalPages > 1 && (
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                Chi tiết Hóa Đơn <span className="text-blue-600 font-mono">#{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}</span>
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg font-bold text-sm hover:bg-black shadow-md transition"
                >
                  <Printer size={16} /> IN PHIẾU A4
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-red-500 bg-white border p-2 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-5 rounded-xl border border-blue-100">
                <div>
                  <p className="text-xs text-blue-800 font-black uppercase mb-1">Khách hàng</p>
                  <p className="font-bold text-gray-900 text-xl">{selectedOrder.customerName}</p>
                  <p className="text-sm text-blue-700 mt-1 font-medium"><Phone size={14} className="inline mr-1"/> {selectedOrder.customerPhone || "N/A"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-800 font-black uppercase mb-1">Tổng thanh toán</p>
                  <p className="text-3xl font-black text-blue-700">{formatCurrency(selectedOrder.totalPrice)}</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Sản phẩm / Dịch vụ</th>
                      <th className="p-4 text-center">Bảo hành</th>
                      <th className="p-4 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.map((detail, idx) => {
                       let itemName = "";
                       let serial = "";
                       let price = detail.purchasePrice || detail.price || 0;
                       
                       if (activeTab === "REPAIR") {
                           itemName = detail.serviceId?.name || "Dịch vụ";
                           price = detail.serviceId?.price || 0;
                       } else {
                           itemName = detail.phoneId?.phoneModelId?.name || detail.itemId?.item_type?.name || detail.name || "Sản phẩm";
                           serial = detail.phoneId ? `Mã máy: ${detail.phoneId._id?.substring(detail.phoneId._id.length - 6).toUpperCase()}` : `SN: ${detail.itemId?.serialCode || detail.identifier}`;
                       }

                       return (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="p-4">
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                {activeTab === "REPAIR" ? <Wrench size={16} className="text-orange-500" /> : detail.phoneId ? <Smartphone size={16} className="text-blue-500" /> : <Package size={16} className="text-emerald-500" />}
                                {itemName}
                            </div>
                            {serial && <div className="text-xs text-gray-500 font-mono mt-1 ml-6">{serial}</div>}
                            
                            {/* Hiển thị linh kiện sửa chữa nếu có */}
                            {activeTab === "REPAIR" && detail.itemIds && detail.itemIds.length > 0 && (
                                <div className="mt-2 ml-6 p-2 bg-white border rounded text-xs space-y-1">
                                   <span className="font-bold text-gray-500 uppercase text-[9px]">Linh kiện thay:</span>
                                   {detail.itemIds.map(item => (
                                       <div key={item._id} className="flex justify-between text-gray-600">
                                           <span>- {item.name}</span>
                                           <span>{formatCurrency(item.price)}</span>
                                       </div>
                                   ))}
                                </div>
                            )}
                            </td>
                            <td className="p-4 text-center">
                            {detail.warrantyExpireDate ? (
                                <span className="text-xs text-green-700 font-bold bg-green-100 border border-green-200 px-2 py-1 rounded">
                                   Đến {dayjs(detail.warrantyExpireDate).format('DD/MM/YYYY')}
                                </span>
                            ) : detail.warranty ? (
                                <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded">Tiêu chuẩn</span>
                            ) : (
                                <span className="text-xs text-gray-400 font-bold">Không</span>
                            )}
                            </td>
                            <td className="p-4 text-right font-black text-gray-800">{formatCurrency(price)}</td>
                        </tr>
                       )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-xl">
               {selectedOrder.status === "Pending" ? (
                  <div className="flex gap-3 w-full justify-end">
                     <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Đóng</button>
                     <button onClick={() => handleConfirmPayment(selectedOrder._id)} className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-black flex items-center gap-2 hover:bg-green-700 shadow-md transition">
                        <CheckCircle size={18}/> XÁC NHẬN THANH TOÁN
                     </button>
                  </div>
               ) : (
                  <div className="w-full flex justify-end">
                     <span className="px-6 py-2.5 bg-gray-200 text-green-700 rounded-lg font-black flex items-center gap-2">
                        <CheckCircle size={18}/> ĐƠN ĐÃ HOÀN TẤT
                     </span>
                  </div>
               )}
            </div>

            <div className="hidden">
              <InvoicePrintA4 contentRef={printRef} order={selectedOrder} details={orderDetails} formatCurrency={formatCurrency} activeTab={activeTab} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}