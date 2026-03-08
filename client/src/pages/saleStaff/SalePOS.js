import { useState, useEffect } from "react";
import {
  ShoppingCart,
  User,
  Smartphone,
  Package,
  Trash2,
  Plus,
  Save,
  Search,
  X // Thêm icon X để đóng Modal
} from "lucide-react";
import { toast } from "react-toastify";

export default function SalePOS() {
  const [orderType, setOrderType] = useState("SALE");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State cho Modal thu mua máy ngoài
  const [showModal, setShowModal] = useState(false);
  const [phoneModels, setPhoneModels] = useState([]);
  const [newPhone, setNewPhone] = useState({
    imei: "", phoneModelId: "", colorName: "", capacity: "", importPrice: ""
  });

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    fetchInventory();
    fetchPhoneModels(); // Load sẵn danh sách dòng máy
    setCart([]);
    setSearchQuery("");
  }, [orderType]);

  const fetchPhoneModels = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:9999/api/phone_models/all", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setPhoneModels(Array.isArray(data) ? data : data.data || []);
  } catch (error) {
    console.error("Không tải được danh sách Phone Models");
  }
};

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      const fetchStatus = orderType === "SALE" ? "in_stock" : "sold";

      const [phoneRes, itemRes] = await Promise.allSettled([
        fetch(`http://localhost:9999/api/phones?status=${fetchStatus}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:9999/api/items?status=${fetchStatus}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      let phones = [];
      let items = [];

      if (phoneRes.status === 'fulfilled' && phoneRes.value.ok) {
        const pData = await phoneRes.value.json();
        const pArray = Array.isArray(pData) ? pData : pData.data || [];
        phones = pArray.map(p => ({
          ...p,
          isPhone: true,
          displayPrice: orderType === "SALE" ? p.sellingPrice : p.importPrice,
          displayName: p.phoneModelId?.name || "Điện thoại"
        }));
      }

      if (itemRes.status === 'fulfilled' && itemRes.value.ok) {
        const iData = await itemRes.value.json();
        const iArray = Array.isArray(iData) ? iData : iData.data || [];
        items = iArray.map(i => ({
          ...i,
          isPhone: false,
          displayPrice: orderType === "SALE" ? i.price : i.baseCost,
          displayName: i.name || i.item_type?.name || "Linh kiện"
        }));
      }

      setInventory([...phones, ...items]);
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const addToCart = (product) => {
    if (cart.find((item) => item._id === product._id)) {
      return toast.info("Sản phẩm này đã có trong giỏ");
    }

    const itemToAdd = {
      ...product,
      phoneId: product.isPhone ? product._id : null,
      itemId: !product.isPhone ? product._id : null,
      price: product.displayPrice || 0,
      name: product.displayName,
      identifier: product.isPhone ? `IMEI: ${product.imei}` : `SN: ${product.serialCode}`
    };

    setCart([...cart, itemToAdd]);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleSubmit = async () => {
    if (!customer.name || cart.length === 0) {
      return toast.error("Vui lòng nhập tên khách và chọn ít nhất 1 sản phẩm");
    }
    if (!user) return toast.error("Phiên đăng nhập đã hết hạn");

    const token = localStorage.getItem("token");

    const payload = {
      storeId: user.storeId?._id || user.storeId,
      customerName: customer.name,
      customerPhone: customer.phone,
      totalPrice: calculateTotal(),
      createdBy: user._id,
      orderType,
      details: cart.map((item) => ({
        phoneId: item.phoneId,
        itemId: item.itemId,
        price: item.price,
        warranty: true,
        note: item.isPhone ? `Máy IMEI: ${item.imei}` : `Linh kiện SN: ${item.serialCode}`,
      })),
    };

    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Tạo đơn thành công!`);
        setCart([]);
        setCustomer({ name: "", phone: "" });
        fetchInventory(); 
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Lỗi khi tạo đơn hàng");
      }
    } catch (err) {
      toast.error("Lỗi hệ thống, không thể kết nối tới Server");
    }
  };

  // Hàm xử lý lưu máy mới thu mua vào DB và Giỏ hàng
  const handleAddNewPhone = async (e) => {
    e.preventDefault();
    if (!newPhone.imei || !newPhone.phoneModelId || !newPhone.importPrice) {
      return toast.error("Vui lòng nhập đủ IMEI, Dòng máy và Giá thu mua");
    }

    const token = localStorage.getItem("token");
    const payload = {
      imei: newPhone.imei,
      phoneModelId: newPhone.phoneModelId,
      colorName: newPhone.colorName || "Chưa rõ",
      capacity: newPhone.capacity || "Chưa rõ",
      importPrice: Number(newPhone.importPrice),
      sellingPrice: 0,
      storeId: user.storeId?._id || user.storeId,
      status: "in_stock", // Hoặc "pending_purchase" tùy DB của mày
      source: "customer_trade_in"
    };

    try {
      const res = await fetch("http://localhost:9999/api/phones/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Đã thêm máy vào hệ thống!");
        
        // Tìm tên Model để hiển thị
        const selectedModel = phoneModels.find(m => m._id === newPhone.phoneModelId);
        
        // Tự động nhét vào Giỏ hàng
        const phoneToCart = {
          ...data.data,
          phoneId: data.data._id,
          itemId: null,
          isPhone: true,
          price: Number(newPhone.importPrice),
          name: selectedModel?.name || "Máy thu mua ngoài",
          identifier: `IMEI: ${newPhone.imei}`
        };

        setCart([...cart, phoneToCart]);
        setShowModal(false);
        setNewPhone({ imei: "", phoneModelId: "", colorName: "", capacity: "", importPrice: "" });
        fetchInventory(); // Load lại kho
      } else {
        toast.error(data.message || "Lỗi tạo máy");
      }
    } catch (err) {
      toast.error("Lỗi kết nối tạo máy");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredInventory = inventory.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchName = item.displayName?.toLowerCase().includes(query);
    const matchImei = item.imei?.toLowerCase().includes(query);
    const matchSerial = item.serialCode?.toLowerCase().includes(query);
    return matchName || matchImei || matchSerial;
  });

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4 overflow-hidden relative">
      {/* CỘT TRÁI: DANH SÁCH KHO */}
      <div className="w-2/3 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-orange-50">
          <h2 className="font-bold text-orange-800 flex items-center gap-2">
            <Smartphone size={20} /> Kho hàng khả dụng
          </h2>
          <div className="flex bg-white rounded-lg p-1 border shadow-sm items-center">
            <button
              onClick={() => setOrderType("SALE")}
              className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${
                orderType === "SALE" ? "bg-orange-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              BÁN RA
            </button>
            <button
              onClick={() => setOrderType("PURCHASE")}
              className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${
                orderType === "PURCHASE" ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              THU MUA
            </button>
            {/* NÚT THÊM MÁY KHÁCH NGOÀI */}
            {orderType === "PURCHASE" && (
              <button
                onClick={() => setShowModal(true)}
                className="ml-2 px-3 py-1 bg-green-600 text-white rounded-md text-xs font-bold transition-all shadow-md hover:bg-green-700 flex items-center gap-1"
              >
                <Plus size={14} /> MÁY NGOÀI
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên máy, linh kiện, IMEI hoặc Serial..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <div
                key={item._id}
                onClick={() => addToCart(item)}
                className="border p-4 rounded-xl hover:border-orange-500 hover:shadow-md cursor-pointer transition-all bg-white group relative overflow-hidden flex flex-col justify-between min-h-[130px]"
              >
                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} className="text-orange-500" />
                </div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    {item.isPhone ? <Smartphone size={16} className="text-blue-500" /> : <Package size={16} className="text-orange-500" />}
                    <div className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">
                      {item.isPhone ? "MÁY" : "LINH KIỆN"}
                    </div>
                  </div>
                  <p className="font-bold text-gray-800 leading-snug line-clamp-2">
                    {item.displayName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1 italic truncate">
                    {item.isPhone ? `IMEI: ${item.imei}` : `SN: ${item.serialCode}`}
                  </p>
                </div>
                <p className="mt-2 text-orange-600 font-black text-lg">
                  {formatCurrency(item.displayPrice)}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-20 text-gray-400 italic">
              Không tìm thấy sản phẩm nào...
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2">
            <User size={18} className="text-orange-600" /> Thông tin khách hàng
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tên khách hàng"
              className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Số điện thoại"
              className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            />
          </div>
        </div>

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
                <button
                  onClick={() => removeFromCart(i)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all flex-shrink-0"
                >
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
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0}
              className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                cart.length > 0 
                ? "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Save size={20} /> XUẤT HÓA ĐƠN
            </button>
          </div>
        </div>
      </div>

      {/* MODAL THÊM MÁY THU MUA NGOÀI */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">Thêm Máy Khách Ngoài</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddNewPhone} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Số IMEI *</label>
                <input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={newPhone.imei} onChange={e => setNewPhone({...newPhone, imei: e.target.value})} placeholder="Nhập số IMEI" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Dòng Máy *</label>
                <select required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={newPhone.phoneModelId} onChange={e => setNewPhone({...newPhone, phoneModelId: e.target.value})}>
                  <option value="">-- Chọn dòng máy --</option>
                  {phoneModels.map(pm => (
                    <option key={pm._id} value={pm._id}>{pm.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Màu sắc</label>
                  <input type="text" className="w-full p-2 border rounded-lg outline-none"
                    value={newPhone.colorName} onChange={e => setNewPhone({...newPhone, colorName: e.target.value})} placeholder="VD: Đen" />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Dung lượng</label>
                  <input type="text" className="w-full p-2 border rounded-lg outline-none"
                    value={newPhone.capacity} onChange={e => setNewPhone({...newPhone, capacity: e.target.value})} placeholder="VD: 128GB" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Giá thu mua (VND) *</label>
                <input required type="number" min="0" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-orange-600 font-bold"
                  value={newPhone.importPrice} onChange={e => setNewPhone({...newPhone, importPrice: e.target.value})} placeholder="0" />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">
                  Lưu & Thêm vào giỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}