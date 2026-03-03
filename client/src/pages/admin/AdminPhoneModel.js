import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Smartphone, Search, ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";

const initialFormState = {
    name: '', 
    brand: '', 
    condition: 1, 
    imageFile: null, 
    previewImage: '',
    specifications: {
        screenSize: '', screenTechnology: '', rearCamera: '', frontCamera: '',
        chipset: '', nfc: '', internalStorage: '', sim: '', os: '',
        screenResolution: '', screenFeatures: '', cpu: ''
    }
};

export default function AdminPhoneModel() {
    const [phoneModels, setPhoneModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ 
        currentPage: 1, totalPages: 1, totalCount: 0, limit: 10, hasNextPage: false, hasPrevPage: false 
    });
    const [filters, setFilters] = useState({ search: '', sortBy: 'name', sortOrder: 'asc' });
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => { fetchPhoneModel(true); }, []);
    useEffect(() => { 
        if (!loading && pagination.currentPage) {
            fetchPhoneModel(false); 
        }
    }, [pagination.currentPage, filters.search, filters.sortBy, filters.sortOrder]);

    const fetchPhoneModel = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setLoading(true);
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination?.currentPage || 1,
                limit: pagination?.limit || 10,
                search: filters.search,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            });
            
            const { data } = await axios.get(`http://localhost:9999/api/phone_models?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setPhoneModels(data.data || []);
            setPagination(data.pagination);
        } catch (error) { 
            toast.error("Lỗi lấy dữ liệu"); 
        } finally { 
            if (isInitialLoad) setLoading(false); 
        }
    };

    const handleSearchChange = (e) => { 
        setFilters(prev => ({ ...prev, search: e.target.value })); 
        setPagination(prev => ({ ...prev, currentPage: 1 })); 
    };

    const handleSortChange = (field) => { 
        setFilters(prev => ({ 
            ...prev, 
            sortBy: field, 
            sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc' 
        })); 
    };

    const handlePageChange = (page) => { 
        setPagination(prev => ({ ...prev, currentPage: page })); 
    };

    const handleAddPhoneModel = () => {
        setIsEditing(false); 
        setFormData(initialFormState); 
        setEditingId(null); 
        setShowModal(true);
    };

    const handleEditPhoneModel = (model) => {
        setIsEditing(true); 
        setEditingId(model._id);
        setFormData({ 
            name: model.name, 
            brand: model.brand, 
            condition: model.condition || 1,
            imageFile: null, 
            previewImage: model.image || '',
            specifications: model.specifications || initialFormState.specifications
        });
        setShowModal(true);
    };

    const handleCloseModal = () => { setShowModal(false); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('spec_')) {
            setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, [name.replace('spec_', '')]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, imageFile: file, previewImage: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const submitData = new FormData();
            submitData.append("name", formData.name);
            submitData.append("brand", formData.brand);
            submitData.append("condition", formData.condition);
            submitData.append("specifications", JSON.stringify(formData.specifications));
            if (formData.imageFile) submitData.append("image", formData.imageFile);

            if (isEditing) {
                await axios.put(`http://localhost:9999/api/phone_models/update/${editingId}`, submitData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Cập nhật thành công!");
            } else {
                await axios.post("http://localhost:9999/api/phone_models/create", submitData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Thêm mới thành công!");
            }
            handleCloseModal();
            fetchPhoneModel(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lưu thất bại!");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64">Đang tải...</div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3"><Smartphone className="text-blue-600" size={28} /><h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục Điện Thoại</h1></div>
                <button onClick={handleAddPhoneModel} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <Plus size={20} /><span>Thêm Dòng máy</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Tìm kiếm tên dòng máy..." value={filters.search} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Total: {pagination.totalCount} items</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Ảnh đại diện</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase cursor-pointer" onClick={() => handleSortChange('name')}>
                                    <div className="flex items-center space-x-1">
                                        <span>Tên Dòng Máy</span>
                                        {filters.sortBy === 'name' && (<span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>)}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase cursor-pointer" onClick={() => handleSortChange('brand')}>
                                    <div className="flex items-center space-x-1">
                                        <span>Hãng</span>
                                        {filters.sortBy === 'brand' && (<span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>)}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Độ mới (Base)</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {phoneModels.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Không tìm thấy dữ liệu</td>
                                </tr>
                            ) : (
                                phoneModels.map(model => (
                                    <tr key={model._id} className="hover:bg-blue-50/50 transition">
                                        <td className="px-6 py-4">
                                            {model.image ? <img src={model.image} className="h-12 w-12 object-contain bg-white rounded border" alt="img"/> : <ImageIcon className="h-12 w-12 text-gray-300"/>}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800">{model.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{model.brand}</td>
                                        <td className="px-6 py-4 text-gray-600">{model.condition * 100}%</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEditPhoneModel(model)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition"><Edit size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* GIỮ NGUYÊN 100% CODE PHÂN TRANG CỦA BẠN */}
                {pagination.totalPages > 1 && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                                {pagination.totalCount} results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Previous</span>
                                </button>
                                
                                {/* Page Numbers */}
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = pagination.currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-2 text-sm border rounded-md ${
                                                    pagination.currentPage === pageNum
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL THÊM / SỬA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between p-5 border-b bg-gray-50">
                            <h2 className="text-xl font-bold">{isEditing ? 'Cập nhật Dòng máy' : 'Thêm Dòng máy mới'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="block text-sm font-semibold mb-1">Tên máy</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                    <div><label className="block text-sm font-semibold mb-1">Hãng</label><input type="text" name="brand" value={formData.brand} onChange={handleInputChange} required className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                    <div><label className="block text-sm font-semibold mb-1">Độ mới (0-1)</label><input type="number" name="condition" value={formData.condition} step="0.01" onChange={handleInputChange} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                </div>
                                <div className="border rounded-lg p-3 text-center bg-gray-50 flex flex-col items-center justify-center">
                                    {formData.previewImage ? <img src={formData.previewImage} alt="preview" className="h-20 w-auto mb-2 object-contain" /> : <ImageIcon className="h-10 w-10 text-gray-300 mb-2"/>}
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs w-full text-center ml-4" />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold border-b pb-2 mb-3">Thông số kỹ thuật</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border">
                                    {[
                                        { l: "Màn hình", n: "spec_screenSize" }, { l: "Tấm nền", n: "spec_screenTechnology" },
                                        { l: "Camera sau", n: "spec_rearCamera" }, { l: "Camera trước", n: "spec_frontCamera" },
                                        { l: "Chip", n: "spec_chipset" }, { l: "Bộ nhớ", n: "spec_internalStorage" },
                                        { l: "Pin/Sạc", n: "spec_cpu" }, { l: "Hệ điều hành", n: "spec_os" },
                                    ].map(f => (
                                        <div key={f.n}>
                                            <label className="text-xs text-gray-600">{f.l}</label>
                                            <input type="text" name={f.n} value={formData.specifications[f.n.replace('spec_', '')]} onChange={handleInputChange} className="w-full border p-1.5 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 rounded hover:bg-gray-200 font-medium">Hủy</button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">{isEditing ? 'Lưu Cập Nhật' : 'Tạo Mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}