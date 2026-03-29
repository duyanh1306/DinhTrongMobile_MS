import React, { useEffect, useState, useRef, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Edit, Trash2, Package, Search, X, Image as ImageIcon, UploadCloud, Link as LinkIcon, ChevronDown, ChevronRight, Tag } from "lucide-react";

// IMPORT TỪ FILE API MỚI TẠO
import { 
    fetchItemTypesPaginatedApi, 
    fetchAllRecipesApi, 
    deleteItemTypeApi, 
    createItemTypeApi, 
    updateItemTypeApi 
} from "../../api/admin/itemType";

const BASE_CODES = {
    "MB": "Mainboard", "SCR": "Màn hình", "BAT": "Pin", "HSG": "Vỏ máy",
    "CAM-R": "Camera Sau", "CAM-F": "Camera Trước", "CPT": "Cụm chân sạc",
    "SPK": "Loa ngoài", "FGL": "Mặt kính", "BGL": "Kính lưng", "OTH": "Khác"
};

export default function AdminItemType() {
    const [itemTypes, setItemTypes] = useState([]);
    const [recipes, setRecipes] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    
    // 🌟 STATE PHÂN TRANG
    const [pagination, setPagination] = useState({ 
        currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 
    });
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedGroup, setExpandedGroup] = useState({});

    const [formData, setFormData] = useState({ name: '', baseCode: 'MB', subCode: '', image: '', linkedRecipes: [] });
    const [tempLink, setTempLink] = useState({ recipeId: '', partName: '' }); 
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `http://localhost:9999${url}`;
    };

    // ==============================================================
    // GỌI API THÔNG QUA HÀM TÁCH
    // ==============================================================
    useEffect(() => { loadRecipes(); }, []);
    useEffect(() => { loadItemTypes(); }, [pagination.currentPage]);

    useEffect(() => {
        const timeout = setTimeout(() => { 
            setPagination(prev => ({...prev, currentPage: 1}));
            loadItemTypes(); 
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchKeyword]);

    const loadItemTypes = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: pagination.currentPage, 
            limit: pagination.limit,
            search: searchKeyword
        });

        const data = await fetchItemTypesPaginatedApi(params);
        if (data) {
            setItemTypes(data.data || []);
            if (data.pagination) setPagination(data.pagination);
        }
        setLoading(false);
    };

    const loadRecipes = async () => {
        const data = await fetchAllRecipesApi();
        setRecipes(data);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        const isSuccess = await deleteItemTypeApi(id);
        if (isSuccess) {
            toast.success("Xóa thành công!");
            loadItemTypes();
        }
    };

    const handleOpenModal = (itemType = null) => {
        setImageFile(null); setTempLink({ recipeId: '', partName: '' });
        if (itemType) {
            setIsEditing(true); setEditingId(itemType._id);
            let base = 'OTH'; let sub = itemType.code;
            const parts = itemType.code.split('-');
            if (parts[0] === 'CAM') { base = 'CAM-' + parts[1]; sub = parts.slice(2).join('-'); }
            else if (BASE_CODES[parts[0]]) { base = parts[0]; sub = parts.slice(1).join('-'); }
            else if (BASE_CODES[itemType.code]) { base = itemType.code; sub = ''; }

            const existingLinks = [];
            recipes.forEach(recipe => {
                recipe.requiredParts.forEach(part => {
                    const isLinked = part.acceptedItemTypes.some(type => (type._id || type) === itemType._id);
                    if (isLinked) existingLinks.push({ recipeId: recipe._id, partName: part.name });
                });
            });
            setFormData({ name: itemType.name, baseCode: base, subCode: sub, image: itemType.image || '', linkedRecipes: existingLinks });
        } else {
            setIsEditing(false); setEditingId(null);
            setFormData({ name: '', baseCode: 'MB', subCode: '', image: '', linkedRecipes: [] });
        }
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) { setImageFile(file); setFormData({ ...formData, image: URL.createObjectURL(file) }); }
    };

    const handleRecipeChange = (e) => {
        const selectedRecipeId = e.target.value;
        let autoPartName = '';
        if (selectedRecipeId) {
            const selectedRecipe = recipes.find(r => r._id === selectedRecipeId);
            if (selectedRecipe) {
                const baseLabel = BASE_CODES[formData.baseCode]?.toLowerCase() || '';
                const typeName = formData.name.toLowerCase();
                const matchedPart = selectedRecipe.requiredParts.find(p => {
                    const pName = p.name.toLowerCase();
                    return pName.includes(typeName) || (baseLabel && pName.includes(baseLabel));
                });
                if (matchedPart) autoPartName = matchedPart.name;
            }
        }
        setTempLink({ recipeId: selectedRecipeId, partName: autoPartName });
    };

    const handleAddLink = () => {
        if (!tempLink.recipeId || !tempLink.partName) return toast.warning("Vui lòng chọn Dòng Máy và Slot ghép!");
        const isDuplicate = formData.linkedRecipes.some(l => l.recipeId === tempLink.recipeId && l.partName === tempLink.partName);
        if (isDuplicate) return toast.error("Công thức này đã có trong danh sách!");
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
        const finalCode = formData.baseCode === 'OTH' ? subUpper : (subUpper ? `${formData.baseCode}-${subUpper}` : formData.baseCode);
        if (!finalCode) return toast.warning("Mã Code không được để trống!");

        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('code', finalCode); 
        
        let finalLinkedRecipes = [...formData.linkedRecipes];
        if (tempLink.recipeId && tempLink.partName) {
            const isDuplicate = finalLinkedRecipes.some(l => l.recipeId === tempLink.recipeId && l.partName === tempLink.partName);
            if (!isDuplicate) finalLinkedRecipes.push(tempLink);
        }
        if (finalLinkedRecipes.length > 0) submitData.append('linkedRecipes', JSON.stringify(finalLinkedRecipes));
        
        if (imageFile) submitData.append('image', imageFile);
        else if (formData.image && !formData.image.startsWith('blob:')) submitData.append('image', formData.image); 

        let isSuccess = false;
        if (isEditing) {
            isSuccess = await updateItemTypeApi(editingId, submitData);
            if (isSuccess) toast.success("Cập nhật thành công");
        } else {
            isSuccess = await createItemTypeApi(submitData);
            if (isSuccess) toast.success("Thêm mới thành công");
        }

        if (isSuccess) {
            setShowModal(false);
            loadItemTypes();
        }
    };

    // 🌟 GỘP NHÓM & SẮP XẾP "KHÁC" XUỐNG CUỐI
    const sortedGroupedData = useMemo(() => {
        const result = {};
        itemTypes.forEach(type => {
            let base = 'OTH';
            const parts = type.code.split('-');
            if (parts[0] === 'CAM') base = `CAM-${parts[1]}`;
            else if (BASE_CODES[parts[0]]) base = parts[0];
            else if (BASE_CODES[type.code]) base = type.code;

            const baseLabel = BASE_CODES[base] || "Khác";
            if (!result[baseLabel]) result[baseLabel] = [];
            result[baseLabel].push(type);
        });

        // Sắp xếp object thành array, đẩy "Khác" xuống cuối
        return Object.entries(result).sort(([groupA], [groupB]) => {
            if (groupA === "Khác") return 1;
            if (groupB === "Khác") return -1;
            return groupA.localeCompare(groupB);
        });
    }, [itemTypes]);

    const toggleGroup = (grp) => setExpandedGroup(prev => ({ ...prev, [grp]: !prev[grp] }));

    return (
        <div className="flex flex-col h-full space-y-6">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Package className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Phân loại Linh Kiện</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /> <span>Thêm phân loại mới</span>
                </button>
            </div>

            {/* BỘ LỌC TÌM KIẾM BÊN NGOÀI DANH SÁCH */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Tìm theo tên danh mục hoặc mã code..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                {loading ? (
                    <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : sortedGroupedData.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy phân loại nào phù hợp.</div>
                ) : (
                    sortedGroupedData.map(([groupName, typesList]) => (
                        <div key={groupName} className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center hover:bg-gray-100 transition" onClick={() => toggleGroup(groupName)}>
                                <h2 className="text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
                                    <Tag className="text-blue-600" size={20}/> {groupName} 
                                    <span className="bg-white border text-xs px-2 py-0.5 rounded-full ml-2 text-gray-500">{typesList.length} phân loại</span>
                                </h2>
                                {expandedGroup[groupName] ? <ChevronDown className="text-gray-500"/> : <ChevronRight className="text-gray-500"/>}
                            </div>

                            {expandedGroup[groupName] && (
                                <div className="bg-white divide-y divide-gray-100">
                                    {typesList.map(item => (
                                        <div key={item._id} className="p-3 pl-8 flex items-center justify-between hover:bg-blue-50/40 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                                                    {item.image ? <img src={getImageUrl(item.image)} className="max-w-full max-h-full object-contain p-1" alt="img" /> : <ImageIcon className="text-gray-300"/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{item.name}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-[12px]">
                                                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 rounded font-mono font-bold tracking-wider">{item.code}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-gray-500">
                                                            Tồn kho: <strong className={item.stockCount > 0 ? "text-emerald-600 bg-emerald-50 px-1.5 rounded" : "text-red-500 bg-red-50 px-1.5 rounded"}>{item.stockCount || 0}</strong>
                                                        </span> 
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenModal(item)} className="text-blue-600 bg-blue-50 p-2.5 rounded-lg hover:bg-blue-600 hover:text-white transition"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item._id)} className="text-red-500 bg-red-50 p-2.5 rounded-lg hover:bg-red-600 hover:text-white transition"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* 🌟 THANH CHUYỂN TRANG */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4 mt-auto rounded-xl shadow-sm border border-gray-200">
                <span className="text-sm text-gray-600">Trang <span className="font-bold">{pagination.currentPage}</span> / <span className="font-bold">{pagination.totalPages || 1}</span> | Tổng tìm thấy: <span className="font-bold">{pagination.totalCount}</span> phân loại</span>
                <div className="flex gap-2">
                    <button disabled={pagination.currentPage <= 1} onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage - 1}))} className="px-4 py-2 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm">Trước</button>
                    <button disabled={pagination.currentPage >= pagination.totalPages} onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage + 1}))} className="px-4 py-2 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm">Sau</button>
                </div>
            </div>

            {/* MODAL THÊM SỬA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Tên danh mục hiển thị *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl focus:border-blue-500 outline-none" placeholder="VD: Pin iPhone 13..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Mã Code (Tự động nhóm) *</label>
                                <div className="flex gap-2">
                                    <select value={formData.baseCode} onChange={e => setFormData({...formData, baseCode: e.target.value})} className="w-1/2 border border-gray-300 p-2.5 rounded-xl focus:border-blue-500 outline-none bg-white text-gray-700">
                                        {Object.entries(BASE_CODES).map(([code, label]) => <option key={code} value={code}>{label} ({code})</option>)}
                                    </select>
                                    <input type="text" value={formData.subCode} onChange={e => setFormData({...formData, subCode: e.target.value.toUpperCase()})} className="w-1/2 border border-gray-300 p-2.5 rounded-xl focus:border-blue-500 outline-none uppercase font-mono text-sm" placeholder={formData.baseCode === 'OTH' ? "Nhập mã..." : "Đuôi (VD: IP13)"} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Mã hệ thống thực tế: <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded ml-1 border border-blue-200">{formData.baseCode === 'OTH' ? formData.subCode.toUpperCase() : (formData.subCode ? `${formData.baseCode}-${formData.subCode.toUpperCase()}` : formData.baseCode)}</strong></p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Ảnh đại diện chung</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                        {formData.image ? <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-contain p-1" /> : <ImageIcon size={28} className="text-gray-300" />}
                                        <div onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"><UploadCloud size={24} className="text-white" /></div>
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                        <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-2 border border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition w-full flex items-center justify-center gap-2"><UploadCloud size={18} /> Tải ảnh lên</button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 border-t border-gray-100 mt-2">
                                <label className="block text-sm font-bold mb-3 text-indigo-700 flex items-center gap-2"><LinkIcon size={18}/> Cấu hình máy ráp tương thích (Tùy chọn)</label>
                                <div className="flex flex-col gap-2 mb-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-inner">
                                    <div className="flex gap-2">
                                        <select value={tempLink.recipeId} onChange={handleRecipeChange} className="w-1/2 border border-indigo-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white">
                                            <option value="">-- Chọn Dòng Máy --</option>
                                            {recipes.map(r => <option key={r._id} value={r._id}>{r.phoneModelId?.name}</option>)}
                                        </select>
                                        <select value={tempLink.partName} onChange={e => setTempLink({...tempLink, partName: e.target.value})} className="w-1/2 border border-indigo-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white" disabled={!tempLink.recipeId}>
                                            <option value="">-- Chọn Slot ghép --</option>
                                            {tempLink.recipeId && recipes.find(r => r._id === tempLink.recipeId)?.requiredParts.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <button type="button" onClick={handleAddLink} className="w-full py-2 bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg hover:bg-indigo-200 transition text-sm">+ Thêm vào danh sách</button>
                                </div>
                                {formData.linkedRecipes.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {formData.linkedRecipes.map((link, idx) => {
                                            const rName = recipes.find(r => r._id === link.recipeId)?.phoneModelId?.name;
                                            return (
                                                <div key={idx} className="flex items-center justify-between text-xs text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                                    <span>Cho: <strong className="text-indigo-700">{rName}</strong> ➜ Slot: <strong>{link.partName}</strong></span>
                                                    <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"><X size={14}/></button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition">Hủy bỏ</button>
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition">{isEditing ? 'Lưu cập nhật' : 'Thêm danh mục'}</button>
                        </div>
                    </form>
                </div>
            )}
            <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }`}} />
        </div>
    );
}