import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { Camera, Lock, Shield, User } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  
  // State for Profile Info
  const [formData, setFormData] = useState({ fullName: "", number: "", address: "", birthday: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // State for Password Change
  const [passData, setPassData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loadingPass, setLoadingPass] = useState(false);
  const [passErrors, setPassErrors] = useState({});

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
      }
    }
  }, []);

  const handleInfoChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePassChange = (e) => setPassData({ ...passData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file)); 
    }
  };

  // --- VALIDATION LOGIC ---
  const validateProfile = () => {
    let errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    
    // Regex for Vietnamese phone number (10 digits starting with 0)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!formData.number.trim()) {
      errors.number = "Phone number is required";
    } else if (!phoneRegex.test(formData.number)) {
      errors.number = "Invalid phone number format";
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    let errors = {};
    if (!passData.oldPassword) errors.oldPassword = "Current password is required";
    if (!passData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (passData.newPassword !== passData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setPassErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- SUBMIT HANDLERS ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    
    setLoadingProfile(true);
    try {
      const submitData = new FormData();
      submitData.append("userId", user._id);
      submitData.append("fullName", formData.fullName);
      submitData.append("number", formData.number);
      submitData.append("address", formData.address);
      submitData.append("birthday", formData.birthday);
      if (avatarFile) submitData.append("avatar", avatarFile);

      const res = await axiosClient.put("/users/profile", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success(res.data.message || "Profile updated successfully!");
      setProfileErrors({});
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoadingPass(true);
    try {
      // NOTE: Ensure your backend has this route implemented: PUT /users/change-password
      const res = await axiosClient.put("/users/change-password", {
        userId: user._id,
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword
      });

      toast.success(res.data.message || "Password changed successfully!");
      setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" }); // Clear form
      setPassErrors({});
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password. Please check your current password.");
    } finally {
      setLoadingPass(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* --- SECTION 1: PROFILE INFO --- */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
          <User className="text-primary" /> Personal Information
        </h2>
        
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden relative bg-gray-50 flex items-center justify-center shadow-md group">
              {preview ? (
                <img src={preview} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 font-medium">No image</span>
              )}
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="mb-1" />
                <span className="text-xs font-semibold">Change photo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInfoChange} 
                className={`w-full px-4 py-2 border rounded-lg outline-none ${profileErrors.fullName ? 'border-red-500' : 'focus:ring-primary focus:border-primary'}`} />
              {profileErrors.fullName && <p className="text-red-500 text-xs mt-1">{profileErrors.fullName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" name="number" value={formData.number} onChange={handleInfoChange} 
                className={`w-full px-4 py-2 border rounded-lg outline-none ${profileErrors.number ? 'border-red-500' : 'focus:ring-primary focus:border-primary'}`} />
              {profileErrors.number && <p className="text-red-500 text-xs mt-1">{profileErrors.number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="birthday" value={formData.birthday} onChange={handleInfoChange} className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email (Cannot be changed)</label>
              <input type="email" value={user.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleInfoChange} className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary outline-none" />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loadingProfile} className="bg-primary text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition shadow-md disabled:opacity-70">
              {loadingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* --- SECTION 2: CHANGE PASSWORD --- */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
          <Shield className="text-red-500" /> Security & Password
        </h2>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-6 md:w-2/3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="oldPassword" value={passData.oldPassword} onChange={handlePassChange} 
                className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none ${passErrors.oldPassword ? 'border-red-500' : 'focus:ring-primary focus:border-primary'}`} />
            </div>
            {passErrors.oldPassword && <p className="text-red-500 text-xs mt-1">{passErrors.oldPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="newPassword" value={passData.newPassword} onChange={handlePassChange} 
                className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none ${passErrors.newPassword ? 'border-red-500' : 'focus:ring-primary focus:border-primary'}`} />
            </div>
            {passErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passErrors.newPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="confirmPassword" value={passData.confirmPassword} onChange={handlePassChange} 
                className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none ${passErrors.confirmPassword ? 'border-red-500' : 'focus:ring-primary focus:border-primary'}`} />
            </div>
            {passErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passErrors.confirmPassword}</p>}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loadingPass} className="bg-gray-800 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-black transition shadow-md disabled:opacity-70">
              {loadingPass ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}