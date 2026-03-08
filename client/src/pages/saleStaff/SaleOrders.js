import { useState, useEffect, useRef } from "react";
import { CheckCircle, Eye, Search, X, Calendar, Smartphone, Package, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";

const InvoicePrint = ({ order, details, formatCurrency, contentRef }) => {
  return (
    <div ref={contentRef} className="p-10 bg-white text-black" style={{ width: "80mm", fontSize: "12px", fontFamily: "monospace" }}>
      {/* Nội dung hóa đơn giữ nguyên như cũ */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">DINHTRONGMOBILE</h2>
        <p className="text-[10px]">HÓA ĐƠN GIAO DỊCH</p>
      </div>

      <div className="border-t border-b border-black border-dashed py-2 mb-4">
        <p>Mã đơn: #{order?._id.substring(order._id.length - 6).toUpperCase()}</p>
        <p>Khách: {order?.customerName}</p>
        <p>SĐT: {order?.customerPhone}</p>
        <p>Loại: {order?.orderType === 'SALE' ? 'BÁN RA' : 'THU MUA'}</p>
        <p>Ngày: {new Date().toLocaleString('vi-VN')}</p>
      </div>

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left">S.Phẩm</th>
            <th className="text-right">Giá</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, idx) => (
            <tr key={idx}>
              <td className="py-1">
                {d.phoneId?.phoneModelId?.name || d.itemId?.item_type?.name || "SP"}
                <br />
                <span className="text-[9px] italic">
                  {d.phoneId ? d.phoneId.imei : d.itemId?.serialCode}
                </span>
              </td>
              <td className="text-right align-top">
                {formatCurrency(d.purchasePrice || d.phoneId?.sellingPrice || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black pt-2 flex justify-between font-bold text-sm">
        <span>TỔNG:</span>
        <span>{formatCurrency(order?.totalPrice)}</span>
      </div>

      <div className="text-center mt-6 text-[9px]">
        <p>Cảm ơn quý khách!</p>
        <p>Hẹn gặp lại!</p>
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
export default function SaleOrders() {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const printRef = useRef(null);// Ref cho máy in

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders");
      const data = await res.json();
      
      const updatedOrders = await Promise.all(data.map(async (order) => {
        const detailRes = await fetch(`http://localhost:9999/api/purchase-orders/${order._id}/details`);
        if (detailRes.ok) {
          const details = await detailRes.json();
          
          const total = details.reduce((sum, d) => {
            // SALE dùng sellingPrice, PURCHASE dùng importPrice/purchasePrice
            const isSale = order.orderType === "SALE";
            
            // Lấy giá của MÁY (nếu có)
            const pPrice = d.phoneId 
              ? (isSale ? d.phoneId.sellingPrice : d.phoneId.importPrice) 
              : 0;

            // Lấy giá của LINH KIỆN (nếu có)
            const iPrice = d.itemId 
              ? (isSale ? (d.itemId.item_type?.price || d.itemId.price) : d.itemId.baseCost) 
              : 0;

            // TRÁNH CỘNG LẶP: Nếu đơn hàng đã có purchasePrice lưu trực tiếp trong Detail, 
            // thì ưu tiên dùng nó, nếu không mới cộng pPrice + iPrice
            const itemFinalPrice = d.purchasePrice || (pPrice + iPrice);
            
            return sum + itemFinalPrice;
          }, 0);

          return { ...order, totalPrice: total };
        }
        return order;
      }));

      setOrders(updatedOrders);
    } catch (err) { toast.error("Lỗi tải danh sách đơn hàng"); }
  };

  const handleOpenDetail = async (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`http://localhost:9999/api/purchase-orders/${order._id}/details`);
      if (res.ok) setOrderDetails(await res.json());
    } catch (err) { toast.error("Không thể tải chi tiết"); }
    finally { setIsLoadingDetails(false); }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef, // Đây là chỗ gây lỗi 404/Nothing to print
    documentTitle: `Bill_${selectedOrder?._id.substring(0, 6)}`,
  });

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm("Xác nhận hoàn tất thanh toán và IN hóa đơn?")) return;
    
    try {
      const res = await fetch(`http://localhost:9999/api/purchase-orders/${orderId}/confirm-payment`, {
        method: "PATCH"
      });
      
      if (res.ok) {
        toast.success("Xác nhận thành công!");
        const order = orders.find(o => o._id === orderId);
        // Tự động load chi tiết và in
        await handleOpenDetail(order); 
        setTimeout(() => handlePrint(), 500); // Đợi modal load rồi in
        fetchOrders();
      }
    } catch (err) { toast.error("Thao tác thất bại"); }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Giao dịch</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm SĐT khách hàng..." 
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-black tracking-wider">
            <tr>
              <th className="p-4">Mã đơn</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4 text-right">Tổng tiền</th>
              <th className="p-4">Loại đơn</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.filter(o => o.customerPhone?.includes(searchQuery)).map((order) => (
              <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono text-xs text-orange-600 font-bold uppercase">
                  #{order._id.substring(order._id.length - 6)}
                </td>
                <td className="p-4">
                  <div className="font-semibold text-gray-800">{order.customerName}</div>
                  <div className="text-xs text-gray-500">{order.customerPhone || "N/A"}</div>
                </td>
                <td className="p-4 font-bold text-gray-700 text-right">
                  {formatCurrency(order.totalPrice)}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    order.orderType === "SALE" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  }`}>
                    {order.orderType === "SALE" ? "Bán hàng" : "Thu mua"}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.status === "Completed" ? "Đã hoàn tất" : "Chờ xác nhận"}
                  </span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => handleOpenDetail(order)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <Eye size={18} />
                  </button>
                  {order.status === "Pending" && (
                    <button onClick={() => handleConfirmPayment(order._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                      <CheckCircle size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL CHI TIẾT --- */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Chi tiết giao dịch #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow-md">
                  <Printer size={16}/> IN BILL
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-8 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase">Khách hàng</p>
                  <p className="font-bold text-gray-800 text-lg">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-black uppercase">Tổng thanh toán</p>
                  <p className="text-2xl font-black text-orange-600">{formatCurrency(selectedOrder.totalPrice)}</p>
                </div>
              </div>

              {/* Danh sách SP cũ của mày giữ nguyên logic map orderDetails bên dưới... */}
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
                              {detail.phoneId ? <Smartphone size={16} /> : <Package size={16} />}
                              {detail.phoneId?.phoneModelId?.name || detail.itemId?.item_type?.name || "SP"}
                            </div>
                            <div className="text-[10px] text-gray-400 ml-6">
                              {detail.phoneId ? `IMEI: ${detail.phoneId.imei}` : `SN: ${detail.itemId?.serialCode}`}
                            </div>
                          </td>
                          <td className="p-3 text-right font-black">{formatCurrency(detail.purchasePrice || detail.phoneId?.sellingPrice || 0)}</td>
                          <td className="p-3 text-center">
                            {detail.warranty ? <span className="text-[10px] text-green-600 font-bold">CÓ BH</span> : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>

            <div className="p-4 border-t bg-gray-100 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-white border rounded-lg font-bold">Đóng</button>
            </div>

           {/* PHẦN ẨN DÀNH CHO MÁY IN: Truyền ref vào contentRef */}
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