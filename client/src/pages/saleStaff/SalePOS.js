import { useState, useEffect } from "react";
import { ShoppingCart, User, Smartphone, Package, Trash2, Save, Search, Settings, Send } from "lucide-react";
import { toast } from "react-toastify";

export default function SalePOS() {
  const [orderType, setOrderType] = useState("SALE");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [phoneModels, setPhoneModels] = useState([]);

  // State riêng cho form gửi Tech định giá (Bên tab Thu Mua)
  const [tradeInRequest, setTradeInRequest] = useState({
    phoneModelId: "", imei: "", note: ""
  });

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    fetchInventory();
    fetchPhoneModels();
    setCart([]);
    setSearchQuery("");
  }, [orderType]);

  const fetchPhoneModels = async () => {
    try {
      const token = localStorage.getItem("token"); // Lấy token
      const res = await fetch("http://localhost:9999/api/phone_models/all", {
        headers: { Authorization: `Bearer ${token}` } // Thêm token vào header
      });
      const data = await res.json();
      setPhoneModels(Array.isArray(data) ? data : data.data || []);
    } catch (error) { console.error("Lỗi tải Phone Models"); }
  };

  const fetchInventory = async () => {
    if (orderType !== "SALE") return; // Tab mua không cần load kho
    try {
      const token = localStorage.getItem("token"); // Lấy token

      const [phoneRes, itemRes] = await Promise.allSettled([
        // Phải nhét header Auth vào đây
        fetch(`http://localhost:9999/api/phones?status=in_stock`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:9999/api/items?status=in_stock`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let phones = phoneRes.status === 'fulfilled' && phoneRes.value.ok ? await phoneRes.value.json() : [];
      let items = itemRes.status === 'fulfilled' && itemRes.value.ok ? await itemRes.value.json() : [];
      
      const formattedPhones = (Array.isArray(phones) ? phones : phones.data || []).map(p => ({ ...p, isPhone: true, displayPrice: p.sellingPrice, displayName: p.phoneModelId?.name }));
      const formattedItems = (Array.isArray(items) ? items : items.data || []).map(i => ({ ...i, isPhone: false, displayPrice: i.price, displayName: i.name || i.item_type?.name }));
      
      setInventory([...formattedPhones, ...formattedItems]);
    } catch (err) { toast.error("Lỗi kết nối kho"); }
  };

  const addToCart = (product) => {
    if (cart.find((item) => item._id === product._id)) return toast.info("Đã có trong giỏ");
    setCart([...cart, { ...product, phoneId: product.isPhone ? product._id : null, itemId: !product.isPhone ? product._id : null, price: product.displayPrice, name: product.displayName, identifier: product.isPhone ? `IMEI: ${product.imei}` : `SN: ${product.serialCode}` }]);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price || 0), 0);

  // GỬI ĐƠN BÁN RA
  const handleSaleSubmit = async () => {
    if (!customer.name || cart.length === 0) return toast.error("Nhập tên khách và chọn sản phẩm");
    if (!user) return toast.error("Vui lòng đăng nhập lại");

    const token = localStorage.getItem("token");
    const payload = {
      storeId: user.storeId?._id || user.storeId,
      customerName: customer.name, customerPhone: customer.phone,
      totalPrice: calculateTotal(), createdBy: user._id, orderType: "SALE",
      status: "Pending", 
      details: cart.map((item) => ({ phoneId: item.phoneId, itemId: item.itemId, price: item.price }))
    };
    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders", {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // THÊM DÒNG NÀY
        }, 
        body: JSON.stringify(payload)
      });
      if (res.ok) { toast.success(`Tạo đơn bán thành công!`); setCart([]); setCustomer({name:"", phone:""}); fetchInventory(); }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  // GỬI YÊU CẦU ĐỊNH GIÁ CHO TECH (Dành cho tab Thu Mua)
  const handleSendToTech = async () => {
    if (!customer.name || !customer.phone) return toast.error("Vui lòng nhập Tên và SĐT khách hàng!");
    if (!tradeInRequest.phoneModelId || !tradeInRequest.imei) return toast.error("Vui lòng chọn dòng máy và nhập IMEI!");
    if (!user) return toast.error("Vui lòng đăng nhập lại");

    const token = localStorage.getItem("token");
    
    // CỤC NÀY ĐÃ ĐƯỢC SỬA LẠI
    const payload = {
      storeId: user.storeId?._id || user.storeId,
      customerName: customer.name,
      customerPhone: customer.phone,
      totalPrice: 0,
      createdBy: user._id,
      orderType: "PURCHASE",
      status: "Pending_Tech",
      note: tradeInRequest.note,
      details: [], // <--- BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ BACKEND KHÔNG LỖI
      tempPhoneData: {
        phoneModelId: tradeInRequest.phoneModelId,
        imei: tradeInRequest.imei
      }
    };

    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders", { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        }, 
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(`Đã chuyển yêu cầu thu máy sang bộ phận Kỹ Thuật!`);
        setCustomer({name:"", phone:""});
        setTradeInRequest({phoneModelId: "", imei: "", note: ""});
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Tạo yêu cầu thất bại");
      }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const filteredInventory = inventory.filter((item) => (item.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4 overflow-hidden">
      
      {/* CỘT TRÁI */}
      <div className="w-2/3 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Settings size={20} /> Điểm bán hàng (POS)
          </h2>
          <div className="flex bg-white rounded-lg p-1 border shadow-sm">
            <button onClick={() => setOrderType("SALE")} className={`px-6 py-2 rounded-md font-bold transition-all ${orderType === "SALE" ? "bg-orange-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              BÁN RA
            </button>
            <button onClick={() => setOrderType("PURCHASE")} className={`px-6 py-2 rounded-md font-bold transition-all ${orderType === "PURCHASE" ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              THU CŨ / MUA VÀO
            </button>
          </div>
        </div>

        {orderType === "SALE" ? (
          // GIAO DIỆN BÁN RA
          <>
            <div className="p-3 bg-white border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="text" placeholder="Tìm kiếm sản phẩm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 overflow-y-auto">
              {filteredInventory.map((item) => (
                <div key={item._id} onClick={() => addToCart(item)} className="border p-4 rounded-xl hover:border-orange-500 cursor-pointer transition-all hover:shadow-md">
                  <div className="flex justify-between mb-1 text-gray-400">
                    {item.isPhone ? <Smartphone size={16}/> : <Package size={16}/>}
                  </div>
                  <p className="font-bold text-sm h-10 overflow-hidden">{item.displayName}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">{item.isPhone ? `IMEI: ${item.imei}` : `SN: ${item.serialCode}`}</p>
                  <p className="text-orange-600 font-black mt-2 text-lg">{formatCurrency(item.displayPrice)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          // GIAO DIỆN THU MUA (CHỈ ĐIỀN FORM CHO TECH)
          <div className="p-8 flex-1 overflow-y-auto bg-purple-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-purple-100">
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-purple-100 rounded-full text-purple-600 mb-4">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-2xl font-black text-gray-800">Tiếp nhận máy Thu cũ</h3>
                <p className="text-gray-500 text-sm mt-2">Nhập thông tin thiết bị để bộ phận Kỹ thuật kiểm tra và định giá</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dòng máy khách mang đến <span className="text-red-500">*</span></label>
                  <select value={tradeInRequest.phoneModelId} onChange={e => setTradeInRequest({...tradeInRequest, phoneModelId: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50">
                    <option value="">-- Chọn dòng máy --</option>
                    {phoneModels.map(pm => (<option key={pm._id} value={pm._id}>{pm.name}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số IMEI thiết bị <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Bấm *#06# trên máy khách để xem" value={tradeInRequest.imei} onChange={e => setTradeInRequest({...tradeInRequest, imei: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 font-mono" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ghi chú tình trạng sơ bộ (Tùy chọn)</label>
                  <textarea placeholder="VD: Máy trầy viền, nứt kính nhẹ..." value={tradeInRequest.note} onChange={e => setTradeInRequest({...tradeInRequest, note: e.target.value})} rows="3" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"></textarea>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CỘT PHẢI: THÔNG TIN KHÁCH HÀNG & ACTION */}
      <div className="w-1/3 flex flex-col gap-4">
        {/* THÔNG TIN KHÁCH */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2">
            <User size={18} className={orderType === "SALE" ? "text-orange-600" : "text-purple-600"} /> 
            Thông tin khách hàng
          </h3>
          <div className="space-y-3">
            <input type="text" placeholder="Tên khách hàng *" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} />
            <input type="text" placeholder="Số điện thoại *" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} />
          </div>
        </div>

        {/* NÚT ACTION THAY ĐỔI THEO CHẾ ĐỘ */}
        {orderType === "SALE" ? (
           <div className="bg-white flex-1 p-4 rounded-xl shadow-sm border flex flex-col overflow-hidden">
             <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2">
               <ShoppingCart size={18} className="text-orange-600" /> Giỏ hàng ({cart.length})
             </h3>
             <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-bold text-sm truncate text-gray-800">{item.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono italic truncate">{item.identifier}</p>
                      <p className="text-orange-600 font-bold text-xs mt-1">{formatCurrency(item.price)}</p>
                    </div>
                    <button onClick={() => removeFromCart(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all flex-shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
             <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-gray-500 font-medium uppercase text-[10px] tracking-wider">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-orange-600 tracking-tighter">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
               <button onClick={handleSaleSubmit} disabled={cart.length === 0} className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${cart.length > 0 ? "bg-orange-600 text-white shadow-lg hover:bg-orange-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                 <Save size={20} /> TẠO ĐƠN BÁN
               </button>
             </div>
           </div>
        ) : (
           <div className="bg-white flex-1 p-6 rounded-xl shadow-sm border flex flex-col justify-center text-center">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Gửi yêu cầu Kỹ Thuật</h3>
             <p className="text-sm text-gray-500 mb-8">Vui lòng kiểm tra lại thông tin khách hàng và thiết bị trước khi chuyển cho Tech định giá.</p>
             <button onClick={handleSendToTech} className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl bg-purple-600 text-white hover:bg-purple-700 transition-transform hover:-translate-y-1">
               <Send size={20} /> CHUYỂN CHO TECH ĐỊNH GIÁ
             </button>
           </div>
        )}
      </div>
    </div>
  );
}