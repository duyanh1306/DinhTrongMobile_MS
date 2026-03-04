import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Search, ChevronLeft, ChevronRight, X, Package, CheckCircle, Clock, AlertCircle } from "lucide-react";

const initialFormState = {
    imei: '',
    phoneModelId: '',
    colorName: '',
    capacity: '', 
    storeId: '',
    status: 'in_stock',
    importPrice: '',
    sellingPrice: '',
    source: 'supplier',
    notes: '',
    images: []
};

export default function AdminPhone() {
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 10, hasNextPage: false, hasPrevPage: false });
    const [filters, setFilters] = useState({ search: '', status: '', storeId: '' });
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);

    const [phoneModels, setPhoneModels] = useState([]);
    const [stores, setStores] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [retainedImages, setRetainedImages] = useState([]);

    useEffect(() => {
        fetchDropdownData();
        fetchPhones(true);
    }, []);

    useEffect(() => {
        if (!loading && pagination.currentPage) {
            fetchPhones(false);
        }
    }, [pagination.currentPage, filters.search, filters.status, filters.storeId]);

    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const [modelsRes, storesRes] = await Promise.all([
                axios.get(`http://localhost:9999/api/phone_models/all`, { headers }),
                axios.get(`http://localhost:9999/api/stores`, { headers }) 
            ]);
            
            const modelsData = modelsRes.data.data || modelsRes.data || [];
            setPhoneModels(Array.isArray(modelsData) ? modelsData : []);
            
            const storeData = storesRes.data.data || storesRes.data || [];
            setStores(Array.isArray(storeData) ? storeData : []);
        } catch (error) {
            console.error("Failed to fetch dropdown data");
        }
    };

    const fetchPhones = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setLoading(true);
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination?.currentPage || 1,
                limit: pagination?.limit || 10,
                search: filters.search,
                status: filters.status,
                storeId: filters.storeId
            });
            
            const { data } = await axios.get(`http://localhost:9999/api/phones?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setPhones(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 });
        } catch (error) {
            toast.error("Lỗi lấy dữ liệu kho máy");
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    };

    // LOGIC LỌC DÒNG MÁY THEO NGUỒN GỐC
    const filteredPhoneModels = phoneModels.filter(pm => {
        if (formData.source === 'supplier') {
            return pm.condition === 1; 
        } else {
            return pm.condition < 1; 
        }
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleAddPhone = () => {
        setIsEditing(false); 
        setFormData(initialFormState); 
        setEditingId(null); 
        setPreviewImages([]); 
        setRetainedImages([]); 
        setShowModal(true);
    };

    const handleEditPhone = (phone) => {
        setIsEditing(true); 
        setEditingId(phone._id);

        let extractedModelId = '';
        if (phone.phoneModelId && typeof phone.phoneModelId === 'object') {
            extractedModelId = phone.phoneModelId._id || phone.phoneModelId.id || '';
        } else {
            extractedModelId = phone.phoneModelId || '';
        }

        setFormData({
            imei: phone.imei,
            phoneModelId: extractedModelId,
            colorName: phone.colorName,
            capacity: phone.capacity || '',
            storeId: phone.storeId?._id || phone.storeId?.id || phone.storeId,
            status: phone.status,
            importPrice: phone.importPrice,
            sellingPrice: phone.sellingPrice || '',
            source: phone.source,
            notes: phone.notes || '',
            images: []
        });
        
        setRetainedImages(phone.specificImages || []);
        setPreviewImages([]);
        setShowModal(true);
    };

    const handleCloseModal = () => { setShowModal(false); };

    // FIX CHÍNH: Xử lý reset dòng máy ở đây, chỉ khi người dùng TỰ TAY đổi nguồn gốc
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'source') {
            setFormData(prev => ({ ...prev, [name]: value, phoneModelId: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + previewImages.length + retainedImages.length > 5) {
            return toast.warning("Chỉ được lưu tối đa 5 ảnh cho mỗi máy!");
        }
        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(prev => [...prev, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData(prev => ({ ...prev, images: newImages }));
        const newPreviews = [...previewImages];
        newPreviews.splice(index, 1);
        setPreviewImages(newPreviews);
    };

    const removeRetainedImage = (index) => {
        const newRetained = [...retainedImages];
        newRetained.splice(index, 1);
        setRetainedImages(newRetained);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.phoneModelId || formData.phoneModelId === "undefined") {
            return toast.warning("Vui lòng chọn hợp lệ Dòng Máy!");
        }

        if (!formData.storeId || formData.storeId === "undefined") {
            return toast.warning("Vui lòng chọn Chi Nhánh!");
        }

        try {
            const token = localStorage.getItem("token");
            const submitData = new FormData();
            
            submitData.append("imei", formData.imei);
            submitData.append("phoneModelId", formData.phoneModelId);
            submitData.append("colorName", formData.colorName);
            submitData.append("capacity", formData.capacity);
            submitData.append("storeId", formData.storeId);
            submitData.append("status", formData.status);
            submitData.append("importPrice", formData.importPrice);
            submitData.append("sellingPrice", formData.sellingPrice);
            submitData.append("source", formData.source);
            if (formData.notes) submitData.append("notes", formData.notes);

            if (formData.images && formData.images.length > 0) {
                formData.images.forEach(file => submitData.append("images", file));
            }
            
            if (isEditing) {
                submitData.append("retainedImages", JSON.stringify(retainedImages));
                await axios.put(`http://localhost:9999/api/phones/update/${editingId}`, submitData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Cập nhật máy thành công!");
            } else {
                await axios.post("http://localhost:9999/api/phones/create", submitData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Đã nhập máy vào kho!");
            }
            
            handleCloseModal();
            fetchPhones(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lưu thất bại!");
        }
    };

    const renderStatus = (status) => {
        switch(status) {
            case 'in_stock': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle size={14}/> Sẵn hàng</span>;
            case 'sold': return <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-xs font-bold"><Package size={14}/> Đã bán</span>;
            case 'repairing': return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold"><Clock size={14}/> Đang sửa</span>;
            case 'defective': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold"><AlertCircle size={14}/> Hỏng</span>;
            default: return status;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Đang tải dữ liệu kho máy...</div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Package className="text-indigo-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Kho Máy Thực Tế</h1>
                </div>
                <button onClick={handleAddPhone} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    <Plus size={20} /><span>Nhập Máy Vào Kho</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" name="search" placeholder="Quét hoặc gõ đuôi IMEI..." value={filters.search} onChange={handleFilterChange} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="">Tất cả Trạng thái</option>
                        <option value="in_stock">Trong kho (Sẵn bán)</option>
                        <option value="sold">Đã bán</option>
                        <option value="repairing">Đang sửa chữa</option>
                        <option value="defective">Lỗi / Hỏng</option>
                    </select>
                    <select name="storeId" value={filters.storeId} onChange={handleFilterChange} className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="">Tất cả Chi nhánh</option>
                        {stores.map(st => <option key={st._id || st.id} value={st._id || st.id}>{st.name || st.address}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Mã IMEI</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Tên Dòng Máy</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Màu sắc</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase text-blue-600">Dung lượng</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Chi nhánh</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {phones.map(phone => (
                                <tr key={phone._id} className="hover:bg-indigo-50/30">
                                    <td className="px-6 py-4 font-bold text-gray-800">{phone.imei}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{phone.phoneModelId?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{phone.colorName}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">{phone.capacity || 'N/A'}</td>
                                    <td className="px-6 py-4">{renderStatus(phone.status)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{phone.storeId?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEditPhone(phone)} className="text-indigo-600 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100"><Edit size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {phones.length === 0 && (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-500">Không tìm thấy máy nào phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tổng: {pagination.totalCount} máy</span>
                        <div className="flex gap-2">
                            <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage} className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
                            <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between p-5 border-b bg-gray-50">
                            <h2 className="text-xl font-bold">{isEditing ? 'Cập nhật Thông tin Máy' : 'Nhập Máy Mới Vào Kho'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Mã IMEI <span className="text-red-500">*</span></label>
                                    <input type="text" name="imei" value={formData.imei} onChange={handleInputChange} required disabled={isEditing} className="w-full border p-2 rounded focus:ring-2 outline-none disabled:bg-gray-100 disabled:text-gray-500" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Nguồn gốc <span className="text-red-500">*</span></label>
                                    <select name="source" value={formData.source} onChange={handleInputChange} className="w-full border p-2 rounded bg-white focus:ring-2 outline-none">
                                        <option value="supplier">Nhập hãng (Mới 100%)</option>
                                        <option value="customer_trade_in">Khách Thu cũ đổi mới</option>
                                        <option value="assembled">Máy Dựng (Ráp linh kiện)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Dòng máy <span className="text-red-500">*</span></label>
                                    <select name="phoneModelId" value={formData.phoneModelId} onChange={handleInputChange} required className="w-full border p-2 rounded bg-white focus:ring-2 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                                        <option value="">-- Chọn Dòng Máy --</option>
                                        {filteredPhoneModels.length === 0 && <option disabled>Không có dòng máy phù hợp</option>}
                                        {filteredPhoneModels.map(pm => (
                                            <option key={pm._id || pm.id} value={pm._id || pm.id}>
                                                {pm.name} - {pm.condition === 1 ? 'Mới 100%' : `Cũ ${Math.round(pm.condition * 100)}%`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Màu sắc <span className="text-red-500">*</span></label>
                                    <input type="text" name="colorName" value={formData.colorName} onChange={handleInputChange} required placeholder="VD: Vàng, Xanh Titan" className="w-full border p-2 rounded focus:ring-2 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Dung lượng <span className="text-red-500">*</span></label>
                                    <select name="capacity" value={formData.capacity} onChange={handleInputChange} required className="w-full border p-2 rounded bg-white focus:ring-2 outline-none">
                                        <option value="">-- Chọn dung lượng --</option>
                                        <option value="64GB">64 GB</option>
                                        <option value="128GB">128 GB</option>
                                        <option value="256GB">256 GB</option>
                                        <option value="512GB">512 GB</option>
                                        <option value="1TB">1 TB</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Giá vốn (VND) <span className="text-red-500">*</span></label>
                                    <input type="number" name="importPrice" value={formData.importPrice} onChange={handleInputChange} required className="w-full border p-2 rounded focus:ring-2 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Giá Bán Ra (VND) <span className="text-red-500">*</span></label>
                                    <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} required placeholder="VD: 25000000" className="w-full border p-2 rounded focus:ring-2 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Vị trí Cửa hàng <span className="text-red-500">*</span></label>
                                    <select name="storeId" value={formData.storeId} onChange={handleInputChange} required className="w-full border p-2 rounded bg-white focus:ring-2 outline-none">
                                        <option value="">-- Chọn Chi nhánh --</option>
                                        {stores.map(st => <option key={st._id || st.id} value={st._id || st.id}>{st.name || st.address}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Trạng thái <span className="text-red-500">*</span></label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} required className="w-full border p-2 rounded bg-white focus:ring-2 outline-none">
                                        <option value="in_stock">Trong kho (Sẵn sàng bán)</option>
                                        <option value="sold">Đã bán</option>
                                        <option value="repairing">Đang đem đi sửa</option>
                                        <option value="defective">Lỗi / Hỏng</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold mb-1">Ghi chú tình trạng máy</label>
                                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" placeholder="VD: Khách làm rơi xước viền góc dưới bên trái..." className="w-full border p-2 rounded focus:ring-2 outline-none"></textarea>
                            </div>

                            <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                                <label className="block text-sm font-semibold text-indigo-900 mb-2">Ảnh chụp thực tế máy (Tối đa 5 ảnh)</label>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" />
                                
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {retainedImages.map((imgUrl, idx) => (
                                        <div key={`ret-${idx}`} className="relative w-20 h-20 border rounded-lg overflow-hidden bg-white shadow-sm">
                                            <img src={imgUrl} className="w-full h-full object-cover" alt="retained" />
                                            <button type="button" onClick={() => removeRetainedImage(idx)} className="absolute top-0 right-0 bg-red-500/80 hover:bg-red-600 text-white rounded-bl-lg p-1"><X size={14}/></button>
                                        </div>
                                    ))}
                                    {previewImages.map((url, idx) => (
                                        <div key={`new-${idx}`} className="relative w-20 h-20 border-2 border-dashed border-indigo-300 rounded-lg overflow-hidden bg-white shadow-sm">
                                            <img src={url} className="w-full h-full object-cover" alt="new" />
                                            <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-0 right-0 bg-red-500/80 hover:bg-red-600 text-white rounded-bl-lg p-1"><X size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 rounded hover:bg-gray-200">Hủy</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{isEditing ? 'Lưu Cập Nhật' : 'Lưu Vào Kho'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}