import { useState, useEffect } from "react";
import { ShoppingCart, User, Smartphone, Package, Trash2, Save, Search, Settings, Send, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { toast } from "react-toastify";

export default function SalePOS() {
  const [orderType, setOrderType] = useState("SALE");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  
  // States cho Lọc và Phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // ALL, PHONE, ITEM
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Số sản phẩm trên 1 trang

  const [tradeInRequest, setTradeInRequest] = useState({ note: "" });

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    fetchInventory();
    setCart([]);
    setSearchQuery("");
    setCategoryFilter("ALL");
    setCurrentPage(1);
  }, [orderType]);

  // Reset về trang 1 khi gõ tìm kiếm hoặc đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

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
        identifier: `Mã: ${p._id.substring(p._id.length - 6).toUpperCase()}` // Dùng 6 số cuối ID thay cho IMEI
      }));
      
      const formattedItems = (Array.isArray(itemsData) ? itemsData : itemsData.data || []).map(i => ({ 
        ...i, 
        isPhone: false, 
        displayPrice: i.price, 
        displayName: i.name || i.item_type?.name,
        identifier: `SN: ${i.serialCode}`
      }));
      
      setInventory([...formattedPhones, ...formattedItems]);
    } catch (err) { toast.error("Lỗi kết nối kho"); }
  };

  const addToCart = (product) => {
    if (cart.find((item) => item._id === product._id)) return toast.info("Đã có trong giỏ");
    setCart([...cart, { 
      ...product, 
      phoneId: product.isPhone ? product._id : null, 
      itemId: !product.isPhone ? product._id : null, 
      price: product.displayPrice, 
      name: product.displayName, 
      identifier: product.identifier 
    }]);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price || 0), 0);

  // HÀM VALIDATE KHÁCH HÀNG CHUNG
  const validateCustomer = () => {
    if (!customer.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng!");
      return false;
    }
    // Regex check SĐT Việt Nam hợp lệ (Bắt đầu bằng 0, độ dài 10 số)
    const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(customer.phone)) {
      toast.error("Số điện thoại không hợp lệ! (Ví dụ: 0987654321)");
      return false;
    }
    return true;
  };

  const handleSaleSubmit = async () => {
    if (!validateCustomer()) return;
    if (cart.length === 0) return toast.error("Vui lòng chọn sản phẩm vào giỏ!");
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, 
        body: JSON.stringify(payload)
      });
      if (res.ok) { 
        toast.success(`Tạo đơn bán thành công!`); 
        setCart([]); 
        setCustomer({name:"", phone:""}); 
        fetchInventory(); 
      } else {
        toast.error("Tạo đơn thất bại");
      }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  const handleSendToTech = async () => {
    if (!validateCustomer()) return;
    if (!user) return toast.error("Vui lòng đăng nhập lại");

    const token = localStorage.getItem("token");
    const payload = {
      storeId: user.storeId?._id || user.storeId,
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
        method: "POST", 
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, 
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(`Đã chuyển yêu cầu thu máy sang bộ phận Kỹ Thuật!`);
        setCustomer({name:"", phone:""});
        setTradeInRequest({note: ""});
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Tạo yêu cầu thất bại");
      }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  // LOGIC LỌC & PHÂN TRANG DANH SÁCH SẢN PHẨM
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = (item.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.identifier || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter === "PHONE") matchesCategory = item.isPhone;
    if (categoryFilter === "ITEM") matchesCategory = !item.isPhone;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const currentItems = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4 overflow-hidden">
      
      {/* CỘT TRÁI: DANH SÁCH MÁY / FORM THU CŨ */}
      <div className="w-2/3 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden border">
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
          <>
            {/* Thanh tìm kiếm và bộ lọc */}
            <div className="p-4 bg-white border-b flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm tên máy, mã SN..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3">
                <Filter size={18} className="text-gray-400"/>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent py-2 outline-none font-medium text-gray-700"
                >
                  <option value="ALL">Tất cả sản phẩm</option>
                  <option value="PHONE">Chỉ Điện thoại</option>
                  <option value="ITEM">Chỉ Linh kiện</option>
                </select>
              </div>
            </div>

            {/* Lưới sản phẩm */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentItems.map((item) => (
                  <div key={item._id} onClick={() => addToCart(item)} className="border p-4 rounded-xl hover:border-orange-500 hover:shadow-md cursor-pointer transition-all bg-white flex flex-col h-full">
                    <div className="flex justify-between mb-2 text-gray-400">
                      {item.isPhone ? <Smartphone size={18} className="text-blue-500"/> : <Package size={18} className="text-emerald-500"/>}
                      <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">Sẵn sàng</span>
                    </div>
                    <p className="font-bold text-sm leading-tight flex-1">{item.displayName}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-2 bg-gray-50 p-1 rounded text-center truncate" title={item.identifier}>{item.identifier}</p>
                    <p className="text-orange-600 font-black mt-2 text-lg text-right">{formatCurrency(item.displayPrice)}</p>
                  </div>
                ))}
              </div>
              {currentItems.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Package size={40} className="mb-2 opacity-50"/>
                    <p>Không tìm thấy sản phẩm nào</p>
                 </div>
              )}
            </div>

            {/* Thanh Phân trang */}
            {totalPages > 1 && (
              <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-500">Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredInventory.length)} / {filteredInventory.length}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="p-1.5 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                  >
                    <ChevronLeft size={20}/>
                  </button>
                  <span className="px-3 py-1.5 text-sm font-bold">{currentPage} / {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="p-1.5 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                  >
                    <ChevronRight size={20}/>
                  </button>
                </div>
              </div>
            )}
          </>
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

      {/* CỘT PHẢI: THÔNG TIN KHÁCH HÀNG & ACTION */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2">
            <User size={18} className={orderType === "SALE" ? "text-orange-600" : "text-purple-600"} /> 
            Thông tin khách hàng <span className="text-red-500">*</span>
          </h3>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Tên khách hàng" 
              value={customer.name} 
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })} 
              className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} 
            />
            <input 
              type="text" 
              placeholder="Số điện thoại (VD: 0912345678)" 
              value={customer.phone} 
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} 
              className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} 
            />
          </div>
        </div>

        {orderType === "SALE" ? (
           <div className="bg-white flex-1 p-4 rounded-xl shadow-sm border flex flex-col overflow-hidden">
             <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2">
               <ShoppingCart size={18} className="text-orange-600" /> Giỏ hàng ({cart.length})
             </h3>
             <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 && <p className="text-center text-sm text-gray-400 mt-10">Chưa có sản phẩm</p>}
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
             <p className="text-sm text-gray-500 mb-8">Kiểm tra kỹ SĐT khách hàng trước khi chuyển máy cho Kỹ thuật định giá.</p>
             <button onClick={handleSendToTech} className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl bg-purple-600 text-white hover:bg-purple-700 transition-transform hover:-translate-y-1">
               <Send size={20} /> CHUYỂN CHO TECH ĐỊNH GIÁ
             </button>
           </div>
        )}
      </div>
    </div>
  );
}