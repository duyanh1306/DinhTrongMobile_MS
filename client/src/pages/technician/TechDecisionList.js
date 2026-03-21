import { useState, useEffect } from "react";
import { Settings, Hammer, Scissors, Save, X, Plus, Trash2, Package } from "lucide-react";
import { toast } from "react-toastify";

export default function TechDecisionList() {
  const [waitingPhones, setWaitingPhones] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [decision, setDecision] = useState("SELL"); 
  const [itemTypes, setItemTypes] = useState([]);

  // Form Bán
  const [sellForm, setSellForm] = useState({ sellingPrice: "", capacity: "", colorName: "" });
  
  // Form Rã xác (ĐÃ THÊM CÁC TRƯỜNG MỚI)
  const [dismantleParts, setDismantleParts] = useState([]);

  useEffect(() => {
    fetchWaitingPhones();
    fetchItemTypes();
  }, []);

  const fetchWaitingPhones = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:9999/api/phones?status=waiting_for_tech_decision", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setWaitingPhones(Array.isArray(data) ? data : data.data || []);
    } catch (err) { toast.error("Lỗi tải danh sách chờ"); }
  };

  const fetchItemTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:9999/api/item_types", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setItemTypes(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.log("Lỗi tải loại linh kiện"); }
  };

  // THÊM CÁC THUỘC TÍNH VÀO STATE MẶC ĐỊNH
  const addPartRow = () => {
    setDismantleParts([
      ...dismantleParts, 
      { 
        itemTypeId: "", name: "", serialCode: "", quality: "Zin bóc máy", 
        ram: "", capacity: "", color: "", baseCost: "", price: "" 
      }
    ]);
  };

  const removePartRow = (index) => {
    setDismantleParts(dismantleParts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...dismantleParts];
    newParts[index][field] = value;
    setDismantleParts(newParts);
  };

  const handleSubmit = async () => {
    if (decision === "SELL" && !sellForm.sellingPrice) return toast.error("Vui lòng nhập giá bán!");
    if (decision === "DISMANTLE") {
        if (dismantleParts.length === 0) return toast.error("Vui lòng thêm ít nhất 1 linh kiện!");
        if (dismantleParts.some(p => !p.itemTypeId || !p.name)) return toast.error("Vui lòng nhập Loại và Tên cho tất cả linh kiện!");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:9999/api/phones/${selectedPhone._id}/tech-decision`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          ...sellForm,
          parts: dismantleParts,
          phoneName: selectedPhone.phoneModelId?.name // Truyền tên máy gốc xuống backend
        })
      });

      if (res.ok) {
        toast.success("Xử lý thành công!");
        setSelectedPhone(null);
        fetchWaitingPhones();
      } else {
        toast.error("Lỗi xử lý");
      }
    } catch (err) { toast.error("Lỗi hệ thống"); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="text-blue-600" /> Máy chờ Kỹ thuật quyết định
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {waitingPhones.map(phone => (
          <div key={phone._id} className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{phone.phoneModelId?.name || "Máy chưa rõ"}</p>
              <p className="text-sm text-gray-500 font-mono">Mã máy: #{phone._id.substring(phone._id.length - 6).toUpperCase()}</p>
              <p className="text-xs mt-1 text-red-500 font-medium">Giá vốn nhập: {new Intl.NumberFormat('vi-VN').format(phone.importPrice)} đ</p>
            </div>
            <button 
              onClick={() => { 
                setSelectedPhone(phone); 
                setDecision("SELL"); 
                setSellForm({ sellingPrice: "", capacity: "", colorName: "" });
                setDismantleParts([]);
              }} 
              className="bg-blue-100 text-blue-700 px-6 py-2 rounded-lg font-bold hover:bg-blue-200"
            >
              Quyết định xử lý
            </button>
          </div>
        ))}
        {waitingPhones.length === 0 && <p className="text-gray-400 italic">Kho chờ đang trống...</p>}
      </div>

      {selectedPhone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Xử lý: {selectedPhone.phoneModelId?.name} (IMEI: {selectedPhone.imei})</h3>
              <button onClick={() => setSelectedPhone(null)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => setDecision("SELL")} 
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${decision === "SELL" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-400"}`}
                >
                  <Hammer size={20}/> TÂN TRANG / SỬA ĐỂ BÁN
                </button>
                <button 
                  onClick={() => setDecision("DISMANTLE")} 
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${decision === "DISMANTLE" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-400"}`}
                >
                  <Scissors size={20}/> RÃ XÁC LẤY LINH KIỆN
                </button>
              </div>

              {decision === "SELL" ? (
                <div className="space-y-4 bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Dung lượng</label>
                      <input type="text" placeholder="VD: 128GB" value={sellForm.capacity} onChange={e => setSellForm({...sellForm, capacity: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"/>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Màu sắc</label>
                      <input type="text" placeholder="VD: Đen" value={sellForm.colorName} onChange={e => setSellForm({...sellForm, colorName: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"/>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">GIÁ BÁN RA (VNĐ) <span className="text-red-500">*</span></label>
                    <input type="number" placeholder="Nhập giá niêm yết bán ra..." value={sellForm.sellingPrice} onChange={e => setSellForm({...sellForm, sellingPrice: e.target.value})} className="w-full p-3 border-2 border-green-200 rounded-lg outline-none focus:border-green-500 text-xl font-bold text-green-700"/>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50/30 p-4 rounded-xl border border-red-100">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-red-200">
                    <label className="font-bold text-gray-700 flex items-center gap-2">
                        <Package size={18} className="text-red-600"/> Danh sách linh kiện rã được
                    </label>
                    <button onClick={addPartRow} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-red-700 shadow-sm transition">
                      <Plus size={16}/> Thêm linh kiện
                    </button>
                  </div>
                  
                  {/* DANH SÁCH CARD NHẬP LINH KIỆN */}
                  <div className="space-y-4">
                      {dismantleParts.map((part, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                            <button onClick={() => removePartRow(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition">
                                <Trash2 size={16}/>
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-10 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại linh kiện *</label>
                                    <select value={part.itemTypeId} onChange={(e) => handlePartChange(idx, "itemTypeId", e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-red-500">
                                        <option value="">-- Chọn --</option>
                                        {itemTypes.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên hiển thị *</label>
                                    <input type="text" placeholder="VD: Mainboard iPhone 14 Pro (Zin bóc máy)" value={part.name} onChange={(e) => handlePartChange(idx, "name", e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serial (SN)</label>
                                    <input type="text" placeholder="Auto tạo nếu trống" value={part.serialCode} onChange={(e) => handlePartChange(idx, "serialCode", e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tình trạng</label>
                                    <input type="text" placeholder="VD: Zin keng" value={part.quality} onChange={(e) => handlePartChange(idx, "quality", e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dung lượng</label>
                                    <input type="text" placeholder="VD: 256GB" value={part.capacity} onChange={(e) => handlePartChange(idx, "capacity", e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RAM</label>
                                    <input type="text" placeholder="VD: 6GB" value={part.ram} onChange={(e) => handlePartChange(idx, "ram", e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-red-50/50 p-3 rounded-lg border border-red-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Màu sắc</label>
                                    <input type="text" placeholder="VD: Tím (Deep Purple)" value={part.color} onChange={(e) => handlePartChange(idx, "color", e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá vốn định giá</label>
                                    <input type="number" placeholder="0" value={part.baseCost} onChange={(e) => handlePartChange(idx, "baseCost", e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-red-600 uppercase mb-1">Giá bán lẻ (VND)</label>
                                    <input type="number" placeholder="0" value={part.price} onChange={(e) => handlePartChange(idx, "price", e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600"/>
                                </div>
                            </div>
                        </div>
                      ))}
                      {dismantleParts.length === 0 && (
                          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-red-200">
                              <p className="text-gray-400 italic">Bấm "Thêm linh kiện" để nhập chi tiết các món rã được</p>
                          </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white flex gap-3">
              <button onClick={() => setSelectedPhone(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Hủy</button>
              <button onClick={handleSubmit} className={`flex-1 py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 ${decision === "SELL" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                <Save size={20}/> XÁC NHẬN LƯU KHO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}