import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Camera, Lock, Shield, User, Eye, EyeOff, MapPin } from "lucide-react";
import axiosClient from "../../api/axiosClient"; 
import { updateProfileApi, changePasswordApi, getImageProfile  } from "../../api/common/profile";

export default function Profile() {
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({ fullName: "", number: "", birthday: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [locations, setLocations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  
  const [addressCodes, setAddressCodes] = useState({ province: "", district: "", ward: "" });
  
 
  const [addressData, setAddressData] = useState({ province: "", district: "", ward: "", street: "" });

  const [passData, setPassData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loadingPass, setLoadingPass] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    axiosClient.get('/locations')
      .then(res => setLocations(res.data))
      .catch(err => console.error("Lỗi tải dữ liệu địa lý:", err));
  }, []);

 
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setFormData({
        fullName: storedUser.fullName || "",
        number: storedUser.number || "",
        birthday: storedUser.birthday ? new Date(storedUser.birthday).toISOString().split('T')[0] : "",
      });
      
      setPreview(getImageProfile(storedUser.image));
    }
  }, []);

 
  useEffect(() => {
    if (user && user.address && locations.length > 0) {
      const parts = user.address.split(', ').map(s => s.trim());
      let pName = '', dName = '', wName = '', sName = '';

      if (parts.length >= 3) {
        pName = parts[parts.length - 1]; 
        dName = parts[parts.length - 2]; 
        wName = parts[parts.length - 3]; 
        sName = parts.slice(0, parts.length - 3).join(', '); 
      } else {
        sName = user.address;
      }

   
      const prov = locations.find(l => l.name === pName);
      let pCode = '', dCode = '', wCode = '';
      let currentDistricts = [];
      let currentWards = [];

      if (prov) {
        pCode = prov.code.toString();
        currentDistricts = prov.districts || [];
        const dist = currentDistricts.find(d => d.name === dName);
        if (dist) {
          dCode = dist.code.toString();
          currentWards = dist.wards || [];
          const ward = currentWards.find(w => w.name === wName);
          if (ward) {
            wCode = ward.code.toString();
          }
        }
      }

      setDistricts(currentDistricts);
      setWards(currentWards);
      setAddressCodes({ province: pCode, district: dCode, ward: wCode });
      setAddressData({ province: pName, district: dName, ward: wName, street: sName });
    }
  }, [user, locations]);


  const handleInfoChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePassChange = (e) => setPassData({ ...passData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file)); 
    }
  };

  
  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    const selectedProv = locations.find(p => p.code.toString() === provCode);
    
    setAddressCodes({ province: provCode, district: "", ward: "" });
    setDistricts(selectedProv ? selectedProv.districts : []);
    setWards([]);
    setAddressData({ 
      ...addressData, 
      province: selectedProv ? selectedProv.name : "", 
      district: "", 
      ward: "" 
    });
  };

  const handleDistrictChange = (e) => {
    const distCode = e.target.value;
    const selectedDist = districts.find(d => d.code.toString() === distCode);
    
    setAddressCodes(prev => ({ ...prev, district: distCode, ward: "" }));
    setWards(selectedDist ? selectedDist.wards : []);
    setAddressData({ 
      ...addressData, 
      district: selectedDist ? selectedDist.name : "", 
      ward: "" 
    });
  };

  const handleWardChange = (e) => {
    const wardCode = e.target.value;
    const selectedW = wards.find(w => w.code.toString() === wardCode);
    
    setAddressCodes(prev => ({ ...prev, ward: wardCode }));
    setAddressData({ 
      ...addressData, 
      ward: selectedW ? selectedW.name : "" 
    });
  };

  const validateProfile = () => {
    
    if (!formData.fullName.trim()) {
        toast.error("Họ và tên không được để trống.");
        return false;
    }

    
    if (!formData.number.trim()) {
        toast.error("Số điện thoại không được để trống.");
        return false;
    }
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(formData.number)) {
        toast.error("Số điện thoại không hợp lệ! Phải bắt đầu bằng 03, 05, 07, 08, 09 và gồm đúng 10 chữ số.");
        return false;
    }

    
    if (!formData.birthday) {
        toast.error("Vui lòng chọn ngày sinh.");
        return false;
    }
    const today = new Date();
    const birthDate = new Date(formData.birthday);
    
   
    today.setHours(0, 0, 0, 0); 
    birthDate.setHours(0, 0, 0, 0);

    if (birthDate >= today) {
        toast.error("Ngày sinh không hợp lệ (Không thể chọn ngày hôm nay hoặc trong tương lai).");
        return false;
    }

    
    if (!addressData.province || !addressData.district || !addressData.ward) {
        toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã.");
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
    }
    if (!passRegex.test(passData.newPassword)) {
        toast.error("Mật khẩu mới phải tối thiểu 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt.");
        return false;
    }
    if (passData.newPassword !== passData.confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp.");
        return false; 
    }
    
    return true; 
};


  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return; 
    setLoadingProfile(true);

    const fullAddress = `${addressData.street ? addressData.street + ', ' : ''}${addressData.ward}, ${addressData.district}, ${addressData.province}`;
    
    const submitData = new FormData();
    submitData.append("userId", user._id || user.id);
    submitData.append("fullName", formData.fullName);
    submitData.append("number", formData.number);
    submitData.append("address", fullAddress);
    submitData.append("birthday", formData.birthday);
    
    if (avatarFile) submitData.append("avatar", avatarFile);

    try {
        const result = await updateProfileApi(submitData);
        if (result && result.user) {
            const updatedUser = { 
                ...user, 
                fullName: formData.fullName, 
                number: formData.number, 
                address: fullAddress, 
                birthday: formData.birthday,
                image: result.user.image 
            };
            
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            window.dispatchEvent(new Event("userUpdated"));
        }
    } catch (error) {
        toast.error("Có lỗi xảy ra khi cập nhật. Vui lòng thử lại sau.");
    }
    setLoadingProfile(false);
  };
  

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoadingPass(true);
    
    const payload = { userId: user._id, oldPassword: passData.oldPassword, newPassword: passData.newPassword };
    const isSuccess = await changePasswordApi(payload);
    
    if (isSuccess) setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" }); 
    setLoadingPass(false);
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
   
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="text" name="number" value={formData.number} onChange={handleInfoChange} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input type="date" name="birthday" value={formData.birthday} onChange={handleInfoChange} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email (Không thể thay đổi)</label>
              <input type="email" value={user.email} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
            </div>

           
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-5 mt-2">
                <h3 className="md:col-span-3 font-semibold text-gray-800 mb-1 flex items-center gap-2"><MapPin size={18} className="text-blue-500"/> Địa chỉ thường trú</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh / Thành phố</label>
                    <select value={addressCodes.province} onChange={handleProvinceChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                        <option value="">-- Chọn Tỉnh/Thành --</option>
                        {locations.map(prov => (
                            <option key={prov.code} value={prov.code}>{prov.name}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quận / Huyện</label>
                    <select value={addressCodes.district} onChange={handleDistrictChange} required disabled={districts.length === 0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100">
                        <option value="">-- Chọn Quận/Huyện --</option>
                        {districts.map(dist => (
                            <option key={dist.code} value={dist.code}>{dist.name}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phường / Xã</label>
                    <select value={addressCodes.ward} onChange={handleWardChange} required disabled={wards.length === 0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100">
                        <option value="">-- Chọn Phường/Xã --</option>
                        {wards.map(ward => (
                            <option key={ward.code} value={ward.code}>{ward.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="md:col-span-3 mt-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể (Số nhà, tên đường...)</label>
                    <input type="text" value={addressData.street} onChange={(e) => setAddressData({...addressData, street: e.target.value})} placeholder="VD: Số 12, ngõ 34, đường ABC..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loadingProfile} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-70">
              {loadingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>


      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
          <Shield className="text-red-500" /> Bảo mật & Mật khẩu
        </h2>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-6 md:w-2/3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showOldPass ? "text" : "password"} name="oldPassword" value={passData.oldPassword} onChange={handlePassChange} 
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-red-500 focus:border-red-500" />
                <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showNewPass ? "text" : "password"} name="newPassword" value={passData.newPassword} onChange={handlePassChange} 
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-red-500 focus:border-red-500" />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showConfirmPass ? "text" : "password"} name="confirmPassword" value={passData.confirmPassword} onChange={handlePassChange} 
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-red-500 focus:border-red-500" />
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