import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, Smartphone, Package, Trash2, Save, Settings, Send, ScanLine, Printer, X, CheckCircle, XCircle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useReactToPrint } from "react-to-print";

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

// COMPONENT IN HÓA ĐƠN
const InvoicePrint = ({ order, details, formatCurrency, contentRef }) => {
  return (
    <div ref={contentRef} className="p-8 bg-white text-black" style={{ width: "80mm", fontSize: "11px", fontFamily: "monospace", lineHeight: "1.4" }}>
      <div className="text-center mb-4">
        <h2 className="text-[16px] font-black uppercase tracking-wider mb-1">DINH TRONG MOBILE</h2>
        <p className="text-[10px] leading-tight">Cơ sở: {order?.storeId?.name || "Chi nhánh chính"}</p>
        <p className="text-[10px] leading-tight">ĐC: {order?.storeId?.address || "Hà Nội"}</p>
        <p className="text-[10px] leading-tight mb-2">SĐT: {order?.storeId?.hotline || "0987.654.321"}</p>
        <div className="border-b-2 border-black border-dashed pb-2">
            <h3 className="text-[14px] font-bold uppercase mt-2">
                Hóa Đơn {order?.orderType === "SALE" ? "Bán Hàng" : "Thu Mua"}
            </h3>
        </div>
      </div>

      <div className="mb-4 text-[11px] space-y-1">
        <p>Mã đơn: <strong>#{order?._id.substring(order._id.length - 6).toUpperCase()}</strong></p>
        <p>Ngày: {new Date(order?.createdAt || new Date()).toLocaleString("vi-VN")}</p>
        <p>Nhân viên: {order?.createdBy?.fullName || order?.createdBy?.userName || "N/A"}</p>
        
        <div className="mt-2 pt-2 border-t border-black border-dotted">
            <p className="font-bold">Khách hàng: {order?.customerName}</p>
            <p>SĐT: {order?.customerPhone}</p>
        </div>
      </div>

      <div className="border-t-2 border-black border-dashed pt-2 mb-2">
        <table className="w-full text-left border-collapse">
            <thead>
            <tr className="border-b border-black text-[10px]">
                <th className="pb-1 uppercase tracking-wider">S.Phẩm</th>
                <th className="text-center pb-1 w-8 uppercase tracking-wider">SL</th>
                <th className="text-right pb-1 uppercase tracking-wider">T.Tiền</th>
            </tr>
            </thead>
            <tbody>
            {details.map((d, idx) => {
                const price = d.purchasePrice || d.phoneId?.sellingPrice || d.price || 0;
                return (
                <tr key={idx} className="border-b border-gray-300 border-dotted">
                <td className="py-2 pr-1">
                    <div className="font-bold text-[11px] leading-tight">
                    {d.phoneId?.phoneModelId?.name || d.itemId?.item_type?.name || d.name || "Sản phẩm"}
                    </div>
                    <div className="text-[9px] mt-1 text-gray-600">
                    SN: {d.phoneId?.serialCode || d.itemId?.serialCode || d.identifier}
                    </div>
                    <div className="text-[9px] mt-0.5 font-medium">Giá: {formatCurrency(price)}</div>
                    <div className="text-[9px] mt-0.5 text-gray-600 italic">
                    Bảo hành: {d.warrantyExpireDate ? `Đến ${new Date(d.warrantyExpireDate).toLocaleDateString("vi-VN")}` : d.warranty ? "Tiêu chuẩn" : "Không"}
                    </div>
                </td>
                <td className="text-center align-top py-2 text-[11px] font-bold">1</td>
                <td className="text-right align-top py-2 font-bold text-[11px]">{formatCurrency(price)}</td>
                </tr>
            )})}
            </tbody>
        </table>
      </div>

      <div className="border-t-2 border-black border-dashed pt-3 mb-6">
        <div className="flex justify-between items-center font-black text-[13px] mb-1">
          <span>TỔNG CỘNG:</span>
          <span>{formatCurrency(order?.totalPrice)}</span>
        </div>
        <p className="text-[10px] text-right italic font-medium mt-1 mb-3 text-gray-700">
           (Bằng chữ: {docSoThanhChu(order?.totalPrice || 0)})
        </p>

        <div className="text-[9px] italic border p-2 bg-gray-50 text-gray-600 mb-4 rounded-sm">
           <p className="font-bold text-black mb-1 underline">Lưu ý:</p>
           <p>- Hàng mua rồi miễn đổi trả nếu không lỗi NSX.</p>
           <p>- Giữ hóa đơn để đối chiếu bảo hành.</p>
           <p>- Không bảo hành rơi vỡ, vào nước.</p>
        </div>
      </div>

      <div className="flex justify-between items-start text-center text-[10px] font-bold">
         <div className="w-1/2">
            <p>Khách hàng</p>
            <p className="text-[8px] italic font-normal text-gray-500">(Ký & ghi rõ họ tên)</p>
            <div className="h-16"></div>
         </div>
         <div className="w-1/2">
            <p>Nhân viên</p>
            <p className="text-[8px] italic font-normal text-gray-500">(Ký & ghi rõ họ tên)</p>
            <div className="h-16"></div>
         </div>
      </div>
      <div className="text-center mt-4 text-[10px] font-bold border-t border-black pt-2"><p>Cảm ơn quý khách!</p></div>
    </div>
  );
};


export default function SalePOS() {
  const [orderType, setOrderType] = useState("SALE");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  
  // State Quét mã
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef(null);

  // States Hóa Đơn Mới Tạo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const printRef = useRef(null);

  const [tradeInRequest, setTradeInRequest] = useState({ note: "" });

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (orderType === "SALE" && scanInputRef.current && !isModalOpen) {
      scanInputRef.current.focus();
    }
  }, [orderType, isModalOpen]);

  useEffect(() => {
    fetchInventory();
    setCart([]);
    setScanInput("");
  }, [orderType]);

  const fetchInventory = async () => {
    if (orderType !== "SALE") return;
    try {
      const token = localStorage.getItem("token");
      const [phoneRes, itemRes] = await Promise.allSettled([
        fetch(`http://localhost:9999/api/phones?status=in_stock`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:9999/api/items?status=in_stock`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let phonesData = phoneRes.status === 'fulfilled' && phoneRes.value.ok ? await phoneRes.value.json() : [];
      let itemsData = itemRes.status === 'fulfilled' && itemRes.value.ok ? await itemRes.value.json() : [];
      
      const formattedPhones = (Array.isArray(phonesData) ? phonesData : phonesData.data || []).map(p => ({ 
        ...p, 
        isPhone: true, 
        displayPrice: p.sellingPrice, 
        displayName: p.phoneModelId?.name,
        identifier: p.serialCode // CẬP NHẬT: Dùng Serial Code thay vì 6 số cuối ID
      }));
      const formattedItems = (Array.isArray(itemsData) ? itemsData : itemsData.data || []).map(i => ({ 
        ...i, 
        isPhone: false, 
        displayPrice: i.price, 
        displayName: i.name || i.item_type?.name, 
        identifier: i.serialCode // CẬP NHẬT: Dùng Serial Code
      }));
      setInventory([...formattedPhones, ...formattedItems]);
    } catch (err) { toast.error("Lỗi kết nối kho"); }
  };

  const handleScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = scanInput.trim().toUpperCase();
      if (!code) return;
      
      // LOGIC MỚI: Chỉ dò theo identifier (chính là serialCode của cả Máy và Linh kiện)
      const foundProduct = inventory.find(item => item.identifier && item.identifier.toUpperCase() === code);

      if (foundProduct) {
        if (cart.find((c) => c._id === foundProduct._id)) {
            toast.warning("Sản phẩm này đã có trong giỏ!");
        } else {
            addToCart(foundProduct);
        }
      } else {
        toast.error(`Không tìm thấy sản phẩm có Serial Code: ${code} (Hoặc không sẵn sàng bán)`);
      }
      setScanInput("");
    }
  };

  const addToCart = (product) => {
    setCart([...cart, { 
        ...product, 
        phoneId: product.isPhone ? product._id : null, 
        itemId: !product.isPhone ? product._id : null, 
        price: product.displayPrice, 
        name: product.displayName, 
        identifier: product.identifier 
    }]);
    toast.success("Đã thêm vào giỏ!");
  };

  const removeFromCart = (indexToRemove) => setCart(cart.filter((_, index) => index !== indexToRemove));
  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const validateCustomer = () => {
    if (!customer.name.trim()) {
        toast.error("Vui lòng nhập tên khách hàng!");
        return false;
    }
    if (!/(0[3|5|7|8|9])+([0-9]{8})\b/.test(customer.phone)) {
        toast.error("Số điện thoại không hợp lệ! (Ví dụ: 0987654321)");
        return false;
    }
    return true;
  };

  // TẠO ĐƠN BÁN & BẬT POPUP HÓA ĐƠN
  const handleSaleSubmit = async () => {
    if (!validateCustomer() || cart.length === 0) return toast.error("Kiểm tra lại thông tin khách và giỏ hàng!");
    if (!user) return toast.error("Vui lòng đăng nhập lại");

    const currentStoreId = user.storeId?._id || user.storeId;
    if (!currentStoreId) {
      return toast.error("Tài khoản này chưa thuộc Cửa hàng nào! Hãy báo Admin phân quyền, sau đó Đăng xuất ra vào lại.");
    }

    const token = localStorage.getItem("token");
    const payload = {
      storeId: currentStoreId,
      customerName: customer.name, customerPhone: customer.phone,
      totalPrice: calculateTotal(), createdBy: user._id, orderType: "SALE",
      status: "Pending", 
      details: cart.map((item) => ({ phoneId: item.phoneId, itemId: item.itemId, price: item.price }))
    };

    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (res.ok) { 
        const newOrder = result.data;
        newOrder.createdBy = user; 

        const detailRes = await fetch(`http://localhost:9999/api/purchase-orders/${newOrder._id}/details`);
        if(detailRes.ok) setOrderDetails(await detailRes.json());
        else setOrderDetails(cart); 
        
        setSelectedOrder(newOrder);
        setIsModalOpen(true); 

        toast.success(`Đã tạo đơn. Vui lòng thanh toán!`); 
        setCart([]); setCustomer({name:"", phone:""}); fetchInventory(); 
      } else {
        toast.error(result.message || "Tạo đơn thất bại");
      }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  // CHUYỂN CHO TECH ĐỊNH GIÁ MÁY THU CŨ
  const handleSendToTech = async () => {
    if (!validateCustomer()) return;
    if (!user) return toast.error("Vui lòng đăng nhập lại");

    const currentStoreId = user.storeId?._id || user.storeId;
    if (!currentStoreId) {
      return toast.error("Tài khoản này chưa thuộc Cửa hàng nào! Hãy báo Admin phân quyền, sau đó Đăng xuất ra vào lại.");
    }

    const token = localStorage.getItem("token");
    const payload = {
      storeId: currentStoreId,
      customerName: customer.name,
      customerPhone: customer.phone,
      totalPrice: 0,
      createdBy: user._id,
      orderType: "PURCHASE",
      status: "Pending_Tech",
      note: tradeInRequest.note,
      details: []
    };

    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders", { 
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success(`Đã chuyển yêu cầu thu máy sang bộ phận Kỹ Thuật!`);
        setCustomer({name:"", phone:""});
        setTradeInRequest({note: ""});
      } else {
        toast.error(result.message || "Tạo yêu cầu thất bại");
      }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  // IN & XÁC NHẬN THANH TOÁN TẠI QUẦY
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Bill_${selectedOrder?._id.substring(0, 6)}` });

  const handleConfirmPayment = async () => {
    if (!window.confirm("Xác nhận đã nhận đủ tiền và in hóa đơn?")) return;
    try {
      const res = await fetch(`http://localhost:9999/api/purchase-orders/${selectedOrder._id}/confirm-payment`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Thanh toán thành công!");
        setSelectedOrder({...selectedOrder, status: "Completed"});
        setTimeout(() => handlePrint(), 500); // In luôn
      }
    } catch (err) { toast.error("Thanh toán thất bại"); }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Xác nhận HUỶ đơn hàng này? Khách không mua nữa?")) return;
    try {
      const res = await fetch(`http://localhost:9999/api/purchase-orders/${selectedOrder._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled", totalPrice: selectedOrder.totalPrice, note: selectedOrder.note }),
      });
      if (res.ok) {
        toast.success("Đã hủy đơn hàng!");
        setIsModalOpen(false);
      }
    } catch (err) { toast.error("Lỗi hủy đơn"); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex h-screen bg-gray-100 p-4 gap-4 overflow-hidden">
        
        <div className="w-2/3 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden border">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Settings size={20} /> Điểm bán hàng (POS)</h2>
            <div className="flex bg-white rounded-lg p-1 border shadow-sm">
              <button onClick={() => setOrderType("SALE")} className={`px-6 py-2 rounded-md font-bold transition-all ${orderType === "SALE" ? "bg-orange-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>BÁN RA</button>
              <button onClick={() => setOrderType("PURCHASE")} className={`px-6 py-2 rounded-md font-bold transition-all ${orderType === "PURCHASE" ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>THU CŨ / MUA VÀO</button>
            </div>
          </div>

          {orderType === "SALE" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
              <div className="w-full max-w-xl bg-white p-8 rounded-3xl shadow-xl border border-orange-100 text-center">
                 <div className="mx-auto bg-orange-100 text-orange-600 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner"><ScanLine size={48} /></div>
                 <h3 className="text-2xl font-black text-gray-800 mb-2">Quét mã Serial Code</h3>
                 <p className="text-gray-500 mb-8 text-sm">Dùng súng quét tít mã SN trên hộp máy/linh kiện, hoặc nhập tay và ấn Enter.</p>
                 <div className="relative group">
                    <input ref={scanInputRef} type="text" placeholder="Nhập Serial Code (SN)..." value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={handleScan} className="w-full pl-6 pr-4 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-xl font-mono text-center tracking-widest transition-all uppercase" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"><span className="bg-orange-100 text-orange-600 px-3 py-1 rounded font-bold text-xs">Bấm Enter</span></div>
                 </div>
              </div>
              <div className="mt-8 text-center text-gray-400 text-sm">
                  <p>Kho đang có sẵn: <strong className="text-orange-600">{inventory.length}</strong> sản phẩm sẵn sàng bán.</p>
              </div>
            </div>
          ) : (
            <div className="p-8 flex-1 overflow-y-auto bg-purple-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-purple-100">
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-purple-100 rounded-full text-purple-600 mb-4">
                    <Smartphone size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800">Tiếp nhận máy Thu cũ</h3>
                  <p className="text-gray-500 text-sm mt-2">Sale nhập thông tin khách và ghi chú sơ bộ để Kỹ thuật test máy</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Ghi chú tình trạng khách báo (Tùy chọn)</label>
                    <textarea 
                      placeholder="VD: Khách nói máy thỉnh thoảng sập nguồn, xước viền..." 
                      value={tradeInRequest.note} 
                      onChange={e => setTradeInRequest({note: e.target.value})} 
                      rows="4" 
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2"><User size={18} className={orderType === "SALE" ? "text-orange-600" : "text-purple-600"} /> Thông tin khách hàng <span className="text-red-500">*</span></h3>
            <div className="space-y-3">
              <input type="text" placeholder="Tên khách hàng" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} />
              <input type="text" placeholder="Số điện thoại (VD: 0912345678)" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} />
            </div>
          </div>

          {orderType === "SALE" ? (
             <div className="bg-white flex-1 p-4 rounded-xl shadow-sm border flex flex-col overflow-hidden">
               <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2"><ShoppingCart size={18} className="text-orange-600" /> Giỏ hàng ({cart.length})</h3>
               <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {cart.length === 0 && <p className="text-center text-sm text-gray-400 mt-10">Dùng súng quét mã để thêm SP</p>}
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-bold text-sm truncate text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono italic truncate">SN: {item.identifier}</p>
                        <p className="text-orange-600 font-bold text-xs mt-1">{formatCurrency(item.price)}</p>
                      </div>
                      <button onClick={() => removeFromCart(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all flex-shrink-0"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
               <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-500 font-medium uppercase text-[10px] tracking-wider">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-orange-600 tracking-tighter">{formatCurrency(calculateTotal())}</span>
                  </div>
                 <button onClick={handleSaleSubmit} disabled={cart.length === 0} className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${cart.length > 0 ? "bg-orange-600 text-white shadow-lg hover:bg-orange-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><Save size={20} /> TẠO ĐƠN BÁN</button>
               </div>
             </div>
          ) : (
             <div className="bg-white flex-1 p-6 rounded-xl shadow-sm border flex flex-col justify-center text-center">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Gửi yêu cầu Kỹ Thuật</h3>
               <p className="text-sm text-gray-500 mb-8">Vui lòng kiểm tra lại thông tin khách hàng và ghi chú trước khi chuyển cho Tech định giá.</p>
               <button onClick={handleSendToTech} className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl bg-purple-600 text-white hover:bg-purple-700 transition-transform hover:-translate-y-1">
                 <Send size={20} /> CHUYỂN CHO TECH ĐỊNH GIÁ
               </button>
             </div>
          )}
        </div>

        {/* POP-UP XÁC NHẬN THANH TOÁN (NGAY SAU KHI TẠO ĐƠN) */}
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                  <CheckCircle size={24}/> Đơn hàng #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}
                </h3>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow-md">
                    <Printer size={16} /> IN BILL
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-lg"><X size={20} /></button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Khách hàng</p>
                    <p className="font-bold text-gray-800 text-lg">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Tổng cần thanh toán</p>
                    <p className="text-3xl font-black text-orange-600">{formatCurrency(selectedOrder.totalPrice)}</p>
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
                              {detail.phoneId ? <Smartphone size={16} className="text-blue-500" /> : <Package size={16} className="text-emerald-500" />}
                              {detail.phoneId?.phoneModelId?.name || detail.itemId?.item_type?.name || detail.name || "Sản phẩm"}
                            </div>
                            <div className="text-[10px] text-gray-400 ml-6">
                              SN: {detail.phoneId?.serialCode || detail.itemId?.serialCode || detail.identifier}
                            </div>
                          </td>
                          <td className="p-3 text-right font-black">{formatCurrency(detail.purchasePrice || detail.phoneId?.sellingPrice || detail.price || 0)}</td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">CÓ BH</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                <button onClick={handleCancelOrder} className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold flex items-center gap-2 hover:bg-red-200 transition">
                  <XCircle size={20}/> Hủy Đơn & Trả Hàng
                </button>
                
                {selectedOrder.status === "Pending" ? (
                   <button onClick={handleConfirmPayment} className="px-8 py-3 bg-green-600 text-white rounded-xl font-black flex items-center gap-2 hover:bg-green-700 shadow-lg transition">
                      <CheckCircle size={20}/> KHÁCH ĐÃ THANH TOÁN (XUẤT KHO)
                   </button>
                ) : (
                   <div className="px-8 py-3 bg-gray-200 text-green-700 rounded-xl font-black flex items-center gap-2">
                      <CheckCircle size={20}/> ĐƠN ĐÃ HOÀN TẤT
                   </div>
                )}
              </div>

              <div className="hidden">
                <InvoicePrint contentRef={printRef} order={selectedOrder} details={orderDetails} formatCurrency={formatCurrency} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}