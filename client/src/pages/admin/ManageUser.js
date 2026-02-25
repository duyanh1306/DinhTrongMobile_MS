import { useState, useEffect } from "react";
import { Search, Edit, Trash2, Eye, Key, Plus, X } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

export default function ManageUser() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("STAFF");

  // Modals state
  const [modalType, setModalType] = useState(null); // 'DETAIL', 'CREATE_STAFF', 'UPDATE', null
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", userName: "", email: "", number: "", birthday: "", roleId: "", status: "active", password: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng: " + error.message);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách vai trò: " + error.message);
    }
  };

  // Lọc danh sách User
  const filteredUsers = users.filter((user) => {
    const matchName = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userName?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchRole = true;
    const roleCode = user.roleId?.id;

    if (selectedFilter === "STAFF") {
      matchRole = roleCode === "SALE_STAFF" || roleCode === "TECHNICIAN";
    } else if (selectedFilter !== "ALL") {
      matchRole = roleCode === selectedFilter;
    }

    return matchName && matchRole;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // --- HÀM VALIDATE FORM ---
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên";
      isValid = false;
    }

    if (!formData.userName.trim()) {
      newErrors.userName = "Vui lòng nhập tên đăng nhập";
      isValid = false;
    } else if (/\s/.test(formData.userName)) {
      newErrors.userName = "Tên đăng nhập không được chứa khoảng trắng";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Định dạng email không hợp lệ";
      isValid = false;
    }

    if (modalType === "CREATE_STAFF") {
      if (!formData.password) {
        newErrors.password = "Vui lòng nhập mật khẩu";
        isValid = false;
      } else if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        isValid = false;
      }
    }

    if (formData.number && !/^[0-9]{10,11}$/.test(formData.number)) {
      newErrors.number = "Số điện thoại phải có 10-11 chữ số";
      isValid = false;
    }

    if (!formData.birthday) {
      newErrors.birthday = "Vui lòng chọn ngày sinh";
      isValid = false;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birthDate = new Date(formData.birthday);
      if (birthDate >= today) {
        newErrors.birthday = "Ngày sinh không hợp lệ (phải trong quá khứ)";
        isValid = false;
      }
    }

    if (!formData.roleId) {
      newErrors.roleId = "Vui lòng chọn vai trò";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const openCreateStaffModal = () => {
    // Tìm ID của role SALE_STAFF để làm mặc định
    const staffRole = roles.find((r) => r.id === "SALE_STAFF");
    setFormData({
      fullName: "", userName: "", email: "", number: "", birthday: "",
      roleId: staffRole ? staffRole._id : "", // Set mặc định
      status: "active", password: ""
    });
    setErrors({});
    setModalType("CREATE_STAFF");
  };

  const openUpdateModal = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      number: user.number || "",
      birthday: user.birthday ? user.birthday.split('T')[0] : "",
      roleId: user.roleId?._id || "",
      status: user.status
    });
    setErrors({});
    setModalType("UPDATE");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setErrors({});
  };

  // --- XỬ LÝ SUBMIT CREATE/UPDATE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (modalType === "UPDATE") {
        const res = await fetch(`http://localhost:9999/api/users/${selectedUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success("Cập nhật thông tin thành công!");
          fetchUsers();
          handleCloseModal();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Cập nhật thất bại");
        }
      } else if (modalType === "CREATE_STAFF") {
        const res = await fetch(`http://localhost:9999/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast.success("Tạo tài khoản nhân viên thành công!");
          fetchUsers();
          handleCloseModal();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Tạo tài khoản thất bại");
        }
      }
    } catch (error) {
      toast.error("Lỗi khi lưu: " + error.message);
    }
  };

  // --- XÓA USER (SWEETALERT2) ---
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn không?",
      text: "Dữ liệu này sẽ không thể khôi phục sau khi xóa!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Có, xóa ngay!",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:9999/api/users/${id}`, { method: "DELETE" });
          if (res.ok) {
            setUsers(users.filter((u) => u._id !== id));
            toast.success("Xóa người dùng thành công!");
          } else {
            toast.error("Xóa người dùng thất bại.");
          }
        } catch (error) {
          toast.error("Lỗi khi xóa: " + error.message);
        }
      }
    });
  };

  // --- RESET PASSWORD VỚI SWEETALERT2 ---
  const handleResetPassword = async (id) => {
    const { value: newPassword } = await Swal.fire({
      title: "Đặt lại mật khẩu",
      input: "password",
      inputLabel: "Nhập mật khẩu mới cho nhân viên này",
      inputPlaceholder: "Tối thiểu 6 ký tự",
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value) return "Vui lòng nhập mật khẩu mới!";
        if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự!";
      }
    });

    if (newPassword) {
      try {
        const res = await fetch(`http://localhost:9999/api/users/${id}/reset-password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        });
        if (res.ok) {
          toast.success("Đặt lại mật khẩu thành công!");
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Đặt lại mật khẩu thất bại.");
        }
      } catch (error) {
        toast.error("Lỗi khi đặt lại mật khẩu: " + error.message);
      }
    }
  };

  const isStaffRole = (roleCode) => roleCode === "SALE_STAFF" || roleCode === "TECHNICIAN";

  // Hàm chuyển đổi trạng thái sang Tiếng Việt
  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'HOẠT ĐỘNG';
      case 'inactive': return 'VÔ HIỆU HÓA';
      case 'pending': return 'CHỜ DUYỆT';
      default: return status.toUpperCase();
    }
  };

  return (
    <AdminLayout>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h2>
          <button
            onClick={openCreateStaffModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Tạo tài khoản nhân viên
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo Tên hoặc Tên đăng nhập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Tất cả người dùng</option>
            <option value="STAFF">Nhân viên (Bán hàng & Kỹ thuật)</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Họ và tên</th>
                <th className="p-3 font-semibold text-gray-700">Tên đăng nhập</th>
                <th className="p-3 font-semibold text-gray-700">Vai trò</th>
                <th className="p-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{user.fullName}</td>
                  <td className="p-3 text-gray-600">{user.userName}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {user.roleId?.name || "Không rõ"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td className="p-3 flex justify-center gap-4">
                    <button onClick={() => { setSelectedUser(user); setModalType("DETAIL"); }} className="text-gray-500 hover:text-gray-800 transition" title="Xem chi tiết">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => openUpdateModal(user)} className="text-blue-500 hover:text-blue-700 transition" title="Sửa">
                      <Edit size={18} />
                    </button>
                    {isStaffRole(user.roleId?.id) && (
                      <button onClick={() => handleResetPassword(user._id)} className="text-yellow-500 hover:text-yellow-700 transition" title="Đặt lại mật khẩu">
                        <Key size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:text-red-700 transition" title="Xóa">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">Không tìm thấy người dùng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative shadow-xl max-h-[90vh] overflow-y-auto">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition">
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
              {modalType === "DETAIL" ? "Chi tiết người dùng" : modalType === "CREATE_STAFF" ? "Tạo tài khoản nhân viên" : "Cập nhật thông tin"}
            </h3>

            {/* Modal Content: DETAIL */}
            {modalType === "DETAIL" && selectedUser && (
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div><span className="text-gray-500 block mb-1">Họ và tên</span><span className="font-medium text-gray-800">{selectedUser.fullName}</span></div>
                <div><span className="text-gray-500 block mb-1">Tên đăng nhập</span><span className="font-medium text-gray-800">{selectedUser.userName}</span></div>
                <div><span className="text-gray-500 block mb-1">Email</span><span className="font-medium text-gray-800">{selectedUser.email}</span></div>
                <div><span className="text-gray-500 block mb-1">Số điện thoại</span><span className="font-medium text-gray-800">{selectedUser.number || "Trống"}</span></div>
                <div><span className="text-gray-500 block mb-1">Ngày sinh</span><span className="font-medium text-gray-800">{selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString('vi-VN') : "Trống"}</span></div>
                <div><span className="text-gray-500 block mb-1">Vai trò</span><span className="font-medium text-blue-600">{selectedUser.roleId?.name}</span></div>
                <div><span className="text-gray-500 block mb-1">Trạng thái</span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium inline-block mt-1 ${selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : selectedUser.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {getStatusText(selectedUser.status)}
                  </span>
                </div>
                <div><span className="text-gray-500 block mb-1">Loại xác thực</span><span className="font-medium text-gray-800">{selectedUser.authType}</span></div>
                <div className="col-span-2"><span className="text-gray-500 block mb-1">Địa chỉ</span><span className="font-medium text-gray-800">{selectedUser.address || "Trống"}</span></div>
              </div>
            )}

            {/* Modal Content: CREATE / UPDATE FORM */}
            {(modalType === "CREATE_STAFF" || modalType === "UPDATE") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${errors.fullName ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500 outline-none"}`} />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                    <input type="text" name="userName" value={formData.userName} onChange={handleInputChange} disabled={modalType === "UPDATE"} className={`w-full px-3 py-2 border rounded-md ${modalType === "UPDATE" ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""} ${errors.userName ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500 outline-none"}`} />
                    {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500 outline-none"}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {modalType === "CREATE_STAFF" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500 outline-none"}`} />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input type="text" name="number" value={formData.number} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${errors.number ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500 outline-none"}`} />
                    {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                    <input type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${errors.birthday ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500 outline-none"}`} />
                    {errors.birthday && <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                    <select name="roleId" value={formData.roleId} onChange={handleInputChange} disabled={modalType === "UPDATE" && !isStaffRole(selectedUser?.roleId?.id)} className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${errors.roleId ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500 outline-none"} ${(modalType === "UPDATE" && !isStaffRole(selectedUser?.roleId?.id)) ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                      <option value="">Chọn vai trò</option>
                      {roles
                        .filter(r => modalType === "CREATE_STAFF" ? (r.id === "SALE_STAFF" || r.id === "TECHNICIAN") : true)
                        .map(role => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                    </select>
                    {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Vô hiệu hóa</option>
                      <option value="pending">Chờ duyệt</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition">Hủy</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    {modalType === "CREATE_STAFF" ? "Tạo nhân viên" : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}