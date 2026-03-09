import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Package, Search, X, Image as ImageIcon, UploadCloud } from "lucide-react";

export default function AdminItemType() {
    const [itemTypes, setItemTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 10, hasNextPage: false, hasPrevPage: false });
    const [filters, setFilters] = useState({ search: '', sortBy: 'name', sortOrder: 'asc' });
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', image: '' });
    
    // STATE MỚI: Quản lý file ảnh được chọn
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    // Chuẩn hóa URL ảnh (để hiển thị đúng ảnh từ server localhost)
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `http://localhost:9999${url}`; // Đảm bảo gọi đúng server backend
    };

    useEffect(() => { fetchItemType(true); }, []);
    useEffect(() => { if (!loading) fetchItemType(false); }, [pagination.currentPage, filters.search, filters.sortBy, filters.sortOrder]);

    const fetchItemType = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setLoading(true);
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination.currentPage, limit: pagination.limit,
                search: filters.search, sortBy: filters.sortBy, sortOrder: filters.sortOrder
            });
            const { data } = await axios.get(`http://localhost:9999/api/item_types?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            setItemTypes(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 });
        } catch (error) {
            toast.error("Lỗi tải dữ liệu");
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    };

    const handleSearchChange = (e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setPagination(prev => ({ ...prev, currentPage: 1 })); };
    const handleSortChange = (field) => { setFilters(prev => ({ ...prev, sortBy: field, sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc' })); };
    const handlePageChange = (page) => { setPagination(prev => ({ ...prev, currentPage: page })); };

    const handleOpenModal = (itemType = null) => {
        setImageFile(null); // Reset file mỗi khi mở modal
        if (itemType) {
            setIsEditing(true);
            setEditingId(itemType._id);
            setFormData({ name: itemType.name, code: itemType.code, image: itemType.image || '' });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({ name: '', code: '', image: '' });
        }
        setShowModal(true);
    };

    // Hàm xử lý khi người dùng chọn ảnh từ máy
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Tạo URL tạm thời để hiển thị Preview ngay lập tức
            setFormData({ ...formData, image: URL.createObjectURL(file) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            
            // DÙNG FORMDATA THAY VÌ JSON ĐỂ GỬI KÈM FILE ẢNH
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('code', formData.code);
            
            if (imageFile) {
                submitData.append('image', imageFile); // File thực tế
            } else if (formData.image && !formData.image.startsWith('blob:')) {
                submitData.append('image', formData.image); // URL cũ
            }

            const config = { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' // Bắt buộc cho FormData
                } 
            };

            if (isEditing) {
                await axios.put(`http://localhost:9999/api/item_types/update/${editingId}`, submitData, config);
                toast.success("Cập nhật thành công");
            } else {
                await axios.post("http://localhost:9999/api/item_types/create", submitData, config);
                toast.success("Thêm mới thành công");
            }
            setShowModal(false);
            fetchItemType();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi lưu dữ liệu");
        }
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Package className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Loại Linh Kiện</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">
                    <Plus size={20} /> <span>Thêm loại linh kiện</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
                <div className="relative w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Tìm theo tên hoặc mã..." value={filters.search} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase">Hình ảnh</th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSortChange('name')}>
                                    Tên loại {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSortChange('code')}>
                                    Mã Code {filters.sortBy === 'code' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {itemTypes.length === 0 ? (
                                <tr><td colSpan="4" className="py-10 text-center text-gray-500">Không có dữ liệu</td></tr>
                            ) : (
                                itemTypes.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-3">
                                            {item.image ? (
                                                <img src={getImageUrl(item.image)} alt={item.name} className="w-12 h-12 object-contain bg-white border rounded-lg p-1 shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-lg border border-dashed"><ImageIcon size={20} className="text-gray-400"/></div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 font-semibold text-gray-800">{item.name}</td>
                                        <td className="px-6 py-3 text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{item.code}</span></td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"><Edit size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* PHÂN TRANG */}
                <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4">
                    <span className="text-sm text-gray-600">
                        Hiển thị trang <span className="font-bold text-gray-800">{pagination.currentPage}</span> / <span className="font-bold text-gray-800">{pagination.totalPages || 1}</span> 
                        <span className="mx-2">|</span>
                        Tổng cộng: <span className="font-bold text-gray-800">{pagination.totalCount}</span> loại linh kiện
                    </span>
                    <div className="flex gap-2">
                        <button disabled={!pagination.hasPrevPage} onClick={() => handlePageChange(pagination.currentPage - 1)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 hover:text-blue-600 transition font-medium text-sm">Trang trước</button>
                        <button disabled={!pagination.hasNextPage} onClick={() => handlePageChange(pagination.currentPage + 1)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 hover:text-blue-600 transition font-medium text-sm">Trang sau</button>
                    </div>
                </div>
            </div>

            {/* Modal Thêm/Sửa */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa Loại Linh Kiện' : 'Thêm Loại Linh Kiện'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Tên loại linh kiện</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Màn hình, Pin..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Mã Code (Viết tắt)</label>
                                <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: SCR, BAT..." />
                            </div>
                            
                            {/* KHU VỰC UPLOAD ẢNH MỚI */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Ảnh đại diện</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                        {formData.image ? (
                                            <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <ImageIcon size={24} className="text-gray-300" />
                                        )}
                                        
                                        {/* Nút Overlay khi hover vào ảnh */}
                                        <div onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                            <UploadCloud size={20} className="text-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden" 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current.click()} 
                                            className="px-4 py-2 border border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition w-full flex items-center justify-center gap-2"
                                        >
                                            <UploadCloud size={18} /> Chọn ảnh từ máy tính
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2 text-center">Hỗ trợ JPG, PNG, WEBP...</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">Hủy</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition">{isEditing ? 'Lưu cập nhật' : 'Thêm mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}