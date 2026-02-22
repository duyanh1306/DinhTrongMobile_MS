import { useState, useEffect } from "react";
import { Search, Edit, Trash2, Eye, Key, Plus, X } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

export default function ManageUser() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("STAFF"); // Mặc định filter Staff

  // Modals state
  const [modalType, setModalType] = useState(null); // 'DETAIL', 'CREATE_STAFF', 'UPDATE', null
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", userName: "", email: "", number: "", birthday: "", roleId: "", status: "active", password: ""
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      // Backend cần có .populate('roleId')
      const res = await fetch("http://localhost:9999/api/users"); 
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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
      console.error("Error fetching roles:", error);
    }
  };

  // Lọc danh sách User
  const filteredUsers = users.filter((user) => {
    const matchName = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      user.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchRole = true;
    const roleCode = user.roleId?.id; // Lấy từ ObjectId đã populate

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
  };

  // Mở modal tạo Staff
  const openCreateStaffModal = () => {
    setFormData({ fullName: "", userName: "", email: "", number: "", birthday: "", roleId: "", status: "active", password: "" });
    setModalType("CREATE_STAFF");
  };

  // Mở modal Update
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
    setModalType("UPDATE");
  };

  // Xử lý Submit (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "UPDATE") {
        const res = await fetch(`http://localhost:9999/api/users/${selectedUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) fetchUsers();
      } else if (modalType === "CREATE_STAFF") {
        const res = await fetch(`http://localhost:9999/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) fetchUsers();
      }
      setModalType(null);
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  // Xóa user
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await fetch(`http://localhost:9999/api/users/${id}`, { method: "DELETE" });
        if (res.ok) setUsers(users.filter((u) => u._id !== id));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  // Reset Password
  const handleResetPassword = async (id) => {
    const newPassword = window.prompt("Enter new password for this staff:");
    if (!newPassword) return;

    try {
      const res = await fetch(`http://localhost:9999/api/users/${id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) alert("Password reset successfully!");
      else alert("Failed to reset password.");
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  // Kiểm tra xem user có phải là staff không
  const isStaffRole = (roleCode) => roleCode === "SALE_STAFF" || roleCode === "TECHNICIAN";

  return (
    <AdminLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
          <button
            onClick={openCreateStaffModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Create Staff Account
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Name or Username..."
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
            <option value="ALL">All Users</option>
            <option value="STAFF">Staff (Sale & Tech)</option>
            <option value="CUSTOMER">Customers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Name</th>
                <th className="p-3 font-semibold text-gray-700">Username</th>
                <th className="p-3 font-semibold text-gray-700">Role</th>
                <th className="p-3 font-semibold text-gray-700">Status</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{user.fullName}</td>
                  <td className="p-3">{user.userName}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {user.roleId?.name || "Unknown"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 
                      user.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 flex justify-center gap-3">
                    <button onClick={() => { setSelectedUser(user); setModalType("DETAIL"); }} className="text-gray-500 hover:text-gray-700" title="View Details">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => openUpdateModal(user)} className="text-blue-500 hover:text-blue-700" title="Edit">
                      <Edit size={18} />
                    </button>
                    {isStaffRole(user.roleId?.id) && (
                      <button onClick={() => handleResetPassword(user._id)} className="text-yellow-600 hover:text-yellow-800" title="Reset Password">
                        <Key size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:text-red-700" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative shadow-xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {modalType === "DETAIL" ? "User Details" : modalType === "CREATE_STAFF" ? "Create Staff Account" : "Update User"}
            </h3>

            {/* Modal Content: DETAIL */}
            {modalType === "DETAIL" && selectedUser && (
              <div className="space-y-3 text-sm">
                <p><strong>Full Name:</strong> {selectedUser.fullName}</p>
                <p><strong>Username:</strong> {selectedUser.userName}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.number || "N/A"}</p>
                <p><strong>Birthday:</strong> {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString() : "N/A"}</p>
                <p><strong>Role:</strong> {selectedUser.roleId?.name}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
                <p><strong>Auth Type:</strong> {selectedUser.authType}</p>
                <p><strong>Address:</strong> {selectedUser.address || "N/A"}</p>
              </div>
            )}

            {/* Modal Content: CREATE / UPDATE FORM */}
            {(modalType === "CREATE_STAFF" || modalType === "UPDATE") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input type="text" name="userName" value={formData.userName} onChange={handleInputChange} required disabled={modalType === "UPDATE"} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  {modalType === "CREATE_STAFF" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="text" name="number" value={formData.number} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                    <input type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select name="roleId" value={formData.roleId} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md">
                      <option value="">Select Role</option>
                      {roles
                        .filter(r => modalType === "CREATE_STAFF" ? (r.id === "SALE_STAFF" || r.id === "TECHNICIAN") : true)
                        .map(role => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    {modalType === "CREATE_STAFF" ? "Create Staff" : "Update User"}
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