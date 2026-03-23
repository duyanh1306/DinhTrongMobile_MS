import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Smartphone, Search, ChevronRight, ChevronDown, X, Image as ImageIcon, Package } from "lucide-react";

const initialFormState = {
    name: '',
    brand: '',
    imageFile: null,
    previewImage: '',
    specifications: {
        screenSize: '', screenTechnology: '', rearCamera: '', frontCamera: '',
        chipset: '', nfc: '', internalStorage: '', sim: '', os: '',
        screenResolution: '', screenFeatures: '', cpu: ''
    }
};

// Hàm dùng chung để phát hiện Máy Cũ qua tên
const checkIsUsedModel = (name) => {
    const lowerName = name.toLowerCase();
    return lowerName.includes('cũ') || lowerName.includes('like new') || lowerName.includes('99%');
};

export default function AdminPhoneModel() {
    const [phoneModels, setPhoneModels] = useState([]);
    const [phoneBrands, setPhoneBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);

    // STATE ĐIỀU KHIỂN ĐÓNG MỞ CÂY THƯ MỤC (ACCORDION)
    const [expandedType, setExpandedType] = useState({ new: true, used: true });
    const [expandedBrand, setExpandedBrand] = useState({});

    useEffect(() => {
        fetchPhoneBrands();
        fetchPhoneModels();
    }, []);

    const fetchPhoneBrands = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`http://localhost:9999/api/phone_brands/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPhoneBrands(data.data || []);
        } catch (error) {
            console.error("Lỗi tải danh sách hãng", error);
        }
    };

    const fetchPhoneModels = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            
            // Dùng API lấy toàn bộ + Tồn kho thay vì phân trang
            const { data } = await axios.get(`http://localhost:9999/api/phone_models/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setPhoneModels(data.data || []);
        } catch (error) {
            toast.error("Lỗi lấy dữ liệu");
        } finally {
            setLoading(false);
        }
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
            brand: model.brand?._id || model.brand || '',
            imageFile: null,
            previewImage: model.image || '',
            specifications: model.specifications || initialFormState.specifications
        });
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('spec_')) {
            setFormData(prev => ({
                ...prev,
                specifications: { ...prev.specifications, [name.replace('spec_', '')]: value }
            }));
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
            fetchPhoneModels(); // Refresh lại danh sách
        } catch (error) {
            toast.error(error.response?.data?.message || "Lưu thất bại!");
        }
    };

    // 🌟 THUẬT TOÁN GỘP NHÓM THEO: HÀNG MỚI/CŨ -> HÃNG -> DÒNG MÁY
    const groupedData = useMemo(() => {
        const result = {
            new: { label: 'ĐIỆN THOẠI MỚI', brands: {} },
            used: { label: 'ĐIỆN THOẠI CŨ', brands: {} }
        };

        const filtered = phoneModels.filter(m => m.name.toLowerCase().includes(searchKeyword.toLowerCase()));

        filtered.forEach(model => {
            const isUsed = checkIsUsedModel(model.name);
            const typeKey = isUsed ? 'used' : 'new';
            const brandName = model.brand?.name || 'Khác';

            if (!result[typeKey].brands[brandName]) {
                result[typeKey].brands[brandName] = [];
            }
            result[typeKey].brands[brandName].push(model);
        });

        return result;
    }, [phoneModels, searchKeyword]);

    const toggleType = (typeKey) => setExpandedType(prev => ({ ...prev, [typeKey]: !prev[typeKey] }));
    const toggleBrand = (brandKey) => setExpandedBrand(prev => ({ ...prev, [brandKey]: !prev[brandKey] }));

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Smartphone className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục Dòng Máy</h1>
                </div>
                <button onClick={handleAddPhoneModel} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <Plus size={20} /><span>Thêm Dòng máy</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Tìm kiếm tên dòng máy..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-10">
                {Object.entries(groupedData).map(([typeKey, typeData]) => (
                    <div key={typeKey} className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        
                        {/* HEADER: HÀNG MỚI / CŨ */}
                        <div className="bg-blue-50/50 p-4 cursor-pointer flex justify-between items-center border-b border-gray-100 hover:bg-blue-100/50 transition" onClick={() => toggleType(typeKey)}>
                            <h2 className="text-lg font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2">
                                {typeKey === 'new' ? <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"/> : <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"/>}
                                {typeData.label}
                            </h2>
                            {expandedType[typeKey] ? <ChevronDown className="text-blue-600"/> : <ChevronRight className="text-blue-600"/>}
                        </div>
                        
                        {expandedType[typeKey] && (
                            <div className="p-5 space-y-4 bg-gray-50/30">
                                {Object.keys(typeData.brands).length === 0 && <p className="text-gray-500 italic text-center py-4">Chưa có dữ liệu cho phân loại này</p>}
                                
                                {Object.entries(typeData.brands).map(([brandName, models]) => {
                                    const brandKey = `${typeKey}-${brandName}`;
                                    return (
                                        <div key={brandName} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            
                                            {/* HEADER: HÃNG (APPLE, SAMSUNG...) */}
                                            <div className="bg-gray-100/80 p-3 px-5 cursor-pointer flex justify-between items-center hover:bg-gray-200 transition" onClick={() => toggleBrand(brandKey)}>
                                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                                    Hãng: <span className="text-blue-700">{brandName}</span> 
                                                    <span className="bg-white text-xs px-2 py-0.5 rounded-full border border-gray-200 ml-2">{models.length} model</span>
                                                </h3>
                                                {expandedBrand[brandKey] ? <ChevronDown size={18} className="text-gray-500"/> : <ChevronRight size={18} className="text-gray-500"/>}
                                            </div>
                                            
                                            {/* LIST: CÁC DÒNG MÁY */}
                                            {expandedBrand[brandKey] && (
                                                <div className="divide-y divide-gray-100">
                                                    {models.map(model => (
                                                        <div key={model._id} className="p-3 pl-8 flex items-center justify-between hover:bg-blue-50/40 transition">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                                                                    {model.image ? <img src={model.image} className="max-w-full max-h-full object-contain p-1" alt="img" /> : <ImageIcon className="text-gray-300"/>}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800">{model.name}</p>
                                                                    
                                                                    {/* 🌟 CHỖ HIỂN THỊ TỒN KHO 🌟 */}
                                                                    <div className="flex items-center gap-1.5 mt-1 text-[13px]">
                                                                        <Package size={14} className={model.stockCount > 0 ? "text-emerald-600" : "text-gray-400"}/> 
                                                                        <span className="text-gray-500">Tồn kho toàn hệ thống:</span> 
                                                                        <strong className={model.stockCount > 0 ? "text-emerald-600 bg-emerald-50 px-1.5 rounded" : "text-red-500 bg-red-50 px-1.5 rounded"}>
                                                                            {model.stockCount || 0} chiếc
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleEditPhoneModel(model)} className="text-blue-600 bg-blue-50 p-2.5 rounded-lg hover:bg-blue-600 hover:text-white transition"><Edit size={16} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* MODAL THÊM / SỬA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between p-5 border-b bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Cập nhật Dòng máy' : 'Thêm Dòng máy mới'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500 transition bg-white p-1 rounded-full"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 max-h-[80vh] custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-3 space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên dòng máy <span className="text-red-500">*</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="VD: iPhone 15 Pro Max Cũ"/>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Hãng sản xuất <span className="text-red-500">*</span></label>
                                        <select name="brand" value={formData.brand} onChange={handleInputChange} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                                            <option value="">-- Chọn Hãng --</option>
                                            {phoneBrands.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center bg-gray-50 flex flex-col items-center justify-center hover:bg-gray-100 transition">
                                    {formData.previewImage ? <img src={formData.previewImage} alt="preview" className="h-28 w-auto mb-3 object-contain drop-shadow-sm" /> : <ImageIcon className="h-12 w-12 text-gray-300 mb-3" />}
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs w-full text-center text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-gray-800 border-b border-gray-200 pb-2 mb-4">Thông số kỹ thuật</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                    {[
                                        { l: "Màn hình", n: "spec_screenSize" }, { l: "Tấm nền", n: "spec_screenTechnology" },
                                        { l: "Camera sau", n: "spec_rearCamera" }, { l: "Camera trước", n: "spec_frontCamera" },
                                        { l: "Chipset", n: "spec_chipset" }, { l: "Bộ nhớ", n: "spec_internalStorage" },
                                        { l: "Pin/Sạc", n: "spec_cpu" }, { l: "Hệ điều hành", n: "spec_os" },
                                    ].map(f => (
                                        <div key={f.n}>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">{f.l}</label>
                                            <input type="text" name={f.n} value={formData.specifications[f.n.replace('spec_', '')]} onChange={handleInputChange} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-blue-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-gray-600 font-semibold border border-gray-300 rounded-xl hover:bg-gray-100 transition">Hủy bỏ</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition">{isEditing ? 'Lưu Cập Nhật' : 'Thêm Dòng Máy'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>
        </div>
    );
}