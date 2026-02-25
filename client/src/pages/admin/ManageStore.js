import { useState, useEffect } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

export default function ManageStore() {
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "", location: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách cửa hàng: " + error.message);
    }
  };

  // --- HÀM XÁC NHẬN VÀ XÓA VỚI SWEETALERT2 ---
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn không?",
      text: "Dữ liệu cửa hàng này sẽ không thể khôi phục sau khi xóa!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Có, xóa ngay!",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:9999/api/stores/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setStores(stores.filter((store) => store._id !== id));
            toast.success("Xóa cửa hàng thành công!");
          } else {
            toast.error("Xóa cửa hàng thất bại.");
          }
        } catch (error) {
          toast.error("Lỗi khi xóa cửa hàng: " + error.message);
        }
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xóa lỗi của field đó khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", location: "" });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setEditingId(store._id);
    setFormData({ code: store.code, name: store.name, location: store.location });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ code: "", name: "", location: "" });
    setErrors({});
  };

  // --- HÀM VALIDATE FORM ---
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Validate Code (Không rỗng, viết hoa, không dấu cách)
    if (!formData.code.trim()) {
      newErrors.code = "Vui lòng nhập Mã cửa hàng";
      isValid = false;
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = "Mã cửa hàng chỉ gồm chữ cái in hoa, số hoặc dấu gạch ngang (VD: STORE-1)";
      isValid = false;
    }

    // Validate Name (Không rỗng, ít nhất 3 ký tự)
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập Tên cửa hàng";
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Tên cửa hàng phải có ít nhất 3 ký tự";
      isValid = false;
    }

    // Validate Location (Không rỗng, ít nhất 5 ký tự)
    if (!formData.location.trim()) {
      newErrors.location = "Vui lòng nhập địa chỉ";
      isValid = false;
    } else if (formData.location.trim().length < 5) {
      newErrors.location = "Địa chỉ phải có ít nhất 5 ký tự";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // --- XỬ LÝ SUBMIT VỚI TOAST NOTIFICATION ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Dừng lại nếu form không hợp lệ
    if (!validateForm()) return;

    try {
      if (editingId) {
        const res = await fetch(`http://localhost:9999/api/stores/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const updatedStore = await res.json();
          setStores(stores.map((store) => (store._id === editingId ? updatedStore : store)));
          toast.success("Cập nhật thông tin cửa hàng thành công!");
          handleCloseModal();
        } else {
          toast.error("Cập nhật thất bại");
        }
      } else {
        const res = await fetch("http://localhost:9999/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const newStore = await res.json();
          setStores([...stores, newStore]);
          toast.success("Thêm cửa hàng mới thành công!");
          handleCloseModal();
        } else {
          const errorData = await res.json();
          toast.error(errorData.message || "Thêm cửa hàng thất bại"); 
        }
      }
    } catch (error) {
      toast.error("Lỗi khi lưu: " + error.message);
    }
  };

  return (
    <AdminLayout>
      {/* Component chứa các Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Cửa hàng</h2>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Thêm cửa hàng mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Mã cửa hàng</th>
                <th className="p-3 font-semibold text-gray-700">Tên cửa hàng</th>
                <th className="p-3 font-semibold text-gray-700">Địa chỉ</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-blue-600">{store.code}</td>
                  <td className="p-3">{store.name}</td>
                  <td className="p-3">{store.location}</td>
                  <td className="p-3 flex justify-center gap-4">
                    <button
                      onClick={() => handleOpenEdit(store)}
                      className="text-blue-500 hover:text-blue-700 transition"
                      title="Sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(store._id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">
                    Không tìm thấy cửa hàng nào. Nhấn "Thêm cửa hàng mới" để tạo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Update Store */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-xl">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">
              {editingId ? "Cập nhật cửa hàng" : "Thêm cửa hàng mới"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="VD: STORE-1"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.code ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  disabled={!!editingId} // Thường không cho phép sửa mã Store khi update
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="VD: Cửa hàng chi nhánh 1"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.name ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="VD: Đan Phượng, Hà Nội"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.location ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                >
                  {editingId ? "Lưu thay đổi" : "Tạo cửa hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}