import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Camera, Lock, Shield, User, Eye, EyeOff } from "lucide-react";

// IMPORT TỪ FILE API MỚI TẠO
import { updateProfileApi, changePasswordApi } from "../../api/admin/profile";

export default function Profile() {
  const [user, setUser] = useState(null);
  
  // State cho Thông tin cá nhân
  const [formData, setFormData] = useState({ fullName: "", number: "", address: "", birthday: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  // State cho Đổi mật khẩu
  const [passData, setPassData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loadingPass, setLoadingPass] = useState(false);

  // State điều khiển con mắt ẩn/hiện mật khẩu
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ==============================================================
  // LOAD DỮ LIỆU BAN ĐẦU
  // ==============================================================
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setFormData({
        fullName: storedUser.fullName || "",
        number: storedUser.number || "",
        address: storedUser.address || "",
        birthday: storedUser.birthday ? new Date(storedUser.birthday).toISOString().split('T')[0] : "",
      });
      if (storedUser.image) {
        setPreview(`http://localhost:9999${storedUser.image}`); 
      } else {
        setPreview("/avatar-default.jpg");
      }
    }
  }, []);

  // ==============================================================
  // CÁC HÀM XỬ LÝ FORM
  // ==============================================================
  const handleInfoChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePassChange = (e) => setPassData({ ...passData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file)); 
    }
  };

  const validateProfile = () => {
    if (!formData.fullName.trim()) {
      toast.error("Họ và tên là bắt buộc.");
      return false;
    }
    
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!formData.number.trim()) {
      toast.error("Số điện thoại là bắt buộc.");
      return false;
    } else if (!phoneRegex.test(formData.number)) {
      toast.error("Định dạng số điện thoại không hợp lệ.");
      return false;
    }
    
    return true;
  };

  const validatePassword = () => {
    const passRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!passData.oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return false;
    }
    
    if (!passData.newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới.");
      return false;
    } else if (!passRegex.test(passData.newPassword)) {
      toast.error("Mật khẩu mới phải tối thiểu 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt.");
      return false;
    }
    
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return false;
    }
    
    return true;
  };

  // ==============================================================
  // SUBMIT GỌI API ĐÃ TÁCH
  // ==============================================================
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    
    setLoadingProfile(true);
    
    const submitData = new FormData();
    submitData.append("userId", user._id);
    submitData.append("fullName", formData.fullName);
    submitData.append("number", formData.number);
    submitData.append("address", formData.address);
    submitData.append("birthday", formData.birthday);
    if (avatarFile) submitData.append("avatar", avatarFile);

    await updateProfileApi(submitData);
    
    setLoadingProfile(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoadingPass(true);
    
    const payload = {
        userId: user._id,
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword
    };

    const isSuccess = await changePasswordApi(payload);
    
    if (isSuccess) {
        setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" }); // Xóa trắng form
    }
    
    setLoadingPass(false);
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* --- PHẦN 1: THÔNG TIN CÁ NHÂN --- */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
          <User className="text-primary" /> Thông tin cá nhân
        </h2>
        
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden relative bg-gray-50 flex items-center justify-center shadow-md group">
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="mb-1" />
                <span className="text-xs font-semibold">Đổi ảnh</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInfoChange} 
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-primary focus:border-primary" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="text" name="number" value={formData.number} onChange={handleInfoChange} 
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-primary focus:border-primary" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input type="date" name="birthday" value={formData.birthday} onChange={handleInfoChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email (Không thể thay đổi)</label>
              <input type="email" value={user.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input type="text" name="address" value={formData.address} onChange={handleInfoChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loadingProfile} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-70">
              {loadingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>

      {/* --- PHẦN 2: ĐỔI MẬT KHẨU --- */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
          <Shield className="text-red-500" /> Bảo mật & Mật khẩu
        </h2>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-6 md:w-2/3">
          {/* Mật khẩu cũ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showOldPass ? "text" : "password"} name="oldPassword" value={passData.oldPassword} onChange={handlePassChange} 
                className="w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-primary focus:border-primary" />
                <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showNewPass ? "text" : "password"} name="newPassword" value={passData.newPassword} onChange={handlePassChange} 
                className="w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-primary focus:border-primary" />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          {/* Nhập lại mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showConfirmPass ? "text" : "password"} name="confirmPassword" value={passData.confirmPassword} onChange={handlePassChange} 
                className="w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-primary focus:border-primary" />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loadingPass} className="bg-gray-800 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-black transition shadow-md disabled:opacity-70">
              {loadingPass ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}