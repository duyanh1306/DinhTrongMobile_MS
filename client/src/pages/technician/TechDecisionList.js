// 3. Tạo file Frontend mới: TechDecisionList.js (Màn hình để Tech xử lý hàng chờ)
import { useState, useEffect } from "react";
import { Settings, Hammer, Scissors, Save, X, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export default function TechDecisionList() {
  const [waitingPhones, setWaitingPhones] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [decision, setDecision] = useState("SELL"); // "SELL" hoặc "DISMANTLE"
  const [itemTypes, setItemTypes] = useState([]);

  // Form Bán
  const [sellForm, setSellForm] = useState({ sellingPrice: "", capacity: "", colorName: "" });
  
  // Form Rã xác
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

  const addPartRow = () => {
    setDismantleParts([...dismantleParts, { itemTypeId: "", serialCode: "", baseCost: "", price: "" }]);
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
    if (decision === "DISMANTLE" && dismantleParts.some(p => !p.itemTypeId)) return toast.error("Vui lòng chọn loại linh kiện cho tất cả các dòng!");

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
          parts: dismantleParts
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
              <p className="text-sm text-gray-500 font-mono">IMEI: {phone.imei}</p>
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
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
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
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="font-bold text-gray-700">Danh sách linh kiện rã được</label>
                    <button onClick={addPartRow} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-700">
                      <Plus size={14}/> Thêm linh kiện
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="pb-2">Loại linh kiện <span className="text-red-500">*</span></th>
                        <th className="pb-2">Serial / Mã (Tùy chọn)</th>
                        <th className="pb-2">Giá vốn định giá</th>
                        <th className="pb-2">Giá bán lẻ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dismantleParts.map((part, idx) => (
                        <tr key={idx}>
                          <td className="pr-2 pb-2">
                            <select value={part.itemTypeId} onChange={(e) => handlePartChange(idx, "itemTypeId", e.target.value)} className="w-full p-2 border rounded outline-none">
                              <option value="">-- Chọn --</option>
                              {itemTypes.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                            </select>
                          </td>
                          <td className="pr-2 pb-2"><input type="text" placeholder="Auto tạo nếu trống" value={part.serialCode} onChange={(e) => handlePartChange(idx, "serialCode", e.target.value)} className="w-full p-2 border rounded outline-none"/></td>
                          <td className="pr-2 pb-2"><input type="number" placeholder="0" value={part.baseCost} onChange={(e) => handlePartChange(idx, "baseCost", e.target.value)} className="w-full p-2 border rounded outline-none"/></td>
                          <td className="pr-2 pb-2"><input type="number" placeholder="0" value={part.price} onChange={(e) => handlePartChange(idx, "price", e.target.value)} className="w-full p-2 border rounded outline-none"/></td>
                          <td className="pb-2"><button onClick={() => removePartRow(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dismantleParts.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Bấm "Thêm linh kiện" để nhập các món rã được</p>}
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