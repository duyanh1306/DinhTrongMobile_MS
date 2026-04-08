import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
//   Edit,
//   Key,
//   Trash2
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

// IMPORT TỪ FILE API MỚI
import {
    fetchUsersApi,
    fetchRolesApi,
    fetchStoresApi,
    updateUserApi,
    createUserApi,
    banUserApi,
    resetPasswordApi
} from "../../api/manager/staff";

export default function ManagerStaff() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("STAFF");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [modalType, setModalType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", userName: "", email: "", number: "", birthday: "",
    roleId: "", storeId: "", status: "active", password: "",
  });
  const [errors, setErrors] = useState({});

  // ==============================================================
  // INIT DATA
  // ==============================================================
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    
    loadData();
  }, []);

  const loadData = async () => {
      const [usersData, rolesData, storesData] = await Promise.all([
          fetchUsersApi(),
          fetchRolesApi(),
          fetchStoresApi()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setStores(storesData);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  const isStaffRole = (roleCode) => ["SALE_STAFF", "TECHNICIAN"].includes(roleCode);
  const isAdminRole = (roleCode) => roleCode === "ADMIN";

  // Filter users to only show staff from the current manager's store
  const filteredUsers = users.filter((user) => {
    if (!isStaffRole(user.roleId?.id)) return false;
    if (currentUser?.storeId && user.storeId !== currentUser.storeId) return false;

    const matchName = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.userName?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchRole = true;
    const roleCode = user.roleId?.id;

    if (selectedFilter === "SALE_STAFF") matchRole = roleCode === "SALE_STAFF";
    else if (selectedFilter === "TECHNICIAN") matchRole = roleCode === "TECHNICIAN";
    else if (selectedFilter === "STAFF") matchRole = isStaffRole(roleCode);

    return matchName && matchRole;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ==============================================================
  // FORM HANDLING
  // ==============================================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

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
      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!formData.password) {
        newErrors.password = "Vui lòng nhập mật khẩu";
        isValid = false;
      } else if (!passwordRegex.test(formData.password)) {
        newErrors.password = "Mật khẩu phải từ 8 ký tự, có ít nhất 1 chữ hoa và 1 ký tự đặc biệt";
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

    const selectedRoleObj = roles.find(r => r._id === formData.roleId);
    if (selectedRoleObj && isStaffRole(selectedRoleObj.id) && !formData.storeId) {
        newErrors.storeId = "Vui lòng chọn Cửa hàng làm việc";
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const openCreateStaffModal = () => {
    setFormData({
      fullName: "", userName: "", email: "", number: "", birthday: "",
      roleId: "", storeId: currentUser?.storeId || "", status: "active", password: "",
    });
    setErrors({});
    setModalType("CREATE_STAFF");
  };

  // NOTE: Giữ nguyên để đó lỡ muốn dùng
  // const openUpdateModal = (user) => {
  //   if (isAdminRole(user.roleId?.id)) {
  //     toast.error("Không thể chỉnh sửa tài khoản Quản trị viên.");
  //     return;
  //   }
  //   setSelectedUser(user);
  //   setFormData({
  //     fullName: user.fullName, userName: user.userName, email: user.email,
  //     number: user.number || "", birthday: user.birthday ? user.birthday.split("T")[0] : "",
  //     roleId: user.roleId?._id || "", storeId: user.storeId || "", status: user.status,
  //   });
  //   setErrors({});
  //   setModalType("UPDATE");
  // };

  const handleCloseModal = () => {
    setModalType(null);
    setErrors({});
  };

  // ==============================================================
  // ACTIONS SUBMIT / BAN / RESET PWD
  // ==============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedRoleObj = roles.find(r => r._id === formData.roleId);
    const submitData = { ...formData };
    
    if (isStaffRole(selectedRoleObj?.id)) {
      submitData.storeId = currentUser?.storeId; 
    } else {
      submitData.storeId = null; 
    }

    let success = false;
    if (modalType === "UPDATE") {
        success = await updateUserApi(selectedUser._id, submitData);
    } else if (modalType === "CREATE_STAFF") {
        success = await createUserApi(submitData);
    }

    if (success) {
        const usersData = await fetchUsersApi();
        setUsers(usersData);
        handleCloseModal();
    }
  };

  // NOTE: Giữ nguyên để đó lỡ muốn dùng
  // const handleBanUser = async (user) => {
  //   if (isAdminRole(user.roleId?.id)) {
  //     toast.error("Không thể khóa tài khoản Quản trị viên.");
  //     return;
  //   }
  //   if (user.status === "inactive") {
  //     toast.info("Tài khoản này đã bị khóa từ trước.");
  //     return;
  //   }

  //   Swal.fire({
  //     title: "Khóa tài khoản?",
  //     text: `Bạn có chắc muốn khóa tài khoản của ${user.fullName}?`,
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonText: "Vâng, khóa ngay!",
  //     cancelButtonText: "Bỏ qua",
  //     reverseButtons: true,
  //     focusCancel: true,
  //     customClass: {
  //       confirmButton: "bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 ml-2",
  //       cancelButton: "bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400 mr-2",
  //     },
  //     buttonsStyling: false,
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       const success = await banUserApi(user._id);
  //       if (success) {
  //           const usersData = await fetchUsersApi();
  //           setUsers(usersData);
  //       }
  //     }
  //   });
  // };

  // NOTE: Giữ nguyên để đó lỡ muốn dùng
  // const handleResetPassword = async (id) => {
  //   const { value: newPassword } = await Swal.fire({
  //     title: "Đặt lại mật khẩu",
  //     input: "password",
  //     inputLabel: "Nhập mật khẩu mới cho nhân viên này",
  //     inputPlaceholder: "8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt",
  //     showCancelButton: true,
  //     confirmButtonText: "Lưu",
  //     cancelButtonText: "Hủy",
  //     buttonsStyling: false,
  //     customClass: {
  //       popup: "rounded-xl p-6", title: "text-2xl font-bold text-gray-800 mb-2",
  //       htmlContainer: "text-sm text-gray-600",
  //       input: "!w-full !mx-0 mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none box-border text-gray-800",
  //       actions: "flex justify-end gap-3 mt-6 w-full",
  //       confirmButton: "px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 m-0",
  //       cancelButton: "px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 m-0",
  //     },
  //     inputValidator: (value) => {
  //       const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  //       if (!value) return "Vui lòng nhập mật khẩu mới!";
  //       if (!passwordRegex.test(value)) return "Mật khẩu phải từ 8 ký tự, có ít nhất 1 chữ hoa và 1 ký tự đặc biệt!";
  //     },
  //   });

  //   if (newPassword) {
  //       await resetPasswordApi(id, newPassword);
  //   }
  // };

  const getStatusText = (status) => {
    switch (status) {
      case "active": return "HOẠT ĐỘNG";
      case "inactive": return "VÔ HIỆU HÓA";
      case "pending": return "CHỜ DUYỆT";
      default: return status?.toUpperCase() || "";
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Quản lý nhân viên cửa hàng
          </h2>
          <button
            onClick={openCreateStaffModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Tạo tài khoản nhân viên
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
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
            <option value="STAFF">Tất cả nhân viên</option>
            <option value="SALE_STAFF">Nhân viên bán hàng</option>
            <option value="TECHNICIAN">Kỹ thuật viên</option>
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
                <tr
                  key={user._id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-3 font-medium text-gray-800">
                    {user.fullName}
                  </td>
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
                    {/* <button onClick={() => openUpdateModal(user)} className="text-blue-500 hover:text-blue-700 transition" title="Sửa"><Edit size={18} /></button>
                    <button onClick={() => handleResetPassword(user._id)} className="text-yellow-500 hover:text-yellow-700 transition" title="Đặt lại mật khẩu"><Key size={18} /></button>
                    <button onClick={() => handleBanUser(user)} className="text-red-500 hover:text-red-700 transition" title="Khóa tài khoản"><Trash2 size={18} /></button> */}
                  </td>
                </tr>
              ))}
              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    Không tìm thấy nhân viên nào trong cửa hàng của bạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {indexOfFirstUser + 1}
              </span>{" "}
              đến{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(indexOfLastUser, filteredUsers.length)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-gray-900">
                {filteredUsers.length}
              </span>{" "}
              nhân viên
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
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
                onClick={() => paginate(currentPage + 1)}
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
                  : "Cập nhật thông tin"}
            </h3>

            {/* MODAL CHI TIẾT */}
            {modalType === "DETAIL" && selectedUser && (
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Họ và tên</span>
                  <span className="font-medium text-gray-800">
                    {selectedUser.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">
                    Tên đăng nhập
                  </span>
                  <span className="font-medium text-gray-800">
                    {selectedUser.userName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Email</span>
                  <span className="font-medium text-gray-800">
                    {selectedUser.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">
                    Số điện thoại
                  </span>
                  <span className="font-medium text-gray-800">
                    {selectedUser.number || "Trống"}
                  </span>
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
                  <span className="font-medium text-blue-600">
                    {selectedUser.roleId?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Trạng thái</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium inline-block mt-1 ${
                      selectedUser.status === "active"
                        ? "bg-green-100 text-green-800"
                        : selectedUser.status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {getStatusText(selectedUser.status)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Cửa hàng</span>
                  <span className="font-medium text-gray-800">
                    {selectedUser.storeName || "Chưa phân bổ"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block mb-1">Địa chỉ</span>
                  <span className="font-medium text-gray-800">
                    {selectedUser.address || "Trống"}
                  </span>
                </div>
              </div>
            )}

            {/* MODAL TẠO / SỬA */}
            {(modalType === "CREATE_STAFF" || modalType === "UPDATE") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò <span className="text-red-500">*</span>
                    </label>
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
                      <option value="">Chọn vai trò</option>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cửa hàng <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="storeId"
                      value={formData.storeId}
                      onChange={handleInputChange}
                      disabled={true} // Always disabled - uses current manager's store
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 bg-gray-100 cursor-not-allowed text-gray-500 ${
                        errors.storeId ? "border-red-500 focus:ring-red-200" : "border-gray-300"
                      }`}
                    >
                      <option value="">
                        {stores.find(s => s._id === currentUser?.storeId)?.name || "Cửa hàng của bạn"}
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Nhân viên sẽ được thêm vào cửa hàng của bạn</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
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
          </div>
        </div>
      )}
    </>
  );
}