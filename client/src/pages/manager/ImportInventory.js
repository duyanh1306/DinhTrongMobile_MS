import React, { useEffect, useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PackagePlus, Filter, Save, ListPlus, Trash2, ShoppingCart, Package, Smartphone, Image as ImageIcon } from "lucide-react";

import { fetchImportInitDataApi, submitBatchImportApi } from "../../api/manager/importInventory";

const BASE_CODES = [
    { code: "MB", label: "Mainboard" }, { code: "SCR", label: "Màn hình" },
    { code: "BAT", label: "Pin" }, { code: "HSG", label: "Vỏ máy" },
    { code: "CAM-R", label: "Camera Sau" }, { code: "CAM-F", label: "Camera Trước" },
    { code: "CPT", label: "Cụm chân sạc" }, { code: "SPK", label: "Loa ngoài" },
    { code: "FGL", label: "Mặt kính" }, { code: "BGL", label: "Kính lưng" },
    { code: "OTH", label: "Khác" }
];

const formatCurrencyInput = (value) => {
    if (!value) return "";
    const onlyNums = value.toString().replace(/\D/g, '');
    return onlyNums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseCurrencyString = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, ''), 10) || 0;
};
const formatCapacity = (value) => {
    if (!value) return "";
    const num = parseInt(value, 10);
    if (num >= 1024 && num % 1024 === 0) {
        return `${num / 1024}TB`;
    }
    return `${num}GB`;
};
export default function ImportInventory() {
    const [activeTab, setActiveTab] = useState('ITEMS'); 
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [itemTypes, setItemTypes] = useState([]);
    const [stores, setStores] = useState([]);
    const [userStore, setUserStore] = useState(null);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [filterGroup, setFilterGroup] = useState("");
    const [selectedType, setSelectedType] = useState(null);
    const [pendingItemBatches, setPendingItemBatches] = useState(() => {
        const saved = sessionStorage.getItem("pendingItemBatches");
        return saved ? JSON.parse(saved) : [];
    });
    const [itemFormData, setItemFormData] = useState({
        quantity: 1, batchSuffix: '', origin: 'new',
        baseCost: 0, price: 0, warrantyPeriod: 12, storeId: '', 
        quality: '', sourceDevice: '', ram: '', capacity: '', color: ''
    });

    const [selectedFormBrand, setSelectedFormBrand] = useState('');
    const [pendingPhoneBatches, setPendingPhoneBatches] = useState([]);
    const [phoneFormData, setPhoneFormData] = useState({
        quantity: 1, batchSuffix: '', phoneModelId: '', colorName: '', capacity: '',
        grade: 'Mới', baseCost: 0, price: 0, warrantyPeriod: 12, storeId: '',
        imageFiles: [], previewImages: []
    });

    useEffect(() => { 
        loadInitData(); 
    }, []);

    const loadInitData = async () => {
        const data = await fetchImportInitDataApi();
        if (data) {
            setItemTypes(data.itemTypes);
            setStores(data.stores);
            setModels(data.models);
    
            const currentUserStore = data.stores.find(store => store.staff && store.staff.includes(user._id || user.id));
            if (currentUserStore) {
                setUserStore(currentUserStore);
                setItemFormData(prev => ({ ...prev, storeId: currentUserStore._id }));
                setPhoneFormData(prev => ({ ...prev, storeId: currentUserStore._id }));
            } else {
                toast.error('Tài khoản của bạn chưa được gắn vào cửa hàng nào!');
            }
        }
    };

    const uniqueBrands = useMemo(() => {
        const brands = new Set();
        models.forEach(m => {
            if (m.brand?.name) brands.add(m.brand.name);
            else if (typeof m.brand === 'string') brands.add(m.brand);
        });
        return Array.from(brands);
    }, [models]);

    const filteredModelsForForm = useMemo(() => {
        if (!selectedFormBrand) return [];
        return models.filter(m => {
            const brandName = m.brand?.name || m.brand || 'Hãng khác';
            return brandName === selectedFormBrand;
        });
    }, [models, selectedFormBrand]);

    const filteredItemTypes = itemTypes.filter(type => {
        if (!filterGroup) return false;
        return type.code.toUpperCase().includes(filterGroup.toUpperCase());
    });

    const handleGroupChange = (e) => {
        setFilterGroup(e.target.value);
        setSelectedType(null);
        setItemFormData(prev => ({ ...prev, ram: '', capacity: '', color: '' }));
    };

    const handleAddBatchItem = (e) => {
        e.preventDefault();
        if (!selectedType) return toast.warning("Vui lòng chọn danh mục!");
        if (itemFormData.quantity < 1) return toast.warning("Số lượng phải > 0!");
        if (!itemFormData.storeId) return toast.warning("Lỗi: Không tìm thấy Kho nhận của bạn!");

        if (filterGroup === 'MB') {
            if (!itemFormData.ram.trim()) return toast.warning("Vui lòng nhập RAM cho Mainboard!");
            if (!itemFormData.capacity.trim()) return toast.warning("Vui lòng nhập Dung lượng cho Mainboard!");
        }
        if (['HSG', 'SCR', 'FGL', 'BGL'].includes(filterGroup)) {
            if (!itemFormData.color.trim()) return toast.warning("Vui lòng nhập Màu sắc cho linh kiện này!");
        }
        if (!itemFormData.baseCost || itemFormData.baseCost <= 0) return toast.warning("Giá nhập (Vốn) phải lớn hơn 0!");
        const newBatch = {
            ...itemFormData,
            capacity: (filterGroup === 'MB' && itemFormData.capacity) ? formatCapacity(itemFormData.capacity) : itemFormData.capacity,
            item_type: selectedType._id,
            typeName: selectedType.name,
            typeCode: selectedType.code,
            storeName: userStore?.name || "Kho của tôi"
        };

        setPendingItemBatches([...pendingItemBatches, newBatch]);
        
     
        setItemFormData(prev => ({ ...prev, quantity: 1, ram: '', capacity: '', color: '', baseCost: 0, price: 0, storeId: userStore?._id }));
        setSelectedType(null);
        setFilterGroup("");
        toast.success(`Đã thêm ${newBatch.quantity} ${newBatch.typeName} vào danh sách chờ.`);
    };

    const handleFileChange = (e) => {
        let files = Array.from(e.target.files);
        if (files.length > 5) {
            toast.warning("Chỉ được phép chọn tối đa 5 hình ảnh!");
            files = files.slice(0, 5); 
        }
        if (files.length > 0) {
            const previews = files.map(file => URL.createObjectURL(file));
            setPhoneFormData(prev => ({ ...prev, imageFiles: files, previewImages: previews }));
        }
        e.target.value = null;
    };

    const handleAddBatchPhone = (e) => {
        e.preventDefault();
        if (!phoneFormData.phoneModelId) return toast.warning("Vui lòng chọn Dòng máy!");
        if (phoneFormData.quantity < 1) return toast.warning("Số lượng phải > 0!");
        if (!phoneFormData.storeId) return toast.warning("Lỗi: Không tìm thấy Kho nhận của bạn!");
        if (phoneFormData.imageFiles.length === 0) return toast.warning("Vui lòng thêm ít nhất 1 hình ảnh thực tế cho máy (Tối đa 5)!");

        if (!phoneFormData.baseCost || phoneFormData.baseCost <= 0) return toast.warning("Giá nhập (Vốn) phải lớn hơn 0!");
        const selectedModel = models.find(m => m._id === phoneFormData.phoneModelId);

        const newBatch = {
            ...phoneFormData,
            capacity: formatCapacity(phoneFormData.capacity),
            modelName: selectedModel?.name,
            storeName: userStore?.name || "Kho của tôi"
        };

        setPendingPhoneBatches([...pendingPhoneBatches, newBatch]);
    
        setPhoneFormData(prev => ({ 
            ...prev, quantity: 1, colorName: '', capacity: '', baseCost: 0, price: 0,
            imageFiles: [], previewImages: [], storeId: userStore?._id 
        }));
        toast.success(`Đã thêm ${newBatch.quantity} máy ${newBatch.modelName} vào danh sách chờ.`);
    };

    const handleSubmitAll = async () => {
        if (pendingItemBatches.length === 0 && pendingPhoneBatches.length === 0) return toast.warning("Danh sách chờ nhập đang trống!");
        if (!userStore) return toast.error("Không xác định được cửa hàng nhập kho!");

        setLoading(true);
        const success = await submitBatchImportApi(pendingItemBatches, pendingPhoneBatches);
        
        if (success) {
            setPendingItemBatches([]); 
            setPendingPhoneBatches([]);
        }
        setLoading(false);
    };

    const totalItems = pendingItemBatches.reduce((sum, batch) => sum + parseInt(batch.quantity), 0) + pendingPhoneBatches.reduce((sum, batch) => sum + parseInt(batch.quantity), 0);
    const totalBaseCost = pendingItemBatches.reduce((sum, batch) => sum + (parseInt(batch.quantity) * parseInt(batch.baseCost || 0)), 0) + pendingPhoneBatches.reduce((sum, batch) => sum + (parseInt(batch.quantity) * parseInt(batch.baseCost || 0)), 0);

    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getFullYear()).slice(2)}`;
    
    const previewItemSuffix = itemFormData.batchSuffix ? itemFormData.batchSuffix.trim().toUpperCase() : dateStr;
    const previewItemCode = `${selectedType ? selectedType.code : 'MÃ'}-${previewItemSuffix}-XXXX001`; 

    const getPhonePrefix = (modelId) => {
        const m = models.find(x => x._id === modelId);
        if (!m) return 'PHONE';
        let p = m.name.toUpperCase().replace(/\s+/g, '');
        p = p.replace('IPHONE', 'IP').replace('SAMSUNGGALAXY', 'SS').replace('XIAOMI', 'MI');
        return p.substring(0, 8);
    };
    const previewPhoneCode = `${getPhonePrefix(phoneFormData.phoneModelId)}-${phoneFormData.batchSuffix ? phoneFormData.batchSuffix.trim().toUpperCase() : dateStr}-XXXX001`;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="flex flex-col h-full space-y-6">
                <div className="flex items-center space-x-3">
                    <PackagePlus className="text-indigo-600" size={32} />
                    <h1 className="text-2xl font-bold text-gray-800">Nhập Kho Hàng Loạt</h1>
                </div>

                <div className="flex flex-col xl:flex-row gap-6">
                    
                    <div className="w-full xl:w-7/12 flex flex-col gap-4">
                        <div className="flex bg-white rounded-xl border-b-2 border-gray-100 shadow-sm overflow-hidden cursor-pointer">
                            <div onClick={() => setActiveTab('ITEMS')} className={`w-1/2 text-center py-4 font-bold text-[15px] transition-colors flex justify-center items-center gap-2 ${activeTab === 'ITEMS' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
                                <Package size={20}/> Nhập Lô Linh Kiện
                            </div>
                            <div onClick={() => setActiveTab('PHONES')} className={`w-1/2 text-center py-4 font-bold text-[15px] transition-colors flex justify-center items-center gap-2 ${activeTab === 'PHONES' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
                                <Smartphone size={20}/> Nhập Lô Điện Thoại
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            {activeTab === 'ITEMS' && (
                                <form onSubmit={handleAddBatchItem}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-gray-700">1. Lọc Nhóm Linh Kiện</label>
                                            <select value={filterGroup} onChange={handleGroupChange} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30">
                                                <option value="">-- Chọn Nhóm --</option>
                                                {BASE_CODES.map(b => <option key={b.code} value={b.code}>{b.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-gray-700">2. Chọn Cụ Thể <span className="text-red-500">*</span></label>
                                            <select required value={selectedType?._id || ""} onChange={e => setSelectedType(itemTypes.find(t => t._id === e.target.value))} disabled={!filterGroup} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100">
                                                <option value="">-- Tick chọn --</option>
                                                {filteredItemTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Số lượng <span className="text-red-500">*</span></label>
                                                <input type="number" min="1" required value={itemFormData.quantity} onChange={e => setItemFormData({...itemFormData, quantity: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Mã đuôi lô (Để trống lấy ngày tạo)</label>
                                                <input type="text" value={itemFormData.batchSuffix} onChange={e => setItemFormData({...itemFormData, batchSuffix: e.target.value.toUpperCase()})} placeholder="VD: L1, ZIN" className="w-full border border-gray-300 p-2.5 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>

                                        <div className="col-span-4 p-4 mb-4 bg-white border border-dashed border-indigo-300 rounded-xl text-center shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Mã vạch hệ thống sẽ sinh ra có dạng:</p>
                                            <p className="text-lg font-mono font-black text-indigo-700 tracking-wider">{previewItemCode}</p>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">({itemFormData.quantity} mã Serial sẽ được tạo tự động)</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Giá nhập (Vốn) (VNĐ) <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={itemFormData.baseCost ? formatCurrencyInput(itemFormData.baseCost) : ''} 
                                                    onChange={e => setItemFormData({...itemFormData, baseCost: parseCurrencyString(e.target.value)})} 
                                                    className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                                                    placeholder="VD: 500.000" 
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Giá nhập (Vốn) (VNĐ) <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={phoneFormData.baseCost ? formatCurrencyInput(phoneFormData.baseCost) : ''} 
                                                    onChange={e => setPhoneFormData({...phoneFormData, baseCost: parseCurrencyString(e.target.value)})} 
                                                    className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                                                    placeholder="VD: 10.000.000" 
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                       
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Kho nhận <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={userStore ? userStore.name : "Đang tải..."} 
                                                    readOnly 
                                                    className="w-full border border-gray-300 p-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-not-allowed outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Bảo hành (Tháng)</label>
                                                <input type="number" min="0" value={itemFormData.warrantyPeriod} onChange={e => setItemFormData({...itemFormData, warrantyPeriod: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>

                                        {(filterGroup === 'MB' || ['HSG', 'SCR', 'FGL', 'BGL'].includes(filterGroup)) && (
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4">
                                                {filterGroup === 'MB' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">RAM <span className="text-red-500">*</span></label>
                                                            <input required value={itemFormData.ram} onChange={e => setItemFormData({...itemFormData, ram: e.target.value})} placeholder="VD: 4GB" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Dung lượng <span className="text-red-500">*</span></label>
                                                            <div className="relative">
                                                                <input type="text" required value={itemFormData.capacity} onChange={e => setItemFormData({...itemFormData, capacity: e.target.value.replace(/\D/g, '')})} placeholder="Chỉ nhập số, VD: 128" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 pr-10" />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">GB</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                {['HSG', 'SCR', 'FGL', 'BGL'].includes(filterGroup) && (
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-semibold mb-1">Màu sắc <span className="text-red-500">*</span></label>
                                                        <input required value={itemFormData.color} onChange={e => setItemFormData({...itemFormData, color: e.target.value})} placeholder="VD: Đen" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="w-full py-3.5 bg-white border-2 border-indigo-600 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-2 shadow-sm">
                                        <ListPlus size={20}/> Thêm Lô Linh Kiện Vào Danh Sách Chờ
                                    </button>
                                </form>
                            )}

                            {activeTab === 'PHONES' && (
                                <form onSubmit={handleAddBatchPhone}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-gray-700">1. Chọn Hãng <span className="text-red-500">*</span></label>
                                            <select 
                                                value={selectedFormBrand} 
                                                onChange={(e) => {
                                                    setSelectedFormBrand(e.target.value);
                                                    setPhoneFormData({...phoneFormData, phoneModelId: ''}); 
                                                }} 
                                                className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                                            >
                                                <option value="">-- Chọn Hãng --</option>
                                                {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-gray-700">2. Chọn Dòng máy <span className="text-red-500">*</span></label>
                                            <select 
                                                required 
                                                value={phoneFormData.phoneModelId} 
                                                onChange={e => setPhoneFormData({...phoneFormData, phoneModelId: e.target.value})} 
                                                disabled={!selectedFormBrand}
                                                className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
                                            >
                                                <option value="">-- Chọn Model --</option>
                                                {filteredModelsForForm.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Số lượng <span className="text-red-500">*</span></label>
                                                <input type="number" min="1" required value={phoneFormData.quantity} onChange={e => setPhoneFormData({...phoneFormData, quantity: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Mã đuôi lô (Để trống lấy ngày)</label>
                                                <input type="text" value={phoneFormData.batchSuffix} onChange={e => setPhoneFormData({...phoneFormData, batchSuffix: e.target.value.toUpperCase()})} placeholder="VD: L1, NEW" className="w-full border border-gray-300 p-2.5 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>

                                        <div className="col-span-4 p-4 mb-4 bg-white border border-dashed border-indigo-300 rounded-xl text-center shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Mã vạch hệ thống sẽ sinh ra có dạng:</p>
                                            <p className="text-lg font-mono font-black text-indigo-700 tracking-wider">{previewPhoneCode}</p>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">({phoneFormData.quantity} mã Serial sẽ được tạo tự động)</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Dung lượng (ROM) <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input type="text" required value={phoneFormData.capacity} onChange={e => setPhoneFormData({...phoneFormData, capacity: e.target.value.replace(/\D/g, '')})} placeholder="VD: 128" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 pr-10" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">GB</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Màu sắc <span className="text-red-500">*</span></label>
                                                <input type="text" required value={phoneFormData.colorName} onChange={e => setPhoneFormData({...phoneFormData, colorName: e.target.value})} placeholder="VD: Titan" className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Hình thức (Khóa)</label>
                                                <input type="text" value="Mới" readOnly className="w-full border border-gray-300 p-2.5 rounded-xl bg-gray-200 text-gray-700 font-bold cursor-not-allowed outline-none" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Giá nhập (Vốn) (VNĐ)</label>
                                                <input 
                                                    type="text" 
                                                    value={phoneFormData.baseCost ? formatCurrencyInput(phoneFormData.baseCost) : ''} 
                                                    onChange={e => setPhoneFormData({...phoneFormData, baseCost: parseCurrencyString(e.target.value)})} 
                                                    className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                                                    placeholder="VD: 10.000.000" 
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={phoneFormData.price ? formatCurrencyInput(phoneFormData.price) : ''} 
                                                    onChange={e => setPhoneFormData({...phoneFormData, price: parseCurrencyString(e.target.value)})} 
                                                    className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                                                    placeholder="VD: 15.000.000" 
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                     
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Kho nhận <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={userStore ? userStore.name : "Đang tải..."} 
                                                    readOnly 
                                                    className="w-full border border-gray-300 p-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-not-allowed outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Bảo hành (Tháng)</label>
                                                <input type="number" min="0" value={phoneFormData.warrantyPeriod} onChange={e => setPhoneFormData({...phoneFormData, warrantyPeriod: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <label className="block text-sm font-semibold mb-2">Hình ảnh thực tế (Dùng chung cho lô máy) <span className="text-red-500">*</span> <span className="text-gray-500 text-xs font-normal">(Tối đa 5 ảnh)</span></label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition cursor-pointer relative min-h-[100px]">
                                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <div className="flex flex-wrap gap-3 justify-center mb-2 pointer-events-none">
                                                    {phoneFormData.previewImages?.length > 0 ? phoneFormData.previewImages.map((src, idx) => <img key={idx} src={src} alt="preview" className="h-16 w-16 object-cover rounded-md shadow-sm border border-gray-200" />) : <ImageIcon className="h-10 w-10 text-gray-300" />}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium pointer-events-none">{phoneFormData.previewImages?.length > 0 ? 'Nhấn để chọn lại ảnh khác (Tối đa 5)' : 'Nhấn vào đây để tải ảnh lên (Tối đa 5 ảnh)'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full py-3.5 bg-white border-2 border-indigo-600 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-2 shadow-sm">
                                        <ListPlus size={20}/> Thêm Lô Điện Thoại Vào Danh Sách Chờ
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="w-full xl:w-5/12 flex flex-col">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col h-full max-h-[80vh]">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between border-b pb-3 flex-shrink-0">
                                <div className="flex items-center gap-2"><ShoppingCart size={20} className="text-emerald-500"/> Danh Sách Chờ Nhập</div>
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">{pendingItemBatches.length + pendingPhoneBatches.length} Lô</span>
                            </h2>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {pendingItemBatches.length === 0 && pendingPhoneBatches.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <ShoppingCart size={48} className="mb-2 opacity-50"/>
                                        <p>Chưa có lô hàng nào được thêm.</p>
                                    </div>
                                ) : (
                                    <>
                                        {pendingPhoneBatches.map((batch, index) => (
                                            <div key={`p-${index}`} className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl relative group">
                                                <button onClick={() => { const b = [...pendingPhoneBatches]; b.splice(index, 1); setPendingPhoneBatches(b); }} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                                                
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-blue-600 text-white font-black px-2 py-1 rounded text-sm">x{batch.quantity}</span>
                                                    <span className="font-bold text-blue-900">{batch.modelName}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 text-xs text-gray-600 gap-y-1 mt-2">
                                                    <p>• Mã đuôi: <span className="font-mono text-blue-700 font-bold">{batch.batchSuffix || "Tự động"}</span></p>
                                                    <p>• Bản: <span className="font-semibold text-gray-800">{batch.colorName} - {batch.capacity}</span></p>
                                                    <p>• Tình trạng: <span className="font-semibold text-purple-700">{batch.grade}</span></p>
                                                    <p className="truncate">• Kho nhận: {batch.storeName}</p>
                                                    <p>• Vốn: {Number(batch.baseCost).toLocaleString()}đ</p>
                                                    <p>• Bán: {Number(batch.price).toLocaleString()}đ</p>
                                                </div>
                                                {batch.previewImages?.length > 0 && (
                                                    <div className="flex gap-1 mt-2 pt-2 border-t border-blue-100">
                                                        {batch.previewImages.slice(0, 4).map((src, i) => <img key={i} src={src} className="w-6 h-6 object-cover rounded" alt="th" />)}
                                                        {batch.previewImages.length > 4 && <span className="text-[10px] text-gray-500">+{batch.previewImages.length - 4}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {pendingItemBatches.map((batch, index) => (
                                            <div key={`i-${index}`} className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl relative group">
                                                <button onClick={() => { const b = [...pendingItemBatches]; b.splice(index, 1); setPendingItemBatches(b); }} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                                                
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-emerald-600 text-white font-black px-2 py-1 rounded text-sm">x{batch.quantity}</span>
                                                    <span className="font-bold text-emerald-900">{batch.typeName}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 text-xs text-gray-600 gap-y-1 mt-2">
                                                    <p>• Mã đuôi: <span className="font-mono text-emerald-700 font-bold">{batch.batchSuffix || "Tự động"}</span></p>
                                                    <p>• Tình trạng: <span className="font-semibold text-purple-700">Mới 100%</span></p>
                                                    <p>• Vốn: {Number(batch.baseCost).toLocaleString()}đ</p>
                                                    <p>• Bán: {Number(batch.price).toLocaleString()}đ</p>
                                                    <p className="col-span-2 truncate">• Kho nhận: {batch.storeName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex-shrink-0">
                                <div className="flex justify-between text-sm mb-4 text-gray-600">
                                    <span>Tổng số lượng: <strong className="text-gray-800 text-lg">{totalItems}</strong></span>
                                    <span>Tạm tính vốn: <strong className="text-red-600 text-lg">{totalBaseCost.toLocaleString()}đ</strong></span>
                                </div>
                                <button 
                                    onClick={handleSubmitAll} 
                                    disabled={loading || (pendingItemBatches.length === 0 && pendingPhoneBatches.length === 0) || !userStore} 
                                    className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={20}/> Xác Nhận Lưu Toàn Bộ Vào Kho</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }`}} />
            </div>
        </>
    );
}