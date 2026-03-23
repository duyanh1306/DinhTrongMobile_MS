import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Settings, X, Save, Layers, Filter } from "lucide-react";

// ĐỒNG BỘ DANH SÁCH MÃ CHUẨN ĐỂ LÀM BỘ LỌC
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

export default function AdminRecipe() {
    const [recipes, setRecipes] = useState([]);
    const [phoneModels, setPhoneModels] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // 🌟 KHAI BÁO MỎ NEO ĐỂ CUỘN 🌟
    const endOfListRef = useRef(null);

    const [formData, setFormData] = useState({
        phoneModelId: '',
        description: '',
        requiredParts: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            
            const [recipeRes, modelRes, typeRes] = await Promise.all([
                axios.get("http://localhost:9999/api/recipes/all", { headers }),
                axios.get("http://localhost:9999/api/phone_models/all", { headers }),
                axios.get("http://localhost:9999/api/item_types/all", { headers })
            ]);
            
            setRecipes(recipeRes.data.data || []);
            setPhoneModels(modelRes.data.data || []);
            setItemTypes(typeRes.data.data || []);
        } catch (error) {
            toast.error("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (recipe = null) => {
        if (recipe) {
            setIsEditing(true);
            setEditingId(recipe._id);
            setFormData({
                phoneModelId: recipe.phoneModelId?._id || recipe.phoneModelId,
                description: recipe.description || '',
                requiredParts: recipe.requiredParts.map(part => {
                    let guessedCode = '';
                    if (part.acceptedItemTypes.length > 0) {
                        const firstItem = itemTypes.find(t => t._id === (part.acceptedItemTypes[0]._id || part.acceptedItemTypes[0]));
                        if (firstItem) {
                            const matchedBase = BASE_CODES.find(b => firstItem.code.toUpperCase().includes(b.code));
                            if (matchedBase) guessedCode = matchedBase.code;
                        }
                    }

                    return {
                        ...part,
                        filterCode: guessedCode,
                        acceptedItemTypes: part.acceptedItemTypes.map(type => type._id || type)
                    };
                })
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({ phoneModelId: '', description: '', requiredParts: [] });
        }
        setShowModal(true);
    };

    const handleAddPart = () => {
        setFormData(prev => ({
            ...prev,
            requiredParts: [...prev.requiredParts, { isRequired: true, acceptedItemTypes: [], quantity: 1, filterCode: '' }]
        }));

        // 🌟 TỰ ĐỘNG CUỘN XUỐNG DƯỚI SAU KHI THÊM 🌟
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.phoneModelId) {
            return toast.warning("Vui lòng chọn Dòng Máy!");
        }

        const usedCodes = new Set();

        for (let i = 0; i < formData.requiredParts.length; i++) {
            const part = formData.requiredParts[i];
            if (!part.filterCode) {
                return toast.warning(`Slot thứ ${i + 1} chưa chọn Nhóm linh kiện!`);
            }
            if (part.acceptedItemTypes.length === 0) {
                return toast.warning(`Vui lòng tick chọn ít nhất 1 danh mục cho Slot thứ ${i + 1}!`);
            }

            if (usedCodes.has(part.filterCode)) {
                const baseLabel = BASE_CODES.find(b => b.code === part.filterCode)?.label;
                return toast.error(`Lỗi: Nhóm "${baseLabel}" bị trùng lặp. Mỗi nhóm chỉ được xuất hiện 1 lần trong công thức!`);
            }
            usedCodes.add(part.filterCode);
        }

        const payload = {
            ...formData,
            requiredParts: formData.requiredParts.map(part => {
                const baseLabel = BASE_CODES.find(b => b.code === part.filterCode)?.label || "Linh kiện";
                return {
                    name: baseLabel,
                    acceptedItemTypes: part.acceptedItemTypes,
                    quantity: part.quantity,
                    isRequired: part.isRequired
                };
            })
        };

        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (isEditing) {
                await axios.put(`http://localhost:9999/api/recipes/update/${editingId}`, payload, config);
                toast.success("Cập nhật công thức thành công");
            } else {
                await axios.post("http://localhost:9999/api/recipes/create", payload, config);
                toast.success("Tạo công thức thành công");
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi lưu dữ liệu");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa công thức này?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:9999/api/recipes/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Đã xóa công thức");
            fetchData();
        } catch (error) {
            toast.error("Lỗi khi xóa");
        }
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Settings className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Công Thức Máy Dựng</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /> <span>Tạo công thức mới</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
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
                        {recipes.map((recipe) => (
                            <tr key={recipe._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-semibold text-gray-800 flex items-center gap-3">
                                    <img src={recipe.phoneModelId?.image || "https://via.placeholder.com/50"} alt="" className="w-10 h-10 object-contain" />
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
                    </tbody>
                </table>
            </div>

            {/* MODAL THÊM / SỬA CÔNG THỨC */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa Công Thức' : 'Tạo Công Thức Mới'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Dành cho Dòng Máy <span className="text-red-500">*</span></label>
                                    <select required value={formData.phoneModelId} onChange={e => setFormData({...formData, phoneModelId: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                                        <option value="">-- Chọn Dòng Máy --</option>
                                        {phoneModels.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Mô tả tóm tắt</label>
                                    <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="VD: Cấu hình chuẩn..." />
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Layers size={20}/> Danh sách Slot linh kiện</h3>
                                    <button type="button" onClick={handleAddPart} className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition">
                                        <Plus size={16}/> Thêm Slot
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
                                                return type.code.toUpperCase().includes(part.filterCode.toUpperCase());
                                            });

                                            return (
                                                <div key={index} className="border border-gray-200 rounded-xl p-4 bg-white relative shadow-sm">
                                                    <button type="button" onClick={() => handleRemovePart(index)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-md transition">
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
                                                                className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-blue-50/30 font-medium text-gray-700"
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

                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <label className="block text-sm font-semibold text-blue-800 mb-2">2. Tick chọn các danh mục cho phép:</label>
                                                        
                                                        {!part.filterCode ? (
                                                            <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded bg-white">
                                                                Vui lòng chọn Nhóm Linh Kiện ở trên để hiển thị danh sách.
                                                            </div>
                                                        ) : (
                                                            <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 p-1 border rounded bg-white custom-scrollbar">
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
                                                                {filteredItemTypes.length === 0 && <span className="text-sm text-gray-500 col-span-full p-2">Không tìm thấy danh mục nào thuộc nhóm này.</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        
                                        {/* 🌟 MỎ NEO TÀNG HÌNH ĐỂ CUỘN XUỐNG DƯỚI 🌟 */}
                                        <div ref={endOfListRef} className="h-1" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border font-semibold text-gray-700 rounded-xl hover:bg-gray-100 transition">Hủy bỏ</button>
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