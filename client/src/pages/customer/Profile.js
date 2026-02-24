import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { Camera } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    number: "",
    address: "",
    birthday: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Load dữ liệu khi vào trang
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setFormData({
        fullName: storedUser.fullName || "",
        number: storedUser.number || "",
        address: storedUser.address || "",
        // Xử lý cắt chuỗi ngày tháng cho input type="date"
        birthday: storedUser.birthday ? new Date(storedUser.birthday).toISOString().split('T')[0] : "",
      });
      // Lấy link ảnh cũ (nếu có), nhớ nối thêm localhost:9999 (port server backend của bạn) 
      // để nó lấy đúng ảnh tĩnh, giả sử backend chạy port 9999
      if (storedUser.image) {
        setPreview(`http://localhost:9999${storedUser.image}`); 
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm chọn ảnh và hiển thị preview ngay lập tức
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file)); // Tạo link ảo để xem trước ảnh
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Khi gửi file ảnh bắt buộc phải dùng FormData thay vì JSON thường
      const submitData = new FormData();
      submitData.append("userId", user._id);
      submitData.append("fullName", formData.fullName);
      submitData.append("number", formData.number);
      submitData.append("address", formData.address);
      submitData.append("birthday", formData.birthday);
      
      // Nếu có chọn ảnh mới thì append vào
      if (avatarFile) {
        submitData.append("avatar", avatarFile);
      }

      const res = await axiosClient.put("/users/profile", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Cập nhật lại localStorage để thanh Navbar ăn theo dữ liệu mới
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success(res.data.message);
      
      // Refresh nhẹ giao diện
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Đang tải...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Thông tin cá nhân</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Khu vực đổi Avatar */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden relative bg-gray-50 flex items-center justify-center shadow-md group">
            {preview ? (
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 font-medium">Chưa có ảnh</span>
            )}
            
            {/* Lớp phủ mờ khi hover để đổi ảnh */}
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={24} className="mb-1" />
              <span className="text-xs font-semibold">Đổi ảnh</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        {/* Các Form Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input type="text" name="number" value={formData.number} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
            <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email (Không thể đổi)</label>
            <input type="email" value={user.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="bg-primary text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition shadow-md disabled:opacity-70">
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}