import { useState, useEffect } from "react";
import { Edit, Trash2, Plus, X, User, MapPin } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; 

import { fetchStoresApi, createStoreApi, updateStoreApi, deleteStoreApi } from "../../api/admin/store";

export default function ManageStore() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "", location: "" });
  const [errors, setErrors] = useState({});

  const [locations, setLocations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [addressCodes, setAddressCodes] = useState({ province: "", district: "", ward: "" });
  const [addressData, setAddressData] = useState({ province: "", district: "", ward: "", street: "" });

  useEffect(() => {
    loadStores();
    loadLocations();
  }, []);

  const loadStores = async () => {
    const data = await fetchStoresApi();
    setStores(data);
  };

  const loadLocations = async () => {
    try {
      const { data } = await axiosClient.get('/locations');
      setLocations(data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu địa lý:", err);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn không?",
      text: "Dữ liệu cửa hàng này sẽ không thể khôi phục sau khi xóa!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Có, xóa ngay!",
      cancelButtonText: "Hủy",
      buttonsStyling: false,
      customClass: {
        confirmButton: "bg-red-600 text-white px-5 py-2.5 rounded-md font-bold hover:bg-red-700 mx-2 shadow-sm",
        cancelButton: "bg-gray-500 text-white px-5 py-2.5 rounded-md font-bold hover:bg-gray-600 mx-2 shadow-sm"
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const isSuccess = await deleteStoreApi(id);
        if (isSuccess) {
          setStores(stores.filter((store) => store._id !== id));
          toast.success("Xóa cửa hàng thành công!");
        }
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    const selectedProv = locations.find(p => p.code.toString() === provCode);
    
    setAddressCodes({ province: provCode, district: "", ward: "" });
    setDistricts(selectedProv ? selectedProv.districts : []);
    setWards([]);
    setAddressData({ ...addressData, province: selectedProv ? selectedProv.name : "", district: "", ward: "" });
  };

  const handleDistrictChange = (e) => {
    const distCode = e.target.value;
    const selectedDist = districts.find(d => d.code.toString() === distCode);
    
    setAddressCodes(prev => ({ ...prev, district: distCode, ward: "" }));
    setWards(selectedDist ? selectedDist.wards : []);
    setAddressData({ ...addressData, district: selectedDist ? selectedDist.name : "", ward: "" });
  };

  const handleWardChange = (e) => {
    const wardCode = e.target.value;
    const selectedW = wards.find(w => w.code.toString() === wardCode);
    
    setAddressCodes(prev => ({ ...prev, ward: wardCode }));
    setAddressData({ ...addressData, ward: selectedW ? selectedW.name : "" });
  };

  const resetAddress = () => {
    setAddressCodes({ province: "", district: "", ward: "" });
    setAddressData({ province: "", district: "", ward: "", street: "" });
    setDistricts([]);
    setWards([]);
  };


  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", location: "" });
    resetAddress();
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setEditingId(store._id);
    setFormData({ code: store.code, name: store.name, location: store.location });
    setErrors({});

    if (store.location && locations.length > 0) {
      const parts = store.location.split(', ').map(s => s.trim());
      let pName = '', dName = '', wName = '', sName = '';

      if (parts.length >= 3) {
        pName = parts[parts.length - 1];
        dName = parts[parts.length - 2];
        wName = parts[parts.length - 3];
        sName = parts.slice(0, parts.length - 3).join(', ');
      } else {
        sName = store.location;
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
    } else {
      resetAddress();
    }
    
    setIsModalOpen(true);
  };

  const handleOpenStoreStaff = (storeId) => {
    navigate(`/admin/stores/${storeId}/staff`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ code: "", name: "", location: "" });
    resetAddress();
    setErrors({});
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.code.trim()) {
      newErrors.code = "Vui lòng nhập Mã cửa hàng";
      isValid = false;
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = "Mã cửa hàng chỉ gồm chữ cái in hoa, số hoặc dấu gạch ngang (VD: STORE-1)";
      isValid = false;
    }

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập Tên cửa hàng";
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Tên cửa hàng phải có ít nhất 3 ký tự";
      isValid = false;
    }

   
    if (!addressData.province || !addressData.district || !addressData.ward) {
      newErrors.location = "Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fullAddress = [
      addressData.street,
      addressData.ward,
      addressData.district,
      addressData.province
    ].filter(Boolean).join(", ");

    const submitPayload = { ...formData, location: fullAddress };

    if (editingId) {
        const { success, data } = await updateStoreApi(editingId, submitPayload);
        if (success) {
            setStores(stores.map((store) => (store._id === editingId ? data : store)));
            toast.success("Cập nhật thông tin cửa hàng thành công!");
            handleCloseModal();
        }
    } else {
        const { success, data } = await createStoreApi(submitPayload);
        if (success) {
            setStores([...stores, data]);
            toast.success("Thêm cửa hàng mới thành công!");
            handleCloseModal();
        }
    }
  };

  return (
    <>
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
                <th className="p-3 font-semibold text-gray-700 w-1/2">Địa chỉ</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-blue-600">{store.code}</td>
                  <td className="p-3">{store.name}</td>
                  <td className="p-3">
                    <div className="flex items-start gap-1">
                        <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{store.location}</span>
                    </div>
                  </td>
                  <td className="p-3 flex justify-center gap-4">
                    <button
                      onClick={() => handleOpenStoreStaff(store._id)}
                      className="text-blue-500 hover:text-blue-700 transition"
                      title="Quản lý nhân viên cửa hàng"
                    >
                      <User size={18} />
                    </button>
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

     
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
         
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative shadow-xl">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">
              {editingId ? "Cập nhật cửa hàng" : "Thêm cửa hàng mới"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.code ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"
                      }`}
                      disabled={!!editingId} 
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
                      className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.name ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
              </div>

          
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={16} className="text-blue-500"/> Địa chỉ cụ thể</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                          <select value={addressCodes.province} onChange={handleProvinceChange} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                              <option value="">-- Chọn Tỉnh/Thành --</option>
                              {locations.map(prov => <option key={prov.code} value={prov.code}>{prov.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quận / Huyện <span className="text-red-500">*</span></label>
                          <select value={addressCodes.district} onChange={handleDistrictChange} disabled={districts.length === 0} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 text-sm">
                              <option value="">-- Chọn Quận/Huyện --</option>
                              {districts.map(dist => <option key={dist.code} value={dist.code}>{dist.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Phường / Xã <span className="text-red-500">*</span></label>
                          <select value={addressCodes.ward} onChange={handleWardChange} disabled={wards.length === 0} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 text-sm">
                              <option value="">-- Chọn Phường/Xã --</option>
                              {wards.map(ward => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
                          </select>
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Số nhà, tên đường, khu vực...</label>
                      <input 
                          type="text" 
                          value={addressData.street} 
                          onChange={(e) => setAddressData({...addressData, street: e.target.value})} 
                          placeholder="VD: Số 12, ngõ 34, đường ABC..." 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                      />
                  </div>
                  {errors.location && <p className="text-red-500 text-xs mt-2 font-medium">{errors.location}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-md"
                >
                  {editingId ? "Lưu thay đổi" : "Tạo cửa hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}