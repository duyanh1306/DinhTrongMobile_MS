import { useState } from "react";
import { User, Save, FileText } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createRepairOrderApi } from "../../api/saleStaff/createRepairOrder"; 

export default function SaleCreateRepairOrder() {
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const validateCustomer = () => {
    if (!customer.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng!");
      return false;
    }
    if (customer.phone && !/(0[3|5|7|8|9])+([0-9]{8})\b/.test(customer.phone)) {
      toast.error("Số điện thoại không hợp lệ! (Ví dụ: 0987654321)");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateCustomer()) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      toast.error("Vui lòng đăng nhập lại");
      return;
    }

    const currentStoreId = user.storeId?._id || user.storeId;
    if (!currentStoreId) {
      toast.error("Tài khoản này chưa thuộc Cửa hàng nào! Hãy báo Admin phân quyền, sau đó Đăng xuất ra vào lại.");
      return;
    }

    setLoading(true);

    const payload = {
      storeId: currentStoreId,
      customerName: customer.name,
      customerPhone: customer.phone,
      note: note,
      createdBy: user._id
    };

    const result = await createRepairOrderApi(payload);
      
    if (result.success) {
        toast.success("Đã tạo đơn sửa chữa thành công!");
        setCustomer({ name: "", phone: "" });
        setNote("");
    } else {
        toast.error(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4 overflow-hidden">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-2xl mx-auto w-full overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
              <Save size={24} className="text-blue-600" />
              Tạo đơn sửa chữa
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Nhập thông tin khách hàng để tạo đơn sửa chữa
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                <User size={18} className="text-blue-600" />
                Thông tin khách hàng <span className="text-red-500">*</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên khách hàng"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0912345678"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                <FileText size={18} className="text-blue-600" />
                Ghi chú tình trạng khách báo (Tùy chọn)
              </h3>
              <textarea
                rows="4"
                placeholder="VD: Khách báo vỡ màn hình, liệt cảm ứng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  loading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Tạo đơn sửa chữa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}