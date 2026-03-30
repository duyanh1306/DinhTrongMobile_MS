import React, { useEffect, useState, useRef, useMemo } from "react";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Package, Search, X, Image as ImageIcon, UploadCloud, Link as LinkIcon, ChevronDown, Tag } from "lucide-react";

// 🌟 IMPORT API TỪ FILE itemType.js CỦA BẠN
import { fetchItemTypesPaginatedApi, fetchAllRecipesApi, deleteItemTypeApi, createItemTypeApi, updateItemTypeApi } from "../../api/admin/itemType";

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
    const [selectedBaseFilter, setSelectedBaseFilter] = useState(''); 

    // STATE PHÂN TRANG THEO NHÓM
    const [currentPage, setCurrentPage] = useState(1);
    const groupsPerPage = 3; 

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

    useEffect(() => { fetchRecipes(); fetchItemType(); }, []);

    // Reset về trang 1 khi gõ tìm kiếm hoặc đổi bộ lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword, selectedBaseFilter]);

    // 🌟 SỬ DỤNG API TỪ FILE RIÊNG LẤY DANH SÁCH PHÂN LOẠI
    const fetchItemType = async () => {
        setLoading(true);
        // Kéo tất cả về để Frontend tự chia trang theo Group (giống logic cũ)
        const data = await fetchItemTypesPaginatedApi('limit=9999');
        if (data) {
            setItemTypes(data.data || data || []);
        }
        setLoading(false);
    };

    // 🌟 SỬ DỤNG API TỪ FILE RIÊNG LẤY DANH SÁCH RECIPES
    const fetchRecipes = async () => {
        const data = await fetchAllRecipesApi();
        setRecipes(data);
    };

    // 🌟 SỬ DỤNG API XÓA TỪ FILE RIÊNG
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        const isSuccess = await deleteItemTypeApi(id);
        if (isSuccess) {
            toast.success("Xóa thành công!");
            fetchItemType();
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

    // 🌟 SỬ DỤNG API THÊM / SỬA TỪ FILE RIÊNG
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
            fetchItemType();
        }
    };

    const allGroupedData = useMemo(() => {
        const result = {};
        const safeKeyword = searchKeyword.toLowerCase();

        const filtered = itemTypes.filter(type => {
            const nameMatch = (type.name || '').toLowerCase().includes(safeKeyword);
            const codeMatch = (type.code || '').toLowerCase().includes(safeKeyword);
            const searchPass = nameMatch || codeMatch;

            let base = 'OTH';
            const parts = type.code.split('-');
            if (parts[0] === 'CAM') base = `CAM-${parts[1]}`;
            else if (BASE_CODES[parts[0]]) base = parts[0];
            else if (BASE_CODES[type.code]) base = type.code;

            const baseLabel = BASE_CODES[base] || "Khác";
            const basePass = selectedBaseFilter ? baseLabel === selectedBaseFilter : true;

            type._baseLabel = baseLabel;

            return searchPass && basePass;
        });

        filtered.forEach(type => {
            if (!result[type._baseLabel]) result[type._baseLabel] = [];
            result[type._baseLabel].push(type);
        });

        return Object.entries(result).sort(([groupA], [groupB]) => {
            if (groupA === "Khác") return 1;
            if (groupB === "Khác") return -1;
            return groupA.localeCompare(groupB);
        });
    }, [itemTypes, searchKeyword, selectedBaseFilter]);

    const paginatedData = useMemo(() => {
        const totalGroups = allGroupedData.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        
        const startIndex = (currentPage - 1) * groupsPerPage;
        const endIndex = startIndex + groupsPerPage;
        const currentGroups = allGroupedData.slice(startIndex, endIndex);

        let totalItemsCount = 0;
        allGroupedData.forEach(([_, list]) => { totalItemsCount += list.length });

        return {
            groups: currentGroups,
            totalPages: totalPages || 1,
            totalItemsCount: totalItemsCount
        };
    }, [allGroupedData, currentPage]);


    return (
        <div className="flex flex-col h-full space-y-6 text-[13px]">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Package className="text-blue-600" size={26} />
                    <h1 className="text-xl font-bold text-gray-800">Quản lý Phân loại Linh Kiện</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition text-sm">
                    <Plus size={18} /> <span>Thêm phân loại mới</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center border border-gray-100">
                <div className="relative min-w-[200px]">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <select 
                        value={selectedBaseFilter} 
                        onChange={(e) => setSelectedBaseFilter(e.target.value)} 
                        className="w-full appearance-none border border-gray-200 bg-gray-50 font-semibold py-2 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="">Tất cả Danh mục chính</option>
                        {Object.entries(BASE_CODES).map(([code, label]) => (
                            <option key={code} value={label}>{label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" placeholder="Tìm theo tên danh mục hoặc mã code..." 
                        value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-blue-500" 
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                {loading ? (
                    <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : paginatedData.groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300 text-sm">Không tìm thấy phân loại nào phù hợp.</div>
                ) : (
                    paginatedData.groups.map(([groupName, typesList]) => (
                        <div key={groupName} className="mb-5 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-blue-50/60 p-2.5 px-4 flex justify-between items-center border-b border-gray-200">
                                <h3 className="font-bold text-blue-900 flex items-center gap-2 text-sm uppercase">
                                    <Tag size={16} className="text-blue-600"/> {groupName} 
                                    <span className="bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded-full ml-2 shadow-sm">{typesList.length} Phân loại</span>
                                </h3>
                            </div>

                            <div className="bg-white overflow-x-auto">
                            <table className="w-full table-fixed text-left whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-[11px]">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold w-[55%]">Hình ảnh & Tên Phân Loại</th>
                                            <th className="px-4 py-3 font-semibold text-center w-[25%]">Tồn kho Hệ thống</th>
                                            <th className="px-6 py-3 font-semibold text-right w-[20%]">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {typesList.map(item => (
                                            <tr key={item._id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-6 py-3 truncate">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                                            {item.image ? <img src={getImageUrl(item.image)} className="max-w-full max-h-full object-contain p-1" alt="img" /> : <ImageIcon className="text-gray-300" size={18}/>}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</p>
                                                            <div className="mt-1">
                                                                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 rounded font-mono font-bold tracking-wider text-[10px] inline-block">{item.code}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[12px] min-w-[80px] ${item.stockCount > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                                                        <Package size={14}/> {item.stockCount || 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleOpenModal(item)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition shadow-sm border border-blue-100"><Edit size={14} /></button>
                                                        <button onClick={() => handleDelete(item._id)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-600 hover:text-white transition shadow-sm border border-red-100"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!loading && paginatedData.totalItemsCount > 0 && (
                <div className="p-3 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl shadow-sm border border-gray-200">
                    <div className="text-[13px] text-gray-600 flex items-center gap-2">
                        <span>Đang xem trang <strong className="text-blue-600">{currentPage}</strong> / {paginatedData.totalPages}</span>
                        <span className="text-gray-300">|</span>
                        <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedData.totalItemsCount}</strong> phân loại</span>
                    </div>
                    <div className="flex gap-2">
                        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-4 py-1.5 border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition rounded-lg shadow-sm">Trang trước</button>
                        <button disabled={currentPage >= paginatedData.totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-4 py-1.5 border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition rounded-lg shadow-sm">Trang sau</button>
                    </div>
                </div>
            )}

            {/* MODAL THÊM SỬA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50 flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={20}/></button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                            <div>
                                <label className="block text-[13px] font-bold mb-1.5 text-gray-700">Tên danh mục hiển thị *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg focus:border-blue-500 outline-none text-[13px]" placeholder="VD: Pin iPhone 13..." />
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold mb-1.5 text-gray-700">Mã Code (Tự động nhóm) *</label>
                                <div className="flex gap-2">
                                    <select value={formData.baseCode} onChange={e => setFormData({...formData, baseCode: e.target.value})} className="w-1/2 border border-gray-300 p-2 rounded-lg focus:border-blue-500 outline-none bg-white text-gray-700 text-[13px]">
                                        {Object.entries(BASE_CODES).map(([code, label]) => <option key={code} value={code}>{label} ({code})</option>)}
                                    </select>
                                    <input type="text" value={formData.subCode} onChange={e => setFormData({...formData, subCode: e.target.value.toUpperCase()})} className="w-1/2 border border-gray-300 p-2 rounded-lg focus:border-blue-500 outline-none uppercase font-mono text-[13px]" placeholder={formData.baseCode === 'OTH' ? "Nhập mã..." : "Đuôi (VD: IP13)"} />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1.5">Mã hệ thống: <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded ml-1 border border-blue-200">{formData.baseCode === 'OTH' ? formData.subCode.toUpperCase() : (formData.subCode ? `${formData.baseCode}-${formData.subCode.toUpperCase()}` : formData.baseCode)}</strong></p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold mb-1.5 text-gray-700">Ảnh đại diện chung</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                        {formData.image ? <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-contain p-1" /> : <ImageIcon size={24} className="text-gray-300" />}
                                        <div onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"><UploadCloud size={20} className="text-white" /></div>
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                        <button type="button" onClick={() => fileInputRef.current.click()} className="px-3 py-1.5 text-[13px] border border-blue-500 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition w-full flex items-center justify-center gap-2"><UploadCloud size={16} /> Tải ảnh lên</button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 mt-2">
                                <label className="block text-[13px] font-bold mb-2 text-indigo-700 flex items-center gap-2"><LinkIcon size={16}/> Cấu hình máy ráp tương thích (Tùy chọn)</label>
                                <div className="flex flex-col gap-2 mb-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 shadow-inner">
                                    <div className="flex gap-2">
                                        <select value={tempLink.recipeId} onChange={handleRecipeChange} className="w-1/2 border border-indigo-200 p-2 rounded-lg text-[13px] outline-none focus:border-indigo-500 bg-white">
                                            <option value="">-- Chọn Dòng Máy --</option>
                                            {recipes.map(r => <option key={r._id} value={r._id}>{r.phoneModelId?.name}</option>)}
                                        </select>
                                        <select value={tempLink.partName} onChange={e => setTempLink({...tempLink, partName: e.target.value})} className="w-1/2 border border-indigo-200 p-2 rounded-lg text-[13px] outline-none focus:border-indigo-500 bg-white" disabled={!tempLink.recipeId}>
                                            <option value="">-- Chọn Slot ghép --</option>
                                            {tempLink.recipeId && recipes.find(r => r._id === tempLink.recipeId)?.requiredParts.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <button type="button" onClick={handleAddLink} className="w-full py-1.5 bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg hover:bg-indigo-200 transition text-[13px]">+ Thêm vào danh sách</button>
                                </div>
                                {formData.linkedRecipes.length > 0 && (
                                    <div className="space-y-1.5 mt-2">
                                        {formData.linkedRecipes.map((link, idx) => {
                                            const rName = recipes.find(r => r._id === link.recipeId)?.phoneModelId?.name;
                                            return (
                                                <div key={idx} className="flex items-center justify-between text-[11px] text-gray-700 bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                                    <span>Cho: <strong className="text-indigo-700">{rName}</strong> ➜ Slot: <strong>{link.partName}</strong></span>
                                                    <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded transition"><X size={12}/></button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 flex-shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[13px] bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition">Hủy bỏ</button>
                            <button type="submit" className="px-4 py-2 text-[13px] bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition">{isEditing ? 'Lưu cập nhật' : 'Thêm danh mục'}</button>
                        </div>
                    </form>
                </div>
            )}
            <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }`}} />
        </div>
    );
}