import { useState, useEffect } from "react";
import { User, Wrench, Save, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function SaleCreateRepairOrder() {
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [repairServices, setRepairServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRepairServices();
  }, []);

  const fetchRepairServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:9999/api/repair_services", {
        headers: { 
          "Authorization": `Bearer ${token}` 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRepairServices(Array.isArray(data.data) ? data.data : []);
      } else {
        console.error("Failed to fetch repair services:", res.status);
        toast.error("Không thể tải danh sách dịch vụ sửa chữa");
      }
    } catch (error) {
      console.error("Error fetching repair services:", error);
      toast.error("Lỗi khi tải danh sách dịch vụ sửa chữa: " + error.message);
    }
  };

  const validateCustomer = () => {
    if (!customer.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng!");
      return false;
    }
    if (!/(0[3|5|7|8|9])+([0-9]{8})\b/.test(customer.phone)) {
      toast.error("Số điện thoại không hợp lệ! (Ví dụ: 0987654321)");
      return false;
    }
    if (!selectedService) {
      toast.error("Vui lòng chọn dịch vụ sửa chữa!");
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
    const token = localStorage.getItem("token");

    const payload = {
      storeId: currentStoreId,
      customerName: customer.name,
      customerPhone: customer.phone,
      repairServiceId: selectedService,
      customerNote: customerNote,
      createdBy: user._id
    };

    try {
      const res = await fetch("http://localhost:9999/api/repair-orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success("Đã tạo đơn sửa chữa thành công!");
        // Reset form
        setCustomer({ name: "", phone: "" });
        setSelectedService("");
        setCustomerNote("");
      } else {
        toast.error(result.message || "Tạo đơn sửa chữa thất bại");
      }
    } catch (err) {
      toast.error("Lỗi kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4 overflow-hidden">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
              <Wrench size={24} className="text-blue-600" />
              Tạo đơn sửa chữa
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Nhập thông tin khách hàng và chọn dịch vụ sửa chữa cần thực hiện
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Thông tin khách hàng */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                <User size={18} className="text-blue-600" />
                Thông tin khách hàng <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Số điện thoại <span className="text-red-500">*</span>
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

            {/* Chọn dịch vụ sửa chữa */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Wrench size={18} className="text-blue-600" />
                Dịch vụ sửa chữa <span className="text-red-500">*</span>
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn dịch vụ <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Chọn dịch vụ sửa chữa --</option>
                  {repairServices.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price || 0)}
                    </option>
                  ))}
                </select>
                {repairServices.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Đang tải danh sách dịch vụ...
                  </p>
                )}
              </div>
            </div>

            {/* Ghi chú của khách hàng */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                <AlertCircle size={18} className="text-orange-600" />
                Ghi chú từ khách hàng
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả lỗi hoặc yêu cầu (Tùy chọn)
                </label>
                <textarea
                  placeholder="VD: Máy hay sập nguồn, màn hình nhấp nháy, không sạc được..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  rows="4"
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                ></textarea>
              </div>
            </div>

            {/* Nút tạo đơn */}
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