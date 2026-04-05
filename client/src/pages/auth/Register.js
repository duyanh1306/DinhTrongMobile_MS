import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios'; // Dùng axios mặc định để gọi API tỉnh thành

const Register = () => {
  const [formData, setFormData] = useState({ fullName: '', userName: '', email: '', number: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- STATE CHO ĐỊA CHỈ ---
  const [locations, setLocations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [addressData, setAddressData] = useState({
    province: '',
    district: '',
    ward: '',
    street: ''
  });

  useEffect(() => {
    axiosClient.get('/locations')
      .then(res => setLocations(res.data))
      .catch(err => console.error("Lỗi tải dữ liệu địa lý từ DB:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  
  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    const selectedProv = locations.find(p => p.code.toString() === provCode);
    
    setDistricts(selectedProv ? selectedProv.districts : []);
    setWards([]); 
    setAddressData({ 
      ...addressData, 
      province: selectedProv ? selectedProv.name : '', 
      district: '', 
      ward: '' 
    });
  };

  const handleDistrictChange = (e) => {
    const distCode = e.target.value;
    const selectedDist = districts.find(d => d.code.toString() === distCode);
    
    setWards(selectedDist ? selectedDist.wards : []);
    setAddressData({ 
      ...addressData, 
      district: selectedDist ? selectedDist.name : '', 
      ward: '' 
    });
  };

  const handleWardChange = (e) => {
    const wardCode = e.target.value;
    const selectedW = wards.find(w => w.code.toString() === wardCode);
    
    setAddressData({ 
      ...addressData, 
      ward: selectedW ? selectedW.name : '' 
    });
  };

  const handleStreetChange = (e) => {
    setAddressData({ ...addressData, street: e.target.value });
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(formData.password)) {
      return toast.error("Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ viết hoa và ký tự đặc biệt");
    }


    if (!addressData.province || !addressData.district || !addressData.ward) {
      return toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã");
    }

    setLoading(true);
    try {
      const fullAddress = `${addressData.street ? addressData.street + ', ' : ''}${addressData.ward}, ${addressData.district}, ${addressData.province}`;
      
  
      const finalFormData = { 
        ...formData, 
        address: fullAddress 
      };

      const res = await axiosClient.post('/users/register', finalFormData);
      toast.success(res.data.message);
      navigate(`/verify-otp?email=${formData.email}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">DinhTrongMobile</h1>
          <p className="text-gray-500">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Thông tin tài khoản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input type="text" name="fullName" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
              <input type="text" name="userName" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ Email</label>
              <input type="email" name="email" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input type="text" name="number" onChange={handleChange} required className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative mt-1">
              <input type={showPassword ? "text" : "password"} name="password" onChange={handleChange} required
                className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt.</p>
          </div>

          <h3 className="font-semibold text-gray-800 border-b pb-2 mt-6">Địa chỉ giao hàng</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tỉnh / Thành phố</label>
              <select onChange={handleProvinceChange} required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option value="">-- Chọn Tỉnh/Thành --</option>
                {locations.map(prov => (
                  <option key={prov.code} value={prov.code}>{prov.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quận / Huyện</label>
              <select onChange={handleDistrictChange} required disabled={districts.length === 0} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100">
                <option value="">-- Chọn Quận/Huyện --</option>
                {districts.map(dist => (
                  <option key={dist.code} value={dist.code}>{dist.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phường / Xã</label>
              <select onChange={handleWardChange} required disabled={wards.length === 0} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100">
                <option value="">-- Chọn Phường/Xã --</option>
                {wards.map(ward => (
                  <option key={ward.code} value={ward.code}>{ward.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ cụ thể (Số nhà, tên đường...)</label>
            <input type="text" onChange={handleStreetChange} placeholder="VD: Số 12, ngõ 34, đường ABC..." className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold text-lg disabled:opacity-70 mt-6 shadow-md">
            {loading ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;