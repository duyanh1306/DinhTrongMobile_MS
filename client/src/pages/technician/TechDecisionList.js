import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { Settings, Hammer, Scissors, Save, X, Plus, Trash2, Package, Download } from "lucide-react";
import { toast } from "react-toastify";

const parseChecklistFromNote = (noteStr) => {
  if (!noteStr) return [];
  const lines = noteStr.split('\n');
  const parsed = [];
  lines.forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('-') && !cleanLine.includes('Cấu hình') && !cleanLine.includes('Ghi chú thêm')) {
      const parts = cleanLine.split(':');
      if (parts.length >= 2) {
        const name = parts[0].replace('-', '').trim();
        const statusStr = parts.slice(1).join(':').trim();
        const isBroken = statusStr.toLowerCase().includes('hỏng') || statusStr.toLowerCase().includes('kém');
        parsed.push({ name, statusStr, isBroken });
      }
    }
  });
  return parsed;
};

export default function TechDecisionList() {
  const [waitingPhones, setWaitingPhones] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [decision, setDecision] = useState("DIRECT_IMPORT"); 
  const [itemTypes, setItemTypes] = useState([]);

  const [sellForm, setSellForm] = useState({ sellingPrice: "", capacity: "", colorName: "" });
  const [dismantleParts, setDismantleParts] = useState([]);

  const parsedChecklist = selectedPhone ? parseChecklistFromNote(selectedPhone.notes || selectedPhone.note || "") : [];

  useEffect(() => {
    fetchWaitingPhones();
    fetchItemTypes();
  }, []);

  const fetchWaitingPhones = async () => {
    try {
      const res = await axiosClient.get("/phones?status=waiting_for_tech_decision");
      setWaitingPhones(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) { toast.error("Lỗi tải danh sách chờ"); }
  };

  const fetchItemTypes = async () => {
    try {
      const res = await axiosClient.get("/item_types");
      setItemTypes(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) { console.log("Lỗi tải loại linh kiện"); }
  };

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

  const handleExtractPart = (parsedItem) => {
    addPartRow();
  };

  const handleSubmit = async () => {
    if (decision === "SELL" && !sellForm.sellingPrice) return toast.error("Vui lòng nhập giá bán!");
    if (decision === "DISMANTLE") {
        if (dismantleParts.length === 0) return toast.error("Vui lòng thêm ít nhất 1 linh kiện!");
        if (dismantleParts.some(p => !p.itemTypeId || !p.name)) return toast.error("Vui lòng nhập Loại và Tên cho tất cả linh kiện!");
    }

    try {
      const res = await axiosClient.put(`/phones/${selectedPhone._id}/tech-decision`, {
        decision,
        ...sellForm,
        parts: dismantleParts,
        phoneName: selectedPhone.phoneModelId?.name
      });

      if (res.data || res.status === 200) {
        toast.success("Xử lý thành công!");
        setSelectedPhone(null);
        fetchWaitingPhones();
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
          <div key={phone._id} className="bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:shadow-md transition">
            <div>
              <p className="font-bold text-lg">{phone.phoneModelId?.name || "Máy chưa rõ"}</p>
              <p className="text-sm text-gray-500 font-mono">Mã máy: #{phone._id.substring(phone._id.length - 6).toUpperCase()}</p>
              <p className="text-sm text-gray-600 mt-1">Màu: {phone.colorName} - {phone.capacity}</p>
              <p className="text-xs mt-1 text-red-500 font-medium">Giá vốn nhập: {new Intl.NumberFormat('vi-VN').format(phone.importPrice || 0)} đ</p>
            </div>
            <button 
              onClick={() => { 
                setSelectedPhone(phone); 
                setDecision("DIRECT_IMPORT"); 
                setSellForm({ sellingPrice: "", capacity: phone.capacity || "", colorName: phone.colorName || "" });
                setDismantleParts([]);
              }} 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm"
            >
              Quyết định xử lý
            </button>
          </div>
        ))}
        {waitingPhones.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 italic">Kho chờ đang trống, không có máy nào cần xử lý.</p>
            </div>
        )}
      </div>

      {selectedPhone && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold">Xử lý thiết bị: <span className="text-blue-600">{selectedPhone.phoneModelId?.name}</span></h3>
              <button onClick={() => setSelectedPhone(null)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex gap-3 mb-6 bg-white p-2 rounded-xl shadow-sm border">
                <button onClick={() => setDecision("DIRECT_IMPORT")} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${decision === "DIRECT_IMPORT" ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                  <Download size={18}/> Nhập kho ngay
                </button>
                <button onClick={() => setDecision("SELL")} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${decision === "SELL" ? "bg-green-100 text-green-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                  <Hammer size={18}/> Tân trang / Sửa bán
                </button>
                <button onClick={() => setDecision("DISMANTLE")} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${decision === "DISMANTLE" ? "bg-red-100 text-red-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                  <Scissors size={18}/> Rã xác lấy linh kiện
                </button>
              </div>

              {parsedChecklist.length > 0 && (
                <div className="bg-white p-5 rounded-xl border shadow-sm mb-6">
                  <h4 className="font-bold text-gray-700 border-b pb-2 mb-4 uppercase text-sm">Kết quả kiểm định thu mua</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parsedChecklist.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                            <span className="font-semibold text-gray-700">{item.name}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${item.isBroken ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                              {item.statusStr}
                            </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {decision === "DIRECT_IMPORT" && (
                <div className="text-center bg-blue-50 border border-blue-200 p-8 rounded-xl shadow-inner my-8">
                    <p className="text-blue-700 font-bold text-lg mb-2">Nhập nguyên bản vào kho</p>
                    <p className="text-sm text-blue-600 max-w-md mx-auto">Thiết bị sẽ được chuyển thẳng vào trạng thái <strong>Sẵn sàng bán (In Stock)</strong> mà không qua tân trang hay rã xác.</p>
                </div>
              )}

              {decision === "SELL" && (
                <div className="bg-green-50/50 p-5 rounded-xl border border-green-100 shadow-sm my-6">
                  <h4 className="font-bold text-green-800 mb-4 uppercase text-sm border-b border-green-200 pb-2">Khai báo Thông tin Bán</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-sm">Dung lượng</label>
                      <input type="text" placeholder="VD: 128GB" value={sellForm.capacity} onChange={e => setSellForm({...sellForm, capacity: e.target.value})} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-green-500"/>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-sm">Màu sắc</label>
                      <input type="text" placeholder="VD: Đen" value={sellForm.colorName} onChange={e => setSellForm({...sellForm, colorName: e.target.value})} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-green-500"/>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-red-600 mb-1 text-sm">GIÁ BÁN RA DỰ KIẾN (VNĐ) <span className="text-red-500">*</span></label>
                    <input type="number" placeholder="Nhập giá niêm yết bán ra..." value={sellForm.sellingPrice} onChange={e => setSellForm({...sellForm, sellingPrice: e.target.value})} className="w-full p-3 bg-white border-2 border-green-300 rounded-lg outline-none focus:border-green-600 text-lg font-bold text-green-700"/>
                  </div>
                </div>
              )}

              {decision === "DISMANTLE" && (
                <div className="bg-white p-5 rounded-xl border shadow-sm my-6">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <label className="font-bold text-gray-800 flex items-center gap-2"><Package size={18} className="text-red-600"/> Danh sách đồ rã xác</label>
                    <button onClick={addPartRow} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-red-100 text-sm transition">
                      <Plus size={16}/> Thêm form trống
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">Gợi ý (Bấm vào linh kiện Tốt để khai báo nhanh):</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                      {parsedChecklist.filter(i => !i.isBroken).map((item, idx) => (
                          <span key={idx} onClick={() => handleExtractPart(item)} className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-full text-xs font-bold text-gray-700 cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition shadow-sm">
                              + Bóc {item.name}
                          </span>
                      ))}
                      {parsedChecklist.filter(i => !i.isBroken).length === 0 && <span className="text-xs text-gray-400 italic">Không có linh kiện tốt</span>}
                  </div>
                  
                  <div className="space-y-4">
                      {dismantleParts.map((part, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-200 relative bg-gray-50 shadow-sm group hover:border-red-300 transition">
                            <button onClick={() => removePartRow(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 bg-white p-2 rounded-full shadow border transition"><Trash2 size={16}/></button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-10 mb-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Loại LK *</label>
                                    <select value={part.itemTypeId} onChange={(e) => handlePartChange(idx, "itemTypeId", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-red-500">
                                        <option value="">-- Chọn --</option>
                                        {itemTypes.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên hiển thị *</label>
                                    <input type="text" placeholder="VD: Mainboard zin..." value={part.name} onChange={(e) => handlePartChange(idx, "name", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-red-500"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Serial (SN)</label>
                                    <input type="text" placeholder="Tự sinh nếu trống" value={part.serialCode} onChange={(e) => handlePartChange(idx, "serialCode", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm font-mono focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tình trạng</label>
                                    <input type="text" value={part.quality} onChange={(e) => handlePartChange(idx, "quality", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dung lượng</label>
                                    <input type="text" value={part.capacity} onChange={(e) => handlePartChange(idx, "capacity", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">RAM</label>
                                    <input type="text" value={part.ram} onChange={(e) => handlePartChange(idx, "ram", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-red-500"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-red-50/50 p-3 rounded-lg border border-red-100">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Màu sắc</label>
                                    <input type="text" value={part.color} onChange={(e) => handlePartChange(idx, "color", e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-red-500 bg-white"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Giá vốn nhập</label>
                                    <input type="number" placeholder="0" value={part.baseCost} onChange={(e) => handlePartChange(idx, "baseCost", e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm font-bold text-gray-700 bg-white focus:ring-2 focus:ring-red-500"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-red-600 uppercase mb-1">Giá bán lẻ (VND) *</label>
                                    <input type="number" placeholder="0" value={part.price} onChange={(e) => handlePartChange(idx, "price", e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm font-bold text-red-600 bg-white focus:ring-2 focus:ring-red-500"/>
                                </div>
                            </div>
                        </div>
                      ))}
                      {dismantleParts.length === 0 && (
                          <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-red-200">
                              <p className="text-gray-500 text-sm">Bấm "Thêm form trống" hoặc các Gợi ý bên trên để khai báo</p>
                          </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white flex gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedPhone(null)} className="flex-1 py-3.5 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">Hủy bỏ</button>
              <button 
                onClick={handleSubmit} 
                className={`flex-[2] py-3.5 rounded-xl font-black text-white flex justify-center items-center gap-2 shadow-lg transition-transform hover:-translate-y-1 ${
                    decision === "DISMANTLE" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Save size={20}/> XÁC NHẬN LƯU VÀO KHO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}