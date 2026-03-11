import { useState, useEffect } from "react";
import { Wrench, CheckCircle, Calculator, DollarSign } from "lucide-react";
import { toast } from "react-toastify";

export default function TechTradeInList() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [valuation, setValuation] = useState({ price: "", techNote: "" });

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:9999/api/purchase-orders?orderType=PURCHASE&status=Pending_Tech", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPendingRequests(Array.isArray(data) ? data : (data.data || []));
    } catch (err) { 
      toast.error("Lỗi lấy danh sách định giá"); 
    }
  };

  const submitValuation = async () => {
    if(!valuation.price) return toast.error("Vui lòng nhập giá thu mua!");
    
    try {
      const token = localStorage.getItem("token"); 
      const res = await fetch(`http://localhost:9999/api/purchase-orders/${selectedRequest._id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            totalPrice: Number(valuation.price), 
            status: "Pending",
            note: valuation.techNote ? `[KẾT QUẢ TEST]: ${valuation.techNote}` : "Tech đã chốt giá" 
        })
      });

      if(res.ok) {
          toast.success("Đã định giá xong! Đã chuyển lại cho Sale.");
          setSelectedRequest(null);
          setValuation({ price: "", techNote: "" });
          fetchRequests();
      } else {
          toast.error("Lỗi cập nhật giá");
      }
    } catch(err) { toast.error("Lỗi hệ thống"); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Wrench className="text-purple-600" /> Yêu cầu định giá thu mua
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {pendingRequests.map(req => (
          <div key={req._id} className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{req.tempPhoneData?.phoneModelId?.name || "Máy khách bán"}</p>
              <p className="text-sm text-gray-500 font-mono">IMEI: {req.tempPhoneData?.imei || "Đang cập nhật"}</p>
              <p className="text-xs mt-2 bg-gray-100 inline-block px-2 py-1 rounded">Khách: {req.customerName} - {req.customerPhone}</p>
            </div>
            <button onClick={() => { setSelectedRequest(req); setValuation({price: "", techNote: ""}); }} className="bg-purple-100 text-purple-700 px-6 py-2 rounded-lg font-bold hover:bg-purple-200 flex items-center gap-2">
              <Calculator size={18}/> Bắt đầu định giá
            </button>
          </div>
        ))}
        {pendingRequests.length === 0 && <p className="text-gray-400 italic">Không có yêu cầu định giá nào đang chờ...</p>}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-[500px] shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Định giá thiết bị</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                <p><strong>Dòng máy:</strong> {selectedRequest.tempPhoneData?.phoneModelId?.name || "Máy khách bán"}</p>
                <p><strong>IMEI:</strong> {selectedRequest.tempPhoneData?.imei || "N/A"}</p>
                <p className="text-sm text-red-500 italic mt-2">Ghi chú Sale: {selectedRequest.note || "Không có"}</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block font-bold text-gray-700 mb-1">Kết quả test / Lý do trừ tiền</label>
                    <textarea value={valuation.techNote} onChange={e => setValuation({...valuation, techNote: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500" placeholder="VD: Pin chai, vỏ móp, màn hình xước..."></textarea>
                </div>
                <div>
                    <label className="block font-bold text-gray-700 mb-1">CHỐT GIÁ THU MUA (VND) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={20}/>
                        <input type="number" value={valuation.price} onChange={e => setValuation({...valuation, price: e.target.value})} className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:border-purple-600 text-xl font-black text-purple-700" placeholder="0" />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button onClick={() => setSelectedRequest(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold text-gray-700">Hủy</button>
                <button onClick={submitValuation} className="flex-1 bg-purple-600 py-3 rounded-xl font-bold text-white shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2">
                    <CheckCircle size={20}/> CHỐT GIÁ
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}