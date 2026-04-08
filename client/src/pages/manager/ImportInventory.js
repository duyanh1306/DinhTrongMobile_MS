import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PackagePlus, Filter, Save, ListPlus, Trash2, ShoppingCart } from "lucide-react";

// IMPORT TỪ FILE API MỚI
import { fetchImportInitDataApi, submitBatchImportApi } from "../../api/manager/importInventory";

const BASE_CODES = [
    { code: "MB", label: "Mainboard" }, { code: "SCR", label: "Màn hình" },
    { code: "BAT", label: "Pin" }, { code: "HSG", label: "Vỏ máy" },
    { code: "CAM-R", label: "Camera Sau" }, { code: "CAM-F", label: "Camera Trước" },
    { code: "CPT", label: "Cụm chân sạc" }, { code: "SPK", label: "Loa ngoài" },
    { code: "FGL", label: "Mặt kính" }, { code: "BGL", label: "Kính lưng" },
    { code: "OTH", label: "Khác" }
];

export default function ImportInventory() {
    const [itemTypes, setItemTypes] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [filterGroup, setFilterGroup] = useState("");
    const [selectedType, setSelectedType] = useState(null);

    const [pendingBatches, setPendingBatches] = useState([]);

    const [formData, setFormData] = useState({
        quantity: 1, batchSuffix: '', origin: 'new', // origin luôn ngầm định là 'new'
        baseCost: 0, price: 0, warrantyPeriod: 12, storeId: '', 
        quality: '', sourceDevice: '', ram: '', capacity: '', color: ''
    });

    // ==============================================================
    // GỌI API KHỞI TẠO DATA
    // ==============================================================
    useEffect(() => { 
        loadInitData(); 
    }, []);

    const loadInitData = async () => {
        const data = await fetchImportInitDataApi();
        if (data) {
            setItemTypes(data.itemTypes);
            setStores(data.stores);
            if (data.stores.length > 0) {
                setFormData(prev => ({ ...prev, storeId: data.stores[0]._id }));
            }
        }
    };

    // ==============================================================
    // LOGIC XỬ LÝ FORM & BỘ LỌC
    // ==============================================================
    const filteredItemTypes = itemTypes.filter(type => {
        if (!filterGroup) return false;
        return type.code.toUpperCase().includes(filterGroup.toUpperCase());
    });

    const handleGroupChange = (e) => {
        setFilterGroup(e.target.value);
        setSelectedType(null);
        setFormData(prev => ({ ...prev, ram: '', capacity: '', color: '' }));
    };

    const handleTypeSelect = (type) => {
        setSelectedType(type);
    };

    const handleAddBatch = (e) => {
        e.preventDefault();
        if (!selectedType) return toast.warning("Vui lòng chọn danh mục!");
        if (formData.quantity < 1) return toast.warning("Số lượng phải > 0!");
        if (!formData.storeId) return toast.warning("Vui lòng chọn Kho!");

        const newBatch = {
            ...formData,
            item_type: selectedType._id,
            typeName: selectedType.name,
            typeCode: selectedType.code,
            storeName: stores.find(s => s._id === formData.storeId)?.name
        };

        setPendingBatches([...pendingBatches, newBatch]);
        
        setFormData(prev => ({ ...prev, quantity: 1, ram: '', capacity: '', color: '' }));
        setSelectedType(null);
        setFilterGroup("");
        toast.success(`Đã thêm ${newBatch.quantity} ${newBatch.typeName} vào danh sách chờ.`);
    };

    const handleRemoveBatch = (index) => {
        const updated = [...pendingBatches];
        updated.splice(index, 1);
        setPendingBatches(updated);
    };

    // ==============================================================
    // LƯU TOÀN BỘ VÀO DB
    // ==============================================================
    const handleSubmitAll = async () => {
        if (pendingBatches.length === 0) return toast.warning("Danh sách chờ nhập đang trống!");
        
        setLoading(true);
        const success = await submitBatchImportApi(pendingBatches);
        
        if (success) {
            setPendingBatches([]); 
        }
        setLoading(false);
    };

    // ==============================================================
    // CÁC HÀM PHỤ TRỢ TÍNH TOÁN
    // ==============================================================
    const totalItems = pendingBatches.reduce((sum, batch) => sum + parseInt(batch.quantity), 0);
    const totalBaseCost = pendingBatches.reduce((sum, batch) => sum + (parseInt(batch.quantity) * parseInt(batch.baseCost || 0)), 0);

    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getFullYear()).slice(2)}`;
    
    const previewSuffix = formData.batchSuffix ? formData.batchSuffix.trim().toUpperCase() : dateStr;
    const previewCode = `${selectedType ? selectedType.code : 'MÃ'}-${previewSuffix}-XXXX001`; 

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center space-x-3">
                <PackagePlus className="text-indigo-600" size={32} />
                <h1 className="text-2xl font-bold text-gray-800">Nhập Kho Hàng Loạt</h1>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                
                {/* ================= CỘT TRÁI: FORM KHAI BÁO ================= */}
                <div className="w-full xl:w-7/12 flex flex-col gap-6">
                    <form onSubmit={handleAddBatch} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6 border-b pb-3">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Filter size={20} className="text-indigo-500"/> Form Khai Báo Linh Kiện
                            </h2>
                        </div>

                        {/* Bước 1: Chọn Danh Mục */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">1. Lọc Nhóm Linh Kiện</label>
                                <select value={filterGroup} onChange={handleGroupChange} className="w-full border p-2.5 rounded-xl outline-none focus:border-indigo-500 bg-indigo-50/30">
                                    <option value="">-- Chọn Nhóm --</option>
                                    {BASE_CODES.map(b => <option key={b.code} value={b.code}>{b.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">2. Chọn Cụ Thể <span className="text-red-500">*</span></label>
                                <select required value={selectedType?._id || ""} onChange={e => handleTypeSelect(itemTypes.find(t => t._id === e.target.value))} disabled={!filterGroup} className="w-full border p-2.5 rounded-xl outline-none focus:border-indigo-500 bg-white disabled:bg-gray-100">
                                    <option value="">-- Tick chọn --</option>
                                    {filteredItemTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Bước 2: Thông số chi tiết */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Số lượng <span className="text-red-500">*</span></label>
                                    <input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full border p-2 rounded-lg font-bold text-indigo-700 outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Mã đuôi lô (Để trống sẽ lấy ngày tạo)</label>
                                    <input type="text" value={formData.batchSuffix} onChange={e => setFormData({...formData, batchSuffix: e.target.value.toUpperCase()})} placeholder="VD: L1, ZIN" className="w-full border p-2 rounded-lg uppercase outline-none" />
                                </div>
                            </div>

                            {/* GIAO DIỆN PREVIEW MÃ VẠCH */}
                            <div className="col-span-4 p-4 mb-4 bg-white border border-dashed border-indigo-300 rounded-xl text-center shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Mã vạch hệ thống sẽ sinh ra có dạng:</p>
                                <p className="text-lg font-mono font-black text-indigo-700 tracking-wider">
                                    {previewCode}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 font-medium">({formData.quantity} mã Serial sẽ được tạo tự động)</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Giá vốn</label>
                                    <input type="number" min="0" value={formData.baseCost} onChange={e => setFormData({...formData, baseCost: e.target.value})} className="w-full border p-2 rounded-lg outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold mb-1">Giá bán <span className="text-red-500">*</span></label>
                                    <input type="number" min="0" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border p-2 rounded-lg outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Kho nhận <span className="text-red-500">*</span></label>
                                    <select required value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} className="w-full border p-2 rounded-lg outline-none">
                                        {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Bảo hành (Tháng)</label>
                                    <input type="number" min="0" value={formData.warrantyPeriod} onChange={e => setFormData({...formData, warrantyPeriod: e.target.value})} className="w-full border p-2 rounded-lg outline-none" />
                                </div>
                            </div>

                            {/* Option phụ thuộc */}
                            {(filterGroup === 'MB' || ['HSG', 'SCR', 'FGL', 'BGL'].includes(filterGroup)) && (
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4">
                                    {filterGroup === 'MB' && (
                                        <>
                                            <div><label className="block text-sm mb-1">RAM</label><input value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} placeholder="VD: 4GB" className="w-full border p-2 rounded-lg" /></div>
                                            <div><label className="block text-sm mb-1">Dung lượng</label><input value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} placeholder="VD: 128GB" className="w-full border p-2 rounded-lg" /></div>
                                        </>
                                    )}
                                    {['HSG', 'SCR', 'FGL', 'BGL'].includes(filterGroup) && (
                                        <div className="col-span-2"><label className="block text-sm mb-1">Màu sắc</label><input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="VD: Đen" className="w-full border p-2 rounded-lg" /></div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                            <ListPlus size={20}/> Thêm Lô Này Vào Danh Sách Chờ
                        </button>
                    </form>
                </div>

                {/* ================= CỘT PHẢI: DANH SÁCH CHỜ NHẬP ================= */}
                <div className="w-full xl:w-5/12 flex flex-col">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col h-full max-h-[80vh]">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between border-b pb-3 flex-shrink-0">
                            <div className="flex items-center gap-2"><ShoppingCart size={20} className="text-emerald-500"/> Danh Sách Chờ Nhập</div>
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">{pendingBatches.length} Lô</span>
                        </h2>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {pendingBatches.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <ShoppingCart size={48} className="mb-2 opacity-50"/>
                                    <p>Chưa có lô hàng nào được thêm.</p>
                                </div>
                            ) : (
                                pendingBatches.map((batch, index) => (
                                    <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-xl relative group">
                                        <button onClick={() => handleRemoveBatch(index)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                                        
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-indigo-600 text-white font-black px-2 py-1 rounded text-sm">x{batch.quantity}</span>
                                            <span className="font-bold text-gray-800">{batch.typeName}</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 text-xs text-gray-600 gap-y-1">
                                            <p>• Mã đuôi: <span className="font-mono text-indigo-600 font-bold">{batch.batchSuffix || "Tự động"}</span></p>
                                            <p>• Tình trạng: Mới 100%</p>
                                            <p>• Giá nhập: {Number(batch.baseCost).toLocaleString()}đ</p>
                                            <p>• Giá bán: {Number(batch.price).toLocaleString()}đ</p>
                                            <p className="col-span-2 truncate">• Kho nhận: {batch.storeName}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex-shrink-0">
                            <div className="flex justify-between text-sm mb-4 text-gray-600">
                                <span>Tổng số lượng: <strong className="text-gray-800 text-lg">{totalItems}</strong></span>
                                <span>Tạm tính vốn: <strong className="text-red-600 text-lg">{totalBaseCost.toLocaleString()}đ</strong></span>
                            </div>
                            <button 
                                onClick={handleSubmitAll} 
                                disabled={loading || pendingBatches.length === 0} 
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
    );
}