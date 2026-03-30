import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Plus, Edit, Smartphone, Search, ChevronDown, X, Image as ImageIcon, Package, Tag } from "lucide-react";

// 🌟 IMPORT API TỪ FILE phoneModel.js CỦA BẠN
import { fetchPhoneBrandsApi, fetchPhoneModelsApi, createPhoneModelApi, updatePhoneModelApi } from "../../api/admin/phoneModel";

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

const checkIsUsedModel = (name) => {
    const lowerName = name.toLowerCase();
    return lowerName.includes('cũ') || lowerName.includes('like new') || lowerName.includes('99%');
};

export default function AdminPhoneModel() {
    const [phoneModels, setPhoneModels] = useState([]);
    const [phoneBrands, setPhoneBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState(''); // 'new' hoặc 'used'

    // STATE PHÂN TRANG THEO NHÓM
    const [currentPage, setCurrentPage] = useState(1);
    const groupsPerPage = 3;

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchPhoneBrands();
        fetchPhoneModels();
    }, []);

    // Reset phân trang khi đổi bộ lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword, selectedBrandFilter, selectedTypeFilter]);

    // 🌟 SỬ DỤNG API TỪ FILE RIÊNG
    const fetchPhoneBrands = async () => {
        const data = await fetchPhoneBrandsApi();
        setPhoneBrands(data);
    };

    // 🌟 SỬ DỤNG API TỪ FILE RIÊNG
    const fetchPhoneModels = async () => {
        setLoading(true);
        const data = await fetchPhoneModelsApi();
        setPhoneModels(data);
        setLoading(false);
    };

    const handleAddPhoneModel = () => {
        setIsEditing(false); setEditingId(null);
        setFormData(initialFormState); setShowModal(true);
    };

    const handleEditPhoneModel = (model) => {
        setIsEditing(true); setEditingId(model._id);
        setFormData({
            name: model.name, brand: model.brand?._id || model.brand || '',
            imageFile: null, previewImage: model.image || '',
            specifications: model.specifications || initialFormState.specifications
        });
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

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
        if (file) setFormData(prev => ({ ...prev, imageFile: file, previewImage: URL.createObjectURL(file) }));
    };

    // 🌟 SỬ DỤNG API TẠO/CẬP NHẬT TỪ FILE RIÊNG
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const submitData = new FormData();
        submitData.append("name", formData.name);
        submitData.append("brand", formData.brand);
        submitData.append("specifications", JSON.stringify(formData.specifications));
        if (formData.imageFile) submitData.append("image", formData.imageFile);

        let isSuccess = false;

        if (isEditing) {
            isSuccess = await updatePhoneModelApi(editingId, submitData);
            if (isSuccess) toast.success("Cập nhật thành công!");
        } else {
            isSuccess = await createPhoneModelApi(submitData);
            if (isSuccess) toast.success("Thêm mới thành công!");
        }

        if (isSuccess) {
            handleCloseModal();
            fetchPhoneModels();
        }
    };

    // 1. LỌC VÀ GOM NHÓM DỮ LIỆU
    const allGroupedData = useMemo(() => {
        const result = {};
        const safeKeyword = searchKeyword.toLowerCase();

        const filtered = phoneModels.filter(m => {
            const nameMatch = m.name.toLowerCase().includes(safeKeyword);
            const brandId = m.brand?._id || m.brand;
            const brandPass = selectedBrandFilter ? brandId === selectedBrandFilter : true;
            const isUsed = checkIsUsedModel(m.name);
            const typePass = selectedTypeFilter === 'used' ? isUsed : selectedTypeFilter === 'new' ? !isUsed : true;

            return nameMatch && brandPass && typePass;
        });

        filtered.forEach(model => {
            const isUsed = checkIsUsedModel(model.name);
            const typeLabel = isUsed ? 'ĐIỆN THOẠI CŨ' : 'ĐIỆN THOẠI MỚI';
            const brandName = model.brand?.name || 'Khác';
            
            const groupKey = `${typeLabel} | ${brandName}`;
            
            if (!result[groupKey]) result[groupKey] = [];
            result[groupKey].push(model);
        });

        return result;
    }, [phoneModels, searchKeyword, selectedBrandFilter, selectedTypeFilter]);

    // 2. ÁP DỤNG PHÂN TRANG THEO NHÓM (GROUPS)
    const paginatedData = useMemo(() => {
        const entries = Object.entries(allGroupedData);
        // Sắp xếp để ĐIỆN THOẠI MỚI hiện lên trước
        entries.sort((a, b) => b[0].localeCompare(a[0])); 

        const totalGroups = entries.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        
        const startIndex = (currentPage - 1) * groupsPerPage;
        const endIndex = startIndex + groupsPerPage;
        const currentGroups = entries.slice(startIndex, endIndex);

        let totalItemsCount = 0;
        entries.forEach(([_, list]) => { totalItemsCount += list.length });

        return {
            groups: currentGroups,
            totalPages: totalPages || 1,
            totalItemsCount: totalItemsCount
        };
    }, [allGroupedData, currentPage]);


    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Smartphone className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Dòng Máy (Models)</h1>
                </div>
                <button onClick={handleAddPhoneModel} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /><span>Thêm Dòng máy mới</span>
                </button>
            </div>

            {/* BỘ LỌC ĐƯỢC CHUYỂN LÊN TRÊN */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center border border-gray-100">
                <div className="relative min-w-[200px]">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                        value={selectedBrandFilter} 
                        onChange={(e) => setSelectedBrandFilter(e.target.value)} 
                        className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="">Tất cả Hãng (Brands)</option>
                        {phoneBrands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                <div className="relative min-w-[180px]">
                    <select 
                        value={selectedTypeFilter} 
                        onChange={(e) => setSelectedTypeFilter(e.target.value)} 
                        className="w-full border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 px-4 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="">Tất cả loại hàng</option>
                        <option value="new">Chỉ Điện thoại Mới</option>
                        <option value="used">Chỉ Điện thoại Cũ</option>
                    </select>
                </div>

                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm kiếm tên dòng máy (VD: iPhone 15)..." 
                        value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-blue-500 text-sm" 
                    />
                </div>
            </div>

            {/* HIỂN THỊ DANH SÁCH BẢNG */}
            <div className="flex-1 overflow-y-auto pb-4">
                {loading ? (
                    <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : paginatedData.groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy Dòng máy nào phù hợp.</div>
                ) : (
                    paginatedData.groups.map(([groupKey, modelsList]) => {
                        const [typeLabel, brandName] = groupKey.split(' | ');
                        const isNew = typeLabel === 'ĐIỆN THOẠI MỚI';

                        return (
                            <div key={groupKey} className="mb-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className={`${isNew ? 'bg-blue-50/60' : 'bg-yellow-50/60'} p-3 px-4 flex justify-between items-center border-b border-gray-200`}>
                                    <h3 className={`font-bold flex items-center gap-2 text-lg ${isNew ? 'text-blue-900' : 'text-yellow-800'}`}>
                                        <Smartphone size={20} className={isNew ? 'text-blue-600' : 'text-yellow-600'}/> 
                                        {typeLabel} - Hãng {brandName}
                                        <span className={`${isNew ? 'bg-blue-600' : 'bg-yellow-600'} text-white text-xs px-2.5 py-1 rounded-full ml-2 shadow-sm`}>
                                            {modelsList.length} Dòng
                                        </span>
                                    </h3>
                                </div>

                                <div className="bg-white overflow-x-auto">
                                <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold w-[45%]">Hình Ảnh & Tên Dòng Máy</th>
                                            <th className="px-4 py-3 font-semibold text-center w-[15%]">Tồn kho Hệ thống</th>
                                            <th className="px-4 py-3 font-semibold w-[30%]">Thông số cơ bản</th>
                                            <th className="px-6 py-3 font-semibold text-right w-[10%]">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {modelsList.map(model => (
                                            <tr key={model._id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-6 py-3 truncate">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {model.image ? <img src={model.image} className="max-w-full max-h-full object-contain p-1" alt="img" /> : <ImageIcon className="text-gray-300"/>}
                                                        </div>
                                                        <span className="font-bold text-gray-800 text-base truncate" title={model.name}>{model.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-sm min-w-[100px] ${model.stockCount > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                                                        <Package size={16}/> {model.stockCount || 0} chiếc
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 truncate">
                                                    {model.specifications?.screenSize && <div className="truncate" title={`Màn: ${model.specifications.screenSize}`}>Màn: {model.specifications.screenSize}</div>}
                                                    {model.specifications?.chipset && <div className="truncate" title={`Chip: ${model.specifications.chipset}`}>Chip: {model.specifications.chipset}</div>}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end">
                                                        <button onClick={() => handleEditPhoneModel(model)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition shadow-sm border border-blue-100">
                                                            <Edit size={16} /> 
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* THANH PHÂN TRANG THEO NHÓM */}
            {!loading && paginatedData.totalItemsCount > 0 && (
                <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Đang xem trang <strong className="text-blue-600">{currentPage}</strong> / {paginatedData.totalPages}</span>
                        <span className="text-gray-300">|</span>
                        <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedData.totalItemsCount}</strong> Dòng máy</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            disabled={currentPage <= 1} 
                            onClick={() => setCurrentPage(prev => prev - 1)} 
                            className="px-5 py-2 border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm"
                        >
                            Trang trước
                        </button>
                        <button 
                            disabled={currentPage >= paginatedData.totalPages} 
                            onClick={() => setCurrentPage(prev => prev + 1)} 
                            className="px-5 py-2 border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm"
                        >
                            Trang sau
                        </button>
                    </div>
                </div>
            )}

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