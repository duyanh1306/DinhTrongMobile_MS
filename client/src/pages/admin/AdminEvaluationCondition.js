import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { Plus, Edit, Trash2, Settings, X, Save, Filter, ListPlus } from "lucide-react";
import { 
    getAllConditionsApi, 
    createConditionApi, 
    updateConditionApi, 
    deleteConditionApi 
} from "../../api/admin/evaluationCondition";

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

export default function AdminEvaluationCondition() {
    const [conditions, setConditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterCode, setFilterCode] = useState("");

    const [formData, setFormData] = useState({
        partCode: "",
        items: []
    });

    const loadData = async () => {
        setLoading(true);
        const data = await getAllConditionsApi();
        setConditions(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredConditions = useMemo(() => {
        if (!filterCode) return conditions;
        return conditions.filter(c => c.partCode === filterCode);
    }, [conditions, filterCode]);

    const groupedConditions = useMemo(() => {
        const groups = {};
        filteredConditions.forEach(item => {
            if (!groups[item.partCode]) {
                groups[item.partCode] = [];
            }
            groups[item.partCode].push(item);
        });
        return groups;
    }, [filteredConditions]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setEditingId(item._id);
            setFormData({
                partCode: item.partCode,
                items: [{ label: item.label, isFaulty: item.isFaulty }]
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                partCode: filterCode || "",
                items: [
                    { label: "Tốt", isFaulty: false },
                    { label: "Lỗi", isFaulty: true }
                ]
            });
        }
        setShowModal(true);
    };

    const handleAddRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { label: "", isFaulty: false }]
        }));
    };

    const handleRemoveRow = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleRowChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Xác nhận xóa?",
            text: "Hành động này không thể hoàn tác!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy",
            buttonsStyling: false,
            customClass: {
                confirmButton: "bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 mx-2 shadow-md",
                cancelButton: "bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 mx-2 shadow-md"
            }
        });

        if (result.isConfirmed) {
            const isSuccess = await deleteConditionApi(id);
            if (isSuccess) {
                Swal.fire({ title: "Thành công!", icon: "success", timer: 1500, showConfirmButton: false });
                loadData();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.partCode) {
            return Swal.fire({
                icon: "warning",
                title: "Thiếu thông tin!",
                text: "Vui lòng chọn nhóm linh kiện!",
                buttonsStyling: false,
                customClass: { confirmButton: "bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold" }
            });
        }

        const validItems = formData.items.filter(item => item.label.trim() !== "");
        
        if (validItems.length === 0) {
            return Swal.fire({
                icon: "warning",
                title: "Thiếu thông tin!",
                text: "Vui lòng nhập ít nhất 1 tình trạng hợp lệ!",
                buttonsStyling: false,
                customClass: { confirmButton: "bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold" }
            });
        }

        let isSuccess = false;
        
        if (isEditing) {
            const payload = {
                partCode: formData.partCode,
                label: validItems[0].label,
                isFaulty: validItems[0].isFaulty
            };
            isSuccess = await updateConditionApi(editingId, payload);
        } else {
            const payloadArray = validItems.map(item => ({
                partCode: formData.partCode,
                label: item.label,
                isFaulty: item.isFaulty
            }));
            isSuccess = await createConditionApi(payloadArray);
        }

        if (isSuccess) {
            setShowModal(false);
            Swal.fire({ title: "Thành công!", icon: "success", timer: 1500, showConfirmButton: false });
            loadData();
        }
    };

    const getPartName = (code) => {
        return BASE_CODES.find(b => b.code === code)?.label || code;
    };

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>;

    return (
        <div className="flex flex-col h-full space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Settings className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Tình trạng Linh kiện</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition whitespace-nowrap">
                    <ListPlus size={20} /> <span>Thêm tình trạng (Hàng loạt)</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
                <Filter className="text-gray-400" size={20} />
                <select value={filterCode} onChange={e => setFilterCode(e.target.value)} className="border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm font-semibold w-full md:w-64">
                    <option value="">-- Tất cả nhóm linh kiện --</option>
                    {BASE_CODES.map(b => (
                        <option key={b.code} value={b.code}>{b.label}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 uppercase w-1/4">Nhóm Linh Kiện</th>
                                <th className="px-6 py-4 font-medium text-gray-500 uppercase w-1/2">Tên Tình Trạng</th>
                                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-center">Phân Loại</th>
                                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.keys(groupedConditions).length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-500">Chưa có dữ liệu tình trạng nào!</td></tr>
                            ) : (
                                Object.entries(groupedConditions).map(([partCode, items]) => (
                                    <React.Fragment key={partCode}>
                                        <tr className="bg-gray-100 border-y border-gray-200">
                                            <td colSpan="4" className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-gray-800 text-sm uppercase">{getPartName(partCode)}</span>
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{partCode}</span>
                                                    <span className="text-xs text-gray-500 ml-2 font-medium">({items.length} phân loại)</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {items.map(item => (
                                            <tr key={item._id} className="hover:bg-blue-50/50 transition bg-white">
                                                <td className="px-6 py-3 border-r border-gray-50">
                                                    <div className="w-full flex justify-end pr-4">
                                                        <div className="w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl"></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-gray-700 font-semibold">{item.label}</td>
                                                <td className="px-6 py-3 text-center">
                                                    {item.isFaulty ? (
                                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Lỗi (Thay thế)</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Tốt (Giữ lại)</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition"><Edit size={18} /></button>
                                                        <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? "Sửa tình trạng" : "Thêm tình trạng (Hàng loạt)"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-2 text-blue-800 uppercase">1. Chọn Nhóm Linh Kiện <span className="text-red-500">*</span></label>
                                <select 
                                    value={formData.partCode} 
                                    onChange={e => setFormData({...formData, partCode: e.target.value})} 
                                    disabled={isEditing}
                                    className="w-full border-2 border-blue-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-blue-50 font-bold text-blue-900 disabled:opacity-60"
                                >
                                    <option value="">-- Chọn nhóm linh kiện --</option>
                                    {BASE_CODES.map(b => (
                                        <option key={b.code} value={b.code}>{b.label} ({b.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-bold text-blue-800 uppercase">2. Khai báo các tình trạng</label>
                                    {!isEditing && (
                                        <button onClick={handleAddRow} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-blue-200 transition">
                                            <Plus size={16}/> Thêm dòng
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className={`flex items-center gap-3 p-3 rounded-xl border relative ${item.isFaulty ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex-1">
                                                <input 
                                                    type="text" 
                                                    value={item.label} 
                                                    onChange={e => handleRowChange(index, "label", e.target.value)} 
                                                    placeholder="VD: Màn đẹp, Pin chai..." 
                                                    className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                                />
                                            </div>
                                            
                                            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap bg-white p-2.5 rounded-lg border border-gray-300">
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.isFaulty} 
                                                    onChange={e => handleRowChange(index, "isFaulty", e.target.checked)} 
                                                    className="w-4 h-4 accent-red-600"
                                                />
                                                <span className={`text-sm font-bold ${item.isFaulty ? 'text-red-600' : 'text-gray-600'}`}>LỖI</span>
                                            </label>

                                            {!isEditing && formData.items.length > 1 && (
                                                <button onClick={() => handleRemoveRow(index)} className="text-gray-400 hover:text-red-500 bg-white border border-gray-300 p-2.5 rounded-lg transition">
                                                    <Trash2 size={18}/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 font-semibold text-gray-700 rounded-xl hover:bg-gray-100 transition shadow-sm">Hủy bỏ</button>
                            <button onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-2 transition">
                                <Save size={18}/> Lưu thông tin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}