import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Package, Search, X, Image as ImageIcon, UploadCloud, Link as LinkIcon } from "lucide-react";

const BASE_CODES = [
    { code: "MB", label: "Mainboard" },
    { code: "SCR", label: "Màn hình" },
    { code: "BAT", label: "Pin" },
    { code: "HSG", label: "Vỏ máy" },
    { code: "CAM-R", label: "Camera Sau" },
    { code: "CAM-F", label: "Camera Trước" },
    { code: "CPT", label: "Cụm chân sạc" },
    { code: "SPK", label: "Loa ngoài" },
    { code: "FGL", label: "Mặt kính" },
    { code: "BGL", label: "Kính lưng" },
    { code: "OTH", label: "Khác (Tự nhập hoàn toàn)" }
];

export default function AdminItemType() {
    const [itemTypes, setItemTypes] = useState([]);
    const [recipes, setRecipes] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 10, hasNextPage: false, hasPrevPage: false });
    const [filters, setFilters] = useState({ search: '', sortBy: 'name', sortOrder: 'asc' });
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({ name: '', baseCode: 'MB', subCode: '', image: '', linkedRecipes: [] });
    const [tempLink, setTempLink] = useState({ recipeId: '', partName: '' }); 
    
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `http://localhost:9999${url}`;
    };

    useEffect(() => { 
        fetchItemType(true); 
        fetchRecipes(); 
    }, []);

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

    const fetchRecipes = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:9999/api/recipes/all", { headers: { Authorization: `Bearer ${token}` } });
            setRecipes(res.data.data || []);
        } catch (err) {
            console.error("Lỗi tải công thức:", err);
        }
    };

    const handleSearchChange = (e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setPagination(prev => ({ ...prev, currentPage: 1 })); };
    const handleSortChange = (field) => { setFilters(prev => ({ ...prev, sortBy: field, sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc' })); };
    const handlePageChange = (page) => { setPagination(prev => ({ ...prev, currentPage: page })); };

    const handleOpenModal = (itemType = null) => {
        setImageFile(null); 
        setTempLink({ recipeId: '', partName: '' });
        
        if (itemType) {
            setIsEditing(true);
            setEditingId(itemType._id);
            
            let base = 'OTH';
            let sub = itemType.code;
            
            const parts = itemType.code.split('-');
            if (BASE_CODES.find(b => b.code === parts[0])) {
                base = parts[0];
                sub = parts.slice(1).join('-'); 
            } else if (BASE_CODES.find(b => b.code === itemType.code)) {
                base = itemType.code; 
                sub = '';
            }

            const existingLinks = [];
            recipes.forEach(recipe => {
                recipe.requiredParts.forEach(part => {
                    const isLinked = part.acceptedItemTypes.some(type => (type._id || type) === itemType._id);
                    if (isLinked) {
                        existingLinks.push({ recipeId: recipe._id, partName: part.name });
                    }
                });
            });

            setFormData({ name: itemType.name, baseCode: base, subCode: sub, image: itemType.image || '', linkedRecipes: existingLinks });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({ name: '', baseCode: 'MB', subCode: '', image: '', linkedRecipes: [] });
        }
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setFormData({ ...formData, image: URL.createObjectURL(file) });
        }
    };

    const handleRecipeChange = (e) => {
        const selectedRecipeId = e.target.value;
        let autoPartName = '';

        if (selectedRecipeId) {
            const selectedRecipe = recipes.find(r => r._id === selectedRecipeId);
            if (selectedRecipe) {
                const baseLabel = BASE_CODES.find(b => b.code === formData.baseCode)?.label?.toLowerCase() || '';
                const typeName = formData.name.toLowerCase();
                
                const matchedPart = selectedRecipe.requiredParts.find(p => {
                    const pName = p.name.toLowerCase();
                    return pName.includes(typeName) || (baseLabel && pName.includes(baseLabel));
                });
                
                if (matchedPart) {
                    autoPartName = matchedPart.name;
                }
            }
        }
        
        setTempLink({ recipeId: selectedRecipeId, partName: autoPartName });
    };

    // 🌟 SỬA LỖI 1: BÁO LỖI KHI BẤM THÊM BỊ TRÙNG
    const handleAddLink = () => {
        if (!tempLink.recipeId || !tempLink.partName) {
            return toast.warning("Vui lòng chọn Dòng Máy và Slot ghép!");
        }
        const isDuplicate = formData.linkedRecipes.some(l => l.recipeId === tempLink.recipeId && l.partName === tempLink.partName);
        if (isDuplicate) {
            return toast.error("Công thức này đã có trong danh sách ghép rồi!");
        }
        setFormData({ ...formData, linkedRecipes: [...formData.linkedRecipes, tempLink] });
        setTempLink({ recipeId: '', partName: '' }); 
    };

    const handleRemoveLink = (idx) => {
        const newLinks = [...formData.linkedRecipes];
        newLinks.splice(idx, 1);
        setFormData({ ...formData, linkedRecipes: newLinks });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const subUpper = formData.subCode.trim().toUpperCase();
        const finalCode = formData.baseCode === 'OTH' 
            ? subUpper 
            : (subUpper ? `${formData.baseCode}-${subUpper}` : formData.baseCode);

        if (!finalCode) return toast.warning("Mã Code không được để trống!");

        try {
            const token = localStorage.getItem("token");
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('code', finalCode); 
            
            let finalLinkedRecipes = [...formData.linkedRecipes];
            
            // 🌟 SỬA LỖI 1: BÁO LỖI NẾU QUÊN BẤM DẤU CỘNG MÀ AUTO THÊM BỊ TRÙNG
            if (tempLink.recipeId && tempLink.partName) {
                const isDuplicate = finalLinkedRecipes.some(l => l.recipeId === tempLink.recipeId && l.partName === tempLink.partName);
                if (!isDuplicate) {
                    finalLinkedRecipes.push(tempLink);
                } else {
                    return toast.error("Công thức đang chọn ở dropdown đã tồn tại trong danh sách!");
                }
            }

            if (finalLinkedRecipes.length > 0) {
                submitData.append('linkedRecipes', JSON.stringify(finalLinkedRecipes));
            }
            
            if (imageFile) {
                submitData.append('image', imageFile);
            } else if (formData.image && !formData.image.startsWith('blob:')) {
                submitData.append('image', formData.image); 
            }

            const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data'} };

            if (isEditing) {
                await axios.put(`http://localhost:9999/api/item_types/update/${editingId}`, submitData, config);
                toast.success("Cập nhật thành công");
            } else {
                await axios.post(`http://localhost:9999/api/item_types/create`, submitData, config);
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
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh Mục Linh Kiện</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">
                    <Plus size={20} /> <span>Thêm danh mục</span>
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
                                    Tên danh mục {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
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
                                        <td className="px-6 py-3 text-gray-600"><span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded font-mono text-xs font-bold">{item.code}</span></td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"><Edit size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4">
                    <span className="text-sm text-gray-600">
                        Hiển thị trang <span className="font-bold text-gray-800">{pagination.currentPage}</span> / <span className="font-bold text-gray-800">{pagination.totalPages || 1}</span> 
                        <span className="mx-2">|</span>
                        Tổng cộng: <span className="font-bold text-gray-800">{pagination.totalCount}</span> danh mục
                    </span>
                    <div className="flex gap-2">
                        <button disabled={!pagination.hasPrevPage} onClick={() => handlePageChange(pagination.currentPage - 1)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-40 hover:bg-blue-50 hover:text-blue-600 transition font-medium text-sm">Trang trước</button>
                        <button disabled={!pagination.hasNextPage} onClick={() => handlePageChange(pagination.currentPage + 1)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-40 hover:bg-blue-50 hover:text-blue-600 transition font-medium text-sm">Trang sau</button>
                    </div>
                </div>
            </div>

            {/* 🌟 SỬA LỖI 2: CẤU TRÚC LẠI MODAL FIX LỖI CUỘN */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
                        
                        {/* Header cố định */}
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                        </div>

                        {/* Nội dung cuộn được */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Tên danh mục hiển thị</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Pin iPhone 13, Màn hình OLED..." />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Mã Code (Viết tắt)</label>
                                <div className="flex gap-2">
                                    <select value={formData.baseCode} onChange={e => setFormData({...formData, baseCode: e.target.value})} className="w-1/2 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-700 font-medium">
                                        {BASE_CODES.map(b => <option key={b.code} value={b.code}>{b.label} ({b.code})</option>)}
                                    </select>
                                    <input type="text" value={formData.subCode} onChange={e => setFormData({...formData, subCode: e.target.value.toUpperCase()})} className="w-1/2 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono text-sm" placeholder={formData.baseCode === 'OTH' ? "Nhập mã..." : "Đuôi (VD: IP13)"} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Mã hệ thống: <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded ml-1 border border-blue-200">
                                    {formData.baseCode === 'OTH' ? formData.subCode.toUpperCase() : (formData.subCode ? `${formData.baseCode}-${formData.subCode.toUpperCase()}` : formData.baseCode)}
                                </strong></p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Ảnh đại diện chung</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                        {formData.image ? <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-contain p-1" /> : <ImageIcon size={24} className="text-gray-300" />}
                                        <div onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                            <UploadCloud size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                        <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-2 border border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition w-full flex items-center justify-center gap-2">
                                            <UploadCloud size={18} /> Tải ảnh lên
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t mt-4">
                                <label className="block text-sm font-semibold mb-2 text-indigo-700 flex items-center gap-2">
                                    <LinkIcon size={16}/> Ghép nhanh vào Công thức (Tùy chọn)
                                </label>
                                <div className="flex flex-col gap-2 mb-2">
                                    <div className="flex gap-2">
                                        <select value={tempLink.recipeId} onChange={handleRecipeChange} className="w-1/2 border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                                            <option value="">-- Chọn Dòng Máy --</option>
                                            {recipes.map(r => (
                                                <option key={r._id} value={r._id}>{r.phoneModelId?.name}</option>
                                            ))}
                                        </select>
                                        <select value={tempLink.partName} onChange={e => setTempLink({...tempLink, partName: e.target.value})} className="w-1/2 border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50" disabled={!tempLink.recipeId}>
                                            <option value="">-- Chọn Slot ghép --</option>
                                            {tempLink.recipeId && recipes.find(r => r._id === tempLink.recipeId)?.requiredParts.map(p => (
                                                <option key={p.name} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="button" onClick={handleAddLink} className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 border-dashed rounded-lg hover:bg-indigo-100 transition font-medium text-sm">
                                        + Thêm vào danh sách ghép
                                    </button>
                                </div>
                                
                                {formData.linkedRecipes.length > 0 && (
                                    <div className="bg-indigo-50/50 border border-indigo-100 p-2 rounded-lg space-y-1">
                                        {formData.linkedRecipes.map((link, idx) => {
                                            const rName = recipes.find(r => r._id === link.recipeId)?.phoneModelId?.name;
                                            return (
                                                <div key={idx} className="flex items-center justify-between text-xs text-gray-700 bg-white px-2 py-1.5 rounded border border-gray-100 shadow-sm">
                                                    <span>Ghép vào: <strong className="text-indigo-700">{rName}</strong> ➜ Slot: <strong>{link.partName}</strong></span>
                                                    <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-500 hover:text-red-700 p-1"><X size={14}/></button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer cố định */}
                        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition">Hủy</button>
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition">{isEditing ? 'Lưu cập nhật' : 'Thêm mới'}</button>
                        </div>
                    </form>
                </div>
            )}
            <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }`}} />
        </div>
    );
}