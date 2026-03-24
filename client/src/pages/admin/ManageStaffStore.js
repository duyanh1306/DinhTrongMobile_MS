import { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  Key,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Store,
  Repeat,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";

export default function ManageStaffStore() {
  const navigate = useNavigate();
  const { storeId } = useParams();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [modalType, setModalType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    number: "",
    birthday: "",
    roleId: "",
    storeId: "",
    status: "active",
    password: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [targetStoreId, setTargetStoreId] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchStores();
    fetchStoreInfo();
  }, [storeId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  const isStaffRole = (roleCode) => ["SALE_STAFF", "TECHNICIAN", "MANAGER"].includes(roleCode);
  const isAdminRole = (roleCode) => roleCode === "ADMIN";

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách nhân viên: " + error.message);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải vai trò: " + error.message);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const res = await fetch(`http://localhost:9999/api/stores/${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setStoreName(data?.name || "");
      }
    } catch {
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/stores");
      if (res.ok) {
        const data = await res.json();
        const storesArray = Array.isArray(data) ? data : data.data || [];
        setStores(storesArray);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách cửa hàng: " + error.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const roleCode = user.roleId?.id;
    const belongsToCurrentStore = String(user.storeId || "") === String(storeId || "");
    const isStaff = isStaffRole(roleCode);
    if (!belongsToCurrentStore || !isStaff) return false;

    const matchName =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = selectedFilter === "ALL" ? true : roleCode === selectedFilter;

    return matchName && matchRole;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    let valid = true;

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên";
      valid = false;
    }
    if (!formData.userName.trim()) {
      nextErrors.userName = "Vui lòng nhập tên đăng nhập";
      valid = false;
    } else if (/\s/.test(formData.userName)) {
      nextErrors.userName = "Tên đăng nhập không được chứa khoảng trắng";
      valid = false;
    }
    if (!formData.email.trim()) {
      nextErrors.email = "Vui lòng nhập email";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Định dạng email không hợp lệ";
      valid = false;
    }
    if (formData.number && !/^[0-9]{10,11}$/.test(formData.number)) {
      nextErrors.number = "Số điện thoại phải có 10-11 chữ số";
      valid = false;
    }
    if (!formData.birthday) {
      nextErrors.birthday = "Vui lòng chọn ngày sinh";
      valid = false;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birthDate = new Date(formData.birthday);
      if (birthDate >= today) {
        nextErrors.birthday = "Ngày sinh phải trong quá khứ";
        valid = false;
      }
    }
    if (!formData.roleId) {
      nextErrors.roleId = "Vui lòng chọn vai trò";
      valid = false;
    }
    const selectedRole = roles.find((r) => r._id === formData.roleId);
    if (!selectedRole || !isStaffRole(selectedRole.id)) {
      nextErrors.roleId = "Chỉ được chọn vai trò nhân viên";
      valid = false;
    }
    if (modalType === "CREATE_STAFF") {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!formData.password) {
        nextErrors.password = "Vui lòng nhập mật khẩu";
        valid = false;
      } else if (!passwordRegex.test(formData.password)) {
        nextErrors.password = "Mật khẩu phải có ít nhất 8 ký tự, có ít nhất 1 chữ hoa và 1 ký tự đặc biệt";
        valid = false;
      }
    }

    setErrors(nextErrors);
    return valid;
  };

  const openCreateStaffModal = () => {
    const defaultRole = roles.find((r) => r.id === "SALE_STAFF");
    setFormData({
      fullName: "",
      userName: "",
      email: "",
      number: "",
      birthday: "",
      roleId: defaultRole ? defaultRole._id : "",
      storeId: storeId || "",
      status: "active",
      password: "",
      address: "",
    });
    setErrors({});
    setModalType("CREATE_STAFF");
  };

  const openUpdateModal = (user) => {
    if (isAdminRole(user.roleId?.id)) {
      toast.error("Không thể chỉnh sửa tài khoản Quản trị viên.");
      return;
    }
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName || "",
      userName: user.userName || "",
      email: user.email || "",
      number: user.number || "",
      birthday: user.birthday ? user.birthday.split("T")[0] : "",
      roleId: user.roleId?._id || "",
      storeId: storeId || "",
      status: user.status || "active",
      password: "",
      address: user.address || "",
    });
    setErrors({});
    setModalType("UPDATE");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setErrors({});
    setTargetStoreId("");
  };

  const openChangeStoreModal = (user) => {
    setSelectedUser(user);
    setTargetStoreId("");
    setModalType("CHANGE_STORE");
  };

  const handleChangeStore = async () => {
    if (!selectedUser?._id) return;
    if (!targetStoreId) {
      toast.warning("Vui lòng chọn cửa hàng mới.");
      return;
    }
    if (String(targetStoreId) === String(storeId)) {
      toast.warning("Nhân viên đang thuộc cửa hàng này.");
      return;
    }

    const targetStore = stores.find((s) => String(s._id) === String(targetStoreId));
    const confirm = await Swal.fire({
      title: "Xác nhận chuyển cửa hàng?",
      text: `Nhân viên "${selectedUser.fullName}" sẽ chuyển sang "${targetStore?.name || "cửa hàng mới"}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận chuyển",
      cancelButtonText: "Hủy",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 ml-2",
        cancelButton:
          "bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 mr-2",
      },
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:9999/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: targetStoreId }),
      });
      if (res.ok) {
        toast.success("Đổi cửa hàng thành công!");
        fetchUsers();
        handleCloseModal();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Đổi cửa hàng thất bại.");
      }
    } catch (error) {
      toast.error("Lỗi khi đổi cửa hàng: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = { ...formData, storeId };
    try {
      if (modalType === "UPDATE") {
        const res = await fetch(`http://localhost:9999/api/users/${selectedUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
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
        const res = await fetch("http://localhost:9999/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
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

  const handleBanUser = async (user) => {
    if (user.status === "inactive") {
      toast.info("Tài khoản này đã bị khóa trước đó.");
      return;
    }

    const result = await Swal.fire({
      title: "Khóa tài khoản?",
      text: `Bạn có chắc muốn khóa tài khoản của ${user.fullName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Khoa",
      cancelButtonText: "Huy",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:9999/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      if (res.ok) {
        toast.success("Đã khóa tài khoản thành công!");
        fetchUsers();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Khóa tài khoản thất bại.");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống: " + error.message);
    }
  };

  const handleResetPassword = async (id) => {
    const { value: newPassword } = await Swal.fire({
      title: "Đặt lại mật khẩu",
      input: "password",
      inputLabel: "Nhập mật khẩu mới",
      showCancelButton: true,
      confirmButtonText: "Luu",
      cancelButtonText: "Huy",
      inputValidator: (value) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!value) return "Vui lòng nhập mật khẩu mới!";
        if (!passwordRegex.test(value)) {
          return "Mật khẩu phải có ít nhất 8 ký tự, có ít nhất 1 chữ hoa và 1 ký tự đặc biệt!";
        }
      },
    });

    if (!newPassword) return;

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
  };

  const getStatusText = (status) => {
    if (status === "active") return "HOẠT ĐỘNG";
    if (status === "inactive") return "VÔ HIỆU HÓA";
    if (status === "pending") return "CHỜ DUYỆT";
    return status?.toUpperCase() || "";
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Nhân viên của cửa hàng</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Store size={14} /> {storeName || storeId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateStaffModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Plus size={18} /> Tạo tài khoản nhân viên
            </button>
            <button
              onClick={() => navigate("/admin/stores")}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc tên đăng nhập..."
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
            <option value="ALL">Tất cả nhân viên</option>
            <option value="SALE_STAFF">Nhân viên bán hàng</option>
            <option value="TECHNICIAN">Kỹ thuật viên</option>
            <option value="MANAGER">Quản lý</option>
          </select>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Họ và tên</th>
                <th className="p-3 font-semibold text-gray-700">Tên đăng nhập</th>
                <th className="p-3 font-semibold text-gray-700">Vai trò</th>
                <th className="p-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{user.fullName}</td>
                  <td className="p-3 text-gray-600">{user.userName}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {user.roleId?.name || "Không rõ"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : user.status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td className="p-3 flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setModalType("DETAIL");
                      }}
                      className="text-gray-500 hover:text-gray-800 transition"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => openUpdateModal(user)}
                      className="text-blue-500 hover:text-blue-700 transition"
                      title="Sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user._id)}
                      className="text-yellow-500 hover:text-yellow-700 transition"
                      title="Đặt lại mật khẩu"
                    >
                      <Key size={18} />
                    </button>
                    <button
                      onClick={() => openChangeStoreModal(user)}
                      className="text-indigo-500 hover:text-indigo-700 transition"
                      title="Đổi cửa hàng"
                    >
                      <Repeat size={18} />
                    </button>
                    <button
                      onClick={() => handleBanUser(user)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Khóa tài khoản"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    Không tìm thấy nhân viên nào trong cửa hàng này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Hien thi <span className="font-semibold text-gray-900">{indexOfFirstUser + 1}</span> den{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(indexOfLastUser, filteredUsers.length)}
              </span>{" "}
              trong tong so <span className="font-semibold text-gray-900">{filteredUsers.length}</span> nhan vien
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition ${
                    currentPage === index + 1
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
              {modalType === "DETAIL"
                ? "Chi tiết nhân viên"
                : modalType === "CREATE_STAFF"
                ? "Tạo tài khoản nhân viên"
                : modalType === "CHANGE_STORE"
                ? "Đổi cửa hàng nhân viên"
                : "Cập nhật thông tin"}
            </h3>

            {modalType === "DETAIL" && selectedUser && (
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Họ và tên</span>
                  <span className="font-medium text-gray-800">{selectedUser.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Tên đăng nhập</span>
                  <span className="font-medium text-gray-800">{selectedUser.userName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Email</span>
                  <span className="font-medium text-gray-800">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Số điện thoại</span>
                  <span className="font-medium text-gray-800">{selectedUser.number || "Trong"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Ngày sinh</span>
                  <span className="font-medium text-gray-800">
                    {selectedUser.birthday
                      ? new Date(selectedUser.birthday).toLocaleDateString("vi-VN")
                      : "Trống"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Vai trò</span>
                  <span className="font-medium text-blue-600">{selectedUser.roleId?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Trạng thái</span>
                  <span className="font-medium text-gray-800">{getStatusText(selectedUser.status)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Cửa hàng</span>
                  <span className="font-medium text-gray-800">{selectedUser.storeName || storeName || "-"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block mb-1">Địa chỉ</span>
                  <span className="font-medium text-gray-800">{selectedUser.address || "Trong"}</span>
                </div>
              </div>
            )}

            {(modalType === "CREATE_STAFF" || modalType === "UPDATE") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ho va ten *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${
                        errors.fullName
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-500 outline-none"
                      }`}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ten dang nhap *</label>
                    <input
                      type="text"
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      disabled={modalType === "UPDATE"}
                      className={`w-full px-3 py-2 border rounded-md ${
                        modalType === "UPDATE" ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""
                      } ${
                        errors.userName
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-500 outline-none"
                      }`}
                    />
                    {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${
                        errors.email
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-500 outline-none"
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {modalType === "CREATE_STAFF" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mat khau *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${
                          errors.password
                            ? "border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:ring-blue-500 outline-none"
                        }`}
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">So dien thoai</label>
                    <input
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${
                        errors.number
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-500 outline-none"
                      }`}
                    />
                    {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngay sinh *</label>
                    <input
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${
                        errors.birthday
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-500 outline-none"
                      }`}
                    />
                    {errors.birthday && <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai tro *</label>
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${
                        errors.roleId
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-500 outline-none"
                      }`}
                    >
                      <option value="">Chon vai tro</option>
                      {roles
                        .filter((r) => isStaffRole(r.id))
                        .map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.name}
                          </option>
                        ))}
                    </select>
                    {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trang thai</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={modalType === "CREATE_STAFF"}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${
                        modalType === "CREATE_STAFF" ? "bg-gray-100 cursor-not-allowed text-gray-500" : "border-gray-300"
                      }`}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Vô hiệu hóa</option>
                      <option value="pending">Chờ duyệt</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    {modalType === "CREATE_STAFF" ? "Tạo nhân viên" : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "CHANGE_STORE" && selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
                    <input
                      type="text"
                      value={`${selectedUser.fullName} (${selectedUser.userName})`}
                      disabled
                      className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng hiện tại</label>
                    <input
                      type="text"
                      value={selectedUser.storeName || storeName || "-"}
                      disabled
                      className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng mới *</label>
                  <select
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn cửa hàng --</option>
                    {stores
                      .filter((s) => String(s._id) !== String(storeId))
                      .map((store) => (
                        <option key={store._id} value={store._id}>
                          {store.name} ({store.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleChangeStore}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                  >
                    Xác nhận chuyển
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
