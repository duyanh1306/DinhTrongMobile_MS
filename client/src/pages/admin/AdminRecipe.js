import React, { useEffect, useState, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import { Plus, Edit, Trash2, Settings, X, Save, Layers, Filter, Search, ListChecks } from "lucide-react";

import { 
    fetchInitialDataApi, 
    createRecipeApi, 
    updateRecipeApi, 
    deleteRecipeApi 
} from "../../api/admin/recipe";

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
    { code: "OTH", label: "Khác" }
];

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
    const [editingDots, setEditingDots] = useState(null); 
    const [jumpPage, setJumpPage] = useState('');

    if (totalPages <= 1) return null;

    const handleJumpSubmit = () => {
        let page = parseInt(jumpPage, 10);
        if (!isNaN(page)) {
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            onPageChange(page);
        }
        setEditingDots(null);
        setJumpPage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleJumpSubmit();
        else if (e.key === 'Escape') { setEditingDots(null); setJumpPage(''); }
    };

    const renderInteractiveDots = (position) => {
        if (editingDots === position) {
            return (
                <input
                    key={`input-${position}`}
                    type="number" autoFocus min={1} max={totalPages} value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)} onBlur={handleJumpSubmit} onKeyDown={handleKeyDown}
                    className="w-14 px-1 py-1.5 border-2 border-blue-500 rounded-lg text-center text-sm font-bold text-blue-700 outline-none hide-arrows shadow-sm"
                    placeholder="..."
                />
            );
        }
        return (
            <button key={`dots-${position}`} onClick={() => setEditingDots(position)} className="px-2 text-gray-400 font-bold tracking-widest hover:text-blue-600 transition cursor-pointer" title="Nhấn để nhập số trang">...</button>
        );
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = startPage + maxVisible - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(<button key="first" onClick={() => onPageChange(1)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">1</button>);
            if (startPage > 2) pages.push(renderInteractiveDots('start'));
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button key={i} onClick={() => onPageChange(i)} className={`px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm ${i === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>{i}</button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(renderInteractiveDots('end'));
            pages.push(<button key="last" onClick={() => onPageChange(totalPages)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">{totalPages}</button>);
        }
        return pages;
    };

    return (
        <div className="flex gap-1.5 items-center">
            <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm">Trước</button>
            {renderPageNumbers()}
            <button disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm">Sau</button>
            <style dangerouslySetInnerHTML={{__html: `.hide-arrows::-webkit-outer-spin-button, .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } .hide-arrows { -moz-appearance: textfield; }`}} />
        </div>
    );
};

export default function AdminRecipe() {
    const [recipes, setRecipes] = useState([]);
    const [phoneModels, setPhoneModels] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [selectedBrand, setSelectedBrand] = useState('');
    const endOfListRef = useRef(null);

    const [formData, setFormData] = useState({
        phoneModelId: '',
        description: '',
        requiredParts: []
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        const data = await fetchInitialDataApi();
        setRecipes(data.recipes);
        setPhoneModels(data.phoneModels);
        setItemTypes(data.itemTypes);
        setLoading(false);
    };

    const reloadRecipesOnly = async () => {
        const data = await fetchInitialDataApi();
        setRecipes(data.recipes);
    };

    const uniqueBrands = useMemo(() => {
        const brandsMap = new Map();
        phoneModels.forEach(m => {
            if (m.brand && m.brand._id) {
                brandsMap.set(m.brand._id, m.brand.name);
            } else if (typeof m.brand === 'string') {
                brandsMap.set(m.brand, m.brand);
            }
        });
        return Array.from(brandsMap, ([id, name]) => ({ id, name }));
    }, [phoneModels]);

    const filteredPhoneModels = useMemo(() => {
        if (!selectedBrand) return []; 
        return phoneModels.filter(m => (m.brand?._id || m.brand) === selectedBrand);
    }, [phoneModels, selectedBrand]);

    const totalPages = Math.ceil(recipes.length / itemsPerPage);
    const paginatedRecipes = recipes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleOpenModal = (recipe = null) => {
        if (recipe) {
            setIsEditing(true);
            setEditingId(recipe._id);

            const modelObj = phoneModels.find(m => m._id === (recipe.phoneModelId?._id || recipe.phoneModelId));
            setSelectedBrand(modelObj?.brand?._id || modelObj?.brand || '');

            setFormData({
                phoneModelId: recipe.phoneModelId?._id || recipe.phoneModelId,
                description: recipe.description || '',
                requiredParts: recipe.requiredParts.map(part => {
                    let guessedCode = part.partCode || '';
                    if (!guessedCode && part.acceptedItemTypes.length > 0) {
                        const firstItem = itemTypes.find(t => t._id === (part.acceptedItemTypes[0]._id || part.acceptedItemTypes[0]));
                        if (firstItem) {
                            const matchedBase = BASE_CODES.find(b => firstItem.code.toUpperCase().includes(b.code));
                            if (matchedBase) guessedCode = matchedBase.code;
                        }
                    }

                    return {
                        ...part,
                        filterCode: guessedCode,
                        acceptedItemTypes: part.acceptedItemTypes.map(type => type._id || type),
                        conditions: part.conditions && part.conditions.length > 0 ? part.conditions : [
                            { label: "Hoạt động bình thường", value: "OK", deductionPercent: 0, isFaulty: false }
                        ]
                    };
                })
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setSelectedBrand('');
            setFormData({ 
                phoneModelId: '', 
                description: '', 
                requiredParts: [
                    { isRequired: true, acceptedItemTypes: [], quantity: 1, filterCode: 'MB', conditions: [{ label: "Hoạt động bình thường", value: "OK", deductionPercent: 0, isFaulty: false }] },
                    { isRequired: true, acceptedItemTypes: [], quantity: 1, filterCode: 'SCR', conditions: [{ label: "Hoạt động bình thường", value: "OK", deductionPercent: 0, isFaulty: false }] },
                    { isRequired: true, acceptedItemTypes: [], quantity: 1, filterCode: 'BAT', conditions: [{ label: "Hoạt động bình thường", value: "OK", deductionPercent: 0, isFaulty: false }] }
                ] 
            });
        }
        setShowModal(true);
    };

    const handleBrandChange = (e) => {
        setSelectedBrand(e.target.value);
        setFormData(prev => ({ ...prev, phoneModelId: '' }));
    };

    const handleAddPart = () => {
        setFormData(prev => ({
            ...prev,
            requiredParts: [...prev.requiredParts, { 
                isRequired: true, 
                acceptedItemTypes: [], 
                quantity: 1, 
                filterCode: '',
                conditions: [{ label: "Hoạt động bình thường", value: "OK", deductionPercent: 0, isFaulty: false }]
            }]
        }));

        setTimeout(() => {
            if (endOfListRef.current) {
                endOfListRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 100);
    };

    const handleRemovePart = (index) => {
        const newParts = [...formData.requiredParts];
        newParts.splice(index, 1);
        setFormData(prev => ({ ...prev, requiredParts: newParts }));
    };

    const handlePartChange = (index, field, value) => {
        const newParts = [...formData.requiredParts];
        newParts[index][field] = value;
        setFormData(prev => ({ ...prev, requiredParts: newParts }));
    };

    const toggleAcceptedType = (partIndex, typeId) => {
        const newParts = [...formData.requiredParts];
        const currentAccepted = newParts[partIndex].acceptedItemTypes;
        
        if (currentAccepted.includes(typeId)) {
            newParts[partIndex].acceptedItemTypes = currentAccepted.filter(id => id !== typeId);
        } else {
            newParts[partIndex].acceptedItemTypes = [...currentAccepted, typeId];
        }
        setFormData(prev => ({ ...prev, requiredParts: newParts }));
    };


    const handleAddCondition = (partIndex) => {
        const newParts = [...formData.requiredParts];
        if (!newParts[partIndex].conditions) newParts[partIndex].conditions = [];
        newParts[partIndex].conditions.push({ label: "", value: "", deductionPercent: 0, isFaulty: false });
        setFormData(prev => ({ ...prev, requiredParts: newParts }));
    };

    const handleRemoveCondition = (partIndex, condIndex) => {
        const newParts = [...formData.requiredParts];
        newParts[partIndex].conditions.splice(condIndex, 1);
        setFormData(prev => ({ ...prev, requiredParts: newParts }));
    };

    const handleConditionChange = (partIndex, condIndex, field, value) => {
        const newParts = [...formData.requiredParts];
        newParts[partIndex].conditions[condIndex][field] = value;
        setFormData(prev => ({ ...prev, requiredParts: newParts }));
    };


    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?',
            text: "Bạn có chắc chắn muốn xóa cấu hình này? Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 transition mx-2 shadow-md',
                cancelButton: 'bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition mx-2 shadow-md'
            }
        });

        if (result.isConfirmed) {
            const isSuccess = await deleteRecipeApi(id);
            if (isSuccess) {
                Swal.fire({ title: 'Thành công!', text: 'Đã xóa cấu hình máy dựng.', icon: 'success', timer: 1500, showConfirmButton: false });
                reloadRecipesOnly();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.phoneModelId) {
            return Swal.fire({ icon: 'warning', title: 'Thiếu thông tin!', text: 'Vui lòng chọn Dòng Máy!', buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }});
        }

        const usedCodes = new Set();

        for (let i = 0; i < formData.requiredParts.length; i++) {
            const part = formData.requiredParts[i];
            if (!part.filterCode) {
                return Swal.fire({ icon: 'warning', title: 'Thiếu thông tin!', text: `Slot thứ ${i + 1} chưa chọn Nhóm linh kiện!`, buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }});
            }
            if (part.acceptedItemTypes.length === 0) {
                return Swal.fire({ icon: 'warning', title: 'Thiếu thông tin!', text: `Vui lòng tick chọn ít nhất 1 danh mục cho Slot thứ ${i + 1}!`, buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }});
            }

            if (usedCodes.has(part.filterCode)) {
                const baseLabel = BASE_CODES.find(b => b.code === part.filterCode)?.label;
                return Swal.fire({ icon: 'error', title: 'Lỗi cấu hình!', text: `Nhóm "${baseLabel}" bị trùng lặp. Mỗi nhóm chỉ được xuất hiện 1 lần trong cấu hình!`, buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }});
            }
            usedCodes.add(part.filterCode);


            if (part.conditions) {
                for (let j = 0; j < part.conditions.length; j++) {
                    const c = part.conditions[j];
                    if (!c.label || !c.value) {
                        return Swal.fire({ icon: 'error', title: 'Thiếu thông tin!', text: `Tình trạng đánh giá ở Slot ${i + 1} không được để trống Tên Lỗi hoặc Mã Lỗi!`, buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }});
                    }
                }
            }
        }

        const payload = {
            ...formData,
            requiredParts: formData.requiredParts.map(part => {
                const baseLabel = BASE_CODES.find(b => b.code === part.filterCode)?.label || "Linh kiện";
                return {
                    partCode: part.filterCode, 
                    name: baseLabel,
                    acceptedItemTypes: part.acceptedItemTypes,
                    quantity: part.quantity,
                    isRequired: part.isRequired,
                    conditions: part.conditions || []
                };
            })
        };

        let isSuccess = false;
        if (isEditing) {
            isSuccess = await updateRecipeApi(editingId, payload);
        } else {
            isSuccess = await createRecipeApi(payload);
        }

        if (isSuccess) {
            setShowModal(false);
            Swal.fire({
                title: 'Thành công!',
                text: isEditing ? 'Cập nhật cấu hình thành công!' : 'Tạo cấu hình mới thành công!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            reloadRecipesOnly();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra (có thể cấu hình cho máy này đã tồn tại).',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Settings className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý cấu hình Máy Dựng & Tiêu chí Thu Cũ</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /> <span>Tạo cấu hình mới</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase">Dòng Máy</th>
                                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase">Mô tả</th>
                                <th className="px-6 py-4 text-center font-medium text-gray-500 uppercase">Số Slot Y/C</th>
                                <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedRecipes.map((recipe) => (
                                <tr key={recipe._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-semibold text-gray-800 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white border border-gray-200 rounded overflow-hidden flex justify-center items-center">
                                            <img src={recipe.phoneModelId?.image || "https://via.placeholder.com/50"} alt="" className="max-w-full max-h-full object-contain p-1" />
                                        </div>
                                        {recipe.phoneModelId?.name || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{recipe.description}</td>
                                    <td className="px-6 py-4 text-center text-blue-600 font-bold">{recipe.requiredParts?.length || 0}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpenModal(recipe)} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition mr-2"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(recipe._id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {recipes.length === 0 && (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-500">Chưa có cấu hình nào!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {recipes.length > 0 && (
                    <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4 mt-auto">
                        <span className="text-sm text-gray-600">Trang <span className="font-bold text-blue-600">{currentPage}</span> / <span className="font-bold">{totalPages || 1}</span> | Tổng: <span className="font-bold text-gray-800">{recipes.length}</span> cấu hình</span>
                        <CustomPagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa cấu hình' : 'Tạo cấu hình Mới'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide border-b pb-2">1. Chọn thông tin máy</h3>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700">Lọc theo Hãng <span className="text-red-500">*</span></label>
                                        <select value={selectedBrand} onChange={handleBrandChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 cursor-pointer">
                                            <option value="">-- Chọn Hãng Sản Xuất --</option>
                                            {uniqueBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700">Chọn Dòng Máy <span className="text-red-500">*</span></label>
                                        <select required value={formData.phoneModelId} onChange={e => setFormData({...formData, phoneModelId: e.target.value})} disabled={!selectedBrand} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                            <option value="">-- Chọn Dòng Máy (Model) --</option>
                                            {filteredPhoneModels.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide border-b pb-2">2. Ghi chú thêm</h3>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700">Mô tả tóm tắt</label>
                                        <textarea 
                                            value={formData.description} 
                                            onChange={e => setFormData({...formData, description: e.target.value})} 
                                            className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none h-[115px]" 
                                            placeholder="VD: Cấu hình chuẩn dùng để lắp ráp máy mới..." 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Layers size={20}/> 3. Khai báo Slot linh kiện</h3>
                                    <button type="button" onClick={handleAddPart} className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition shadow-sm border border-blue-200">
                                        <Plus size={16}/> Thêm Slot mới
                                    </button>
                                </div>

                                {formData.requiredParts.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 border border-dashed rounded-xl text-gray-500">Chưa có Slot linh kiện nào. Hãy bấm thêm Slot!</div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.requiredParts.map((part, index) => {
                                            
                                            const baseLabel = BASE_CODES.find(b => b.code === part.filterCode)?.label;
                                            const displayName = baseLabel || "Chưa chọn Nhóm";

                                            const otherSelectedCodes = formData.requiredParts
                                                .filter((p, pIndex) => pIndex !== index && p.filterCode !== '')
                                                .map(p => p.filterCode);

                                            const filteredItemTypes = itemTypes.filter(type => {
                                                if (!part.filterCode) return false;
                                                const matchGroup = type.code.toUpperCase().includes(part.filterCode.toUpperCase());
                                                const keyword = (part.searchKeyword || '').toLowerCase();
                                                const matchSearch = (type.name || '').toLowerCase().includes(keyword) || (type.code || '').toLowerCase().includes(keyword);
                                                return matchGroup && matchSearch;
                                            });

                                            return (
                                                <div key={index} className="border border-gray-200 rounded-xl p-4 bg-white relative shadow-sm">
                                                    <button type="button" onClick={() => handleRemovePart(index)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-md transition border border-transparent hover:border-red-200">
                                                        <Trash2 size={16} />
                                                    </button>

                                                    <div className="mb-3 font-bold text-blue-800 border-b pb-2 flex items-center gap-2">
                                                        Slot {index + 1}: <span className="text-gray-800">{displayName}</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-10">
                                                        <div>
                                                            <label className="flex text-xs font-semibold text-gray-500 mb-1 items-center gap-1">
                                                                <Filter size={14}/> 1. Chọn Nhóm Linh Kiện
                                                            </label>
                                                            <select 
                                                                value={part.filterCode || ''} 
                                                                onChange={e => handlePartChange(index, 'filterCode', e.target.value)} 
                                                                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30 font-medium text-gray-700 cursor-pointer"
                                                            >
                                                                <option value="">-- Vui lòng chọn --</option>
                                                                {BASE_CODES.map(b => {
                                                                    const isDisabled = otherSelectedCodes.includes(b.code);
                                                                    return (
                                                                        <option 
                                                                            key={b.code} 
                                                                            value={b.code} 
                                                                            disabled={isDisabled}
                                                                        >
                                                                            {b.label} ({b.code}) {isDisabled ? ' - Đã thêm' : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-5">
                                                            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                                                                <input type="checkbox" checked={part.isRequired} onChange={e => handlePartChange(index, 'isRequired', e.target.checked)} className="w-4 h-4 accent-blue-600"/> Bắt buộc phải có
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                                            <label className="block text-sm font-semibold text-blue-800">2. Tick chọn các danh mục cho phép:</label>
                                                            {part.filterCode && (
                                                                <div className="relative w-full md:w-64">
                                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Tìm tên hoặc mã linh kiện..."
                                                                        value={part.searchKeyword || ''}
                                                                        onChange={(e) => handlePartChange(index, 'searchKeyword', e.target.value)}
                                                                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {!part.filterCode ? (
                                                            <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-gray-300 rounded bg-white">
                                                                Vui lòng chọn Nhóm Linh Kiện ở trên để hiển thị danh sách.
                                                            </div>
                                                        ) : (
                                                            <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 p-1 border border-gray-200 rounded bg-white custom-scrollbar shadow-inner">
                                                                {filteredItemTypes.map(type => (
                                                                    <label key={type._id} className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded cursor-pointer border border-transparent hover:border-blue-100 transition">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={part.acceptedItemTypes.includes(type._id)}
                                                                            onChange={() => toggleAcceptedType(index, type._id)}
                                                                            className="accent-blue-600"
                                                                        />
                                                                        <span className="text-sm text-gray-700 line-clamp-1">{type.name} <span className="text-gray-400 text-xs">({type.code})</span></span>
                                                                    </label>
                                                                ))}
                                                                {filteredItemTypes.length === 0 && <span className="text-sm text-gray-500 col-span-full p-2 text-center italic">Không tìm thấy danh mục nào thuộc nhóm này.</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* --- MỤC MỚI: QUẢN LÝ TIÊU CHÍ (CONDITIONS) TRỰC TIẾP TRONG NÀY --- */}
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <label className="block text-sm font-semibold text-purple-800 flex items-center gap-2">
                                                                <ListChecks size={16}/> 3. Tiêu chí đánh giá Tình trạng:
                                                            </label>
                                                            <button type="button" onClick={() => handleAddCondition(index)} className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1.5 rounded-md font-bold flex items-center gap-1 transition">
                                                                <Plus size={14}/> Thêm tình trạng
                                                            </button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {(part.conditions || []).map((cond, cIndex) => (
                                                                <div key={cIndex} className={`p-3 rounded-lg border text-sm flex flex-wrap md:flex-nowrap gap-3 items-center relative ${cond.isFaulty ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                                                                    <button type="button" onClick={() => handleRemoveCondition(index, cIndex)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={16}/></button>
                                                                    
                                                                    <div className="w-full md:w-1/3">
                                                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Tên hiển thị lỗi</label>
                                                                        <input type="text" placeholder="VD: Kính xước nhẹ" value={cond.label} onChange={(e) => handleConditionChange(index, cIndex, 'label', e.target.value)} className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-purple-500 text-sm" required />
                                                                    </div>
                                                                    <div className="w-full md:w-1/4">
                                                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Mã code</label>
                                                                        <input type="text" placeholder="VD: SCR_XR" value={cond.value} onChange={(e) => handleConditionChange(index, cIndex, 'value', e.target.value)} className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-purple-500 text-sm font-mono" required />
                                                                    </div>
                                                                    <div className="w-full md:w-1/4">
                                                                        <label className="text-[10px] uppercase font-bold text-red-500 mb-1 block">Khấu hao (%)</label>
                                                                        <div className="relative">
                                                                            <input type="number" min="0" max="100" placeholder="0" value={cond.deductionPercent} onChange={(e) => handleConditionChange(index, cIndex, 'deductionPercent', Number(e.target.value))} className="w-full p-2 border border-red-200 rounded outline-none focus:ring-1 focus:ring-red-500 text-sm text-red-600 font-bold" />
                                                                            <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-full md:w-auto flex items-center pr-6 pt-5">
                                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                                            <input type="checkbox" checked={cond.isFaulty} onChange={(e) => handleConditionChange(index, cIndex, 'isFaulty', e.target.checked)} className="w-4 h-4 accent-red-600" />
                                                                            <span className={`text-xs font-bold ${cond.isFaulty ? 'text-red-600' : 'text-gray-500'}`}>Hỏng/Nặng</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!part.conditions || part.conditions.length === 0) && (
                                                                <div className="text-xs text-center p-4 border border-dashed border-gray-300 rounded-lg text-gray-400 bg-gray-50">Chưa có tiêu chí nào. Mặc định máy thu vào tình trạng linh kiện là 100% (Hoạt động tốt).</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            )
                                        })}
                                        
                                        <div ref={endOfListRef} className="h-1" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 font-semibold text-gray-700 rounded-xl hover:bg-gray-100 transition shadow-sm">Hủy bỏ</button>
                            <button onClick={handleSubmit} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-2 transition">
                                <Save size={18}/> {isEditing ? 'Lưu cập nhật' : 'Hoàn tất tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }`}} />
        </div>
    );
}