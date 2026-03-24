import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Smartphone, Search, ChevronRight, ChevronDown, X, MapPin, Tag, Image as ImageIcon, QrCode } from "lucide-react";

// 🌟 ĐÃ KHAI BÁO ĐẦY ĐỦ CÁC TRƯỜNG CHỨA ẢNH ĐỂ TRÁNH LỖI UNDEFINED
const initialFormState = {
    serialCode: '',
    phoneModelId: '',
    storeId: '',
    colorName: '',
    capacity: '',
    grade: 'Mới',
    status: 'in_stock',
    importPrice: 0,
    sellingPrice: 0,
    warrantyPeriod: 12,
    source: 'supplier',
    notes: '',
    imageFiles: [],
    previewImages: [],
    retainedImages: []
};

export default function AdminPhone() {
    const [phones, setPhones] = useState([]);
    const [models, setModels] = useState([]);
    const [stores, setStores] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedStoreFilter, setSelectedStoreFilter] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);

    const [expandedBrand, setExpandedBrand] = useState({});
    const [expandedModel, setExpandedModel] = useState({});

    useEffect(() => {
        fetchStoresAndModels();
    }, []);

    useEffect(() => {
        fetchPhones();
    }, [selectedStoreFilter]);

    const fetchStoresAndModels = async () => {
        try {
            const token = localStorage.getItem("token");
            const [storesRes, modelsRes] = await Promise.all([
                axios.get(`http://localhost:9999/api/stores/all`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:9999/api/phone_models/all`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            const fetchedStores = storesRes.data.data || storesRes.data || [];
            setStores(fetchedStores);
            if (fetchedStores.length > 0 && !selectedStoreFilter) setSelectedStoreFilter(fetchedStores[0]._id);
            setModels(modelsRes.data.data || []);
        } catch (error) { toast.error("Lỗi lấy dữ liệu ban đầu"); }
    };

    const fetchPhones = async () => {
        if (!selectedStoreFilter) return;
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`http://localhost:9999/api/phones?storeId=${selectedStoreFilter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPhones(data.data || []);
        } catch (error) { toast.error("Lỗi tải danh sách máy"); } 
        finally { setLoading(false); }
    };

    const handleOpenModal = (phone = null) => {
        if (phone) {
            setIsEditing(true);
            setEditingId(phone._id);
            setFormData({
                serialCode: phone.serialCode || '',
                phoneModelId: phone.phoneModelId?._id || phone.phoneModelId,
                storeId: phone.storeId?._id || phone.storeId,
                colorName: phone.colorName || '',
                capacity: phone.capacity || '',
                grade: phone.grade || 'Mới',
                status: phone.status || 'in_stock',
                importPrice: phone.importPrice || 0,
                sellingPrice: phone.sellingPrice || 0,
                warrantyPeriod: phone.warrantyPeriod || 12,
                source: phone.source || 'supplier',
                notes: phone.notes || '',
                imageFiles: [],
                previewImages: phone.specificImages || [],
                retainedImages: phone.specificImages || []
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({ ...initialFormState, storeId: selectedStoreFilter });
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa máy này?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:9999/api/phones/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Xóa máy thành công!");
            fetchPhones();
        } catch (error) { toast.error("Lỗi khi xóa máy"); }
    };

    const handleGenerateQR = async (phoneId, serialCode) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:9999/api/phones/qrcode/${phoneId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: "image/png" });
            const qrUrl = window.URL.createObjectURL(blob);
            // Use a hidden iframe instead of popup window to avoid browser crashes.
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.right = "0";
            iframe.style.bottom = "0";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "0";
            iframe.setAttribute("aria-hidden", "true");
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentWindow?.document;
            if (!iframeDoc || !iframe.contentWindow) {
                document.body.removeChild(iframe);
                window.URL.revokeObjectURL(qrUrl);
                toast.error("Không thể khởi tạo chế độ in.");
                return;
            }

            iframeDoc.open();
            iframeDoc.write(`
              <!doctype html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>Print QR</title>
                  <style>
                    @page { margin: 0; }
                    html, body {
                      margin: 0;
                      padding: 0;
                      width: 100%;
                      height: 100%;
                      background: #fff;
                    }
                    body {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    img {
                      width: 180px;
                      height: 180px;
                      object-fit: contain;
                    }
                  </style>
                </head>
                <body>
                  <img id="qr-print-image" src="${qrUrl}" alt="QR code" />
                </body>
              </html>
            `);
            iframeDoc.close();

            const img = iframeDoc.getElementById("qr-print-image");
            if (img) {
                img.onload = () => {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    setTimeout(() => {
                        window.URL.revokeObjectURL(qrUrl);
                        if (document.body.contains(iframe)) document.body.removeChild(iframe);
                    }, 500);
                };
                img.onerror = () => {
                    window.URL.revokeObjectURL(qrUrl);
                    if (document.body.contains(iframe)) document.body.removeChild(iframe);
                    toast.error("Không thể tải ảnh QR để in.");
                };
            } else {
                window.URL.revokeObjectURL(qrUrl);
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
                toast.error("Không thể chuẩn bị nội dung in.");
            }
        } catch (error) {
            toast.error("Lỗi khi tạo mã QR");
            console.error("QR Code generation error:", error);
        }
    };

    const handleGenerateSerial = () => {
        if (!formData.phoneModelId) {
            toast.warning("Vui lòng chọn Dòng máy ở trên trước khi tạo mã!");
            return;
        }
        const selectedModel = models.find(m => m._id === formData.phoneModelId);
        if (!selectedModel) return;

        let prefix = selectedModel.name.toUpperCase().replace(/\s+/g, '');
        prefix = prefix.replace('IPHONE', 'IP').replace('SAMSUNGGALAXY', 'SS').replace('XIAOMI', 'MI');
        if (prefix.length > 8) prefix = prefix.substring(0, 8);

        const date = new Date();
        const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();

        setFormData({ ...formData, serialCode: `${prefix}-${ddmmyyyy}-${randomStr}` });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const previews = files.map(file => URL.createObjectURL(file));
            setFormData(prev => ({
                ...prev,
                imageFiles: files,
                previewImages: previews,
                retainedImages: [] 
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const submitData = new FormData();
            
            submitData.append("serialCode", formData.serialCode);
            submitData.append("phoneModelId", formData.phoneModelId);
            submitData.append("storeId", formData.storeId);
            submitData.append("colorName", formData.colorName);
            
            let finalCapacity = formData.capacity.trim().toUpperCase();
            if (finalCapacity && !finalCapacity.includes('GB') && !finalCapacity.includes('TB')) {
                finalCapacity += 'GB';
            }
            submitData.append("capacity", finalCapacity);
            
            submitData.append("grade", formData.grade);
            submitData.append("status", formData.status);
            submitData.append("importPrice", formData.importPrice);
            submitData.append("sellingPrice", formData.sellingPrice);
            submitData.append("warrantyPeriod", formData.warrantyPeriod);
            submitData.append("source", formData.source);
            submitData.append("notes", formData.notes);

            if (isEditing && formData.retainedImages && formData.retainedImages.length > 0) {
                submitData.append("retainedImages", JSON.stringify(formData.retainedImages));
            }
            
            if (formData.imageFiles && formData.imageFiles.length > 0) {
                formData.imageFiles.forEach(file => submitData.append("images", file));
            }

            if (isEditing) {
                await axios.put(`http://localhost:9999/api/phones/update/${editingId}`, submitData, { 
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
                });
                toast.success("Cập nhật thành công!");
            } else {
                await axios.post("http://localhost:9999/api/phones/create", submitData, { 
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
                });
                toast.success("Thêm máy thành công!");
            }
            setShowModal(false);
            fetchPhones();
        } catch (error) { toast.error(error.response?.data?.message || "Lưu thất bại!"); }
    };

    // 🌟 ĐÃ BỌC AN TOÀN CHỐNG UNDEFINED CHO BỘ LỌC
    const groupedData = useMemo(() => {
        const result = {};
        const safeKeyword = searchKeyword.toLowerCase();
        
        const filtered = phones.filter(p => {
            const serialMatch = (p.serialCode || '').toLowerCase().includes(safeKeyword);
            const nameMatch = (p.phoneModelId?.name || '').toLowerCase().includes(safeKeyword);
            return serialMatch || nameMatch;
        });

        filtered.forEach(phone => {
            const brandName = phone.phoneModelId?.brand?.name || 'Hãng khác';
            const modelName = phone.phoneModelId?.name || 'Model không xác định';

            if (!result[brandName]) result[brandName] = {};
            if (!result[brandName][modelName]) result[brandName][modelName] = [];
            
            result[brandName][modelName].push(phone);
        });
        return result;
    }, [phones, searchKeyword]);

    const toggleBrand = (brand) => setExpandedBrand(prev => ({ ...prev, [brand]: !prev[brand] }));
    const toggleModel = (model) => setExpandedModel(prev => ({ ...prev, [model]: !prev[model] }));

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Smartphone className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho Điện Thoại</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select value={selectedStoreFilter} onChange={(e) => setSelectedStoreFilter(e.target.value)} className="appearance-none border border-gray-300 bg-white text-sm font-bold py-2 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                            {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    
                    <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                        <Plus size={20} /><span>Nhập Máy</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Tìm bằng Serial Code hoặc Tên máy..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-10">
                {loading ? (
                    <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : Object.keys(groupedData).length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Cửa hàng này hiện chưa có điện thoại nào trong kho.</div>
                ) : (
                    Object.entries(groupedData).map(([brandName, modelsObj]) => (
                        <div key={brandName} className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center hover:bg-gray-100 transition" onClick={() => toggleBrand(brandName)}>
                                <h2 className="text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
                                    <Tag className="text-blue-600" size={20}/> {brandName}
                                </h2>
                                {expandedBrand[brandName] ? <ChevronDown className="text-gray-500"/> : <ChevronRight className="text-gray-500"/>}
                            </div>
                            
                            {expandedBrand[brandName] && (
                                <div className="p-4 space-y-4">
                                    {Object.entries(modelsObj).map(([modelName, phonesList]) => (
                                        <div key={modelName} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="bg-blue-50/40 p-3 px-4 cursor-pointer flex justify-between items-center hover:bg-blue-100/50 transition" onClick={() => toggleModel(modelName)}>
                                                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                                    {modelName} <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">{phonesList?.length || 0} chiếc</span>
                                                </h3>
                                                {expandedModel[modelName] ? <ChevronDown size={18} className="text-blue-500"/> : <ChevronRight size={18} className="text-blue-500"/>}
                                            </div>

                                            {expandedModel[modelName] && (
                                                <div className="bg-white">
                                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                                            <tr>
                                                                <th className="p-3 font-semibold">Ảnh</th>
                                                                <th className="p-3 font-semibold">Serial Code</th>
                                                                <th className="p-3 font-semibold">QR</th>
                                                                <th className="p-3 font-semibold">Màu / ROM</th>
                                                                <th className="p-3 font-semibold">Hình thức</th>
                                                                <th className="p-3 font-semibold">Giá bán</th>
                                                                <th className="p-3 font-semibold text-center">Trạng thái</th>
                                                                <th className="p-3 font-semibold text-right">Thao tác</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {phonesList.map(phone => (
                                                                <tr key={phone._id} className="hover:bg-blue-50/30 transition">
                                                                    <td className="p-3">
                                                                        <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                                                                            {phone.specificImages && phone.specificImages.length > 0 ? (
                                                                                <img src={phone.specificImages[0]} alt="img" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <ImageIcon size={16} className="text-gray-300" />
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 font-mono font-bold text-gray-700">{phone.serialCode}</td>
                                                                    <td className="p-3">
                                                                        <button 
                                                                            onClick={() => handleGenerateQR(phone._id, phone.serialCode)}
                                                                            className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"
                                                                            title="In mã QR"
                                                                        >
                                                                            <QrCode size={16} />
                                                                        </button>
                                                                    </td>
                                                                    <td className="p-3"><span className="text-gray-800 font-medium">{phone.colorName}</span> - <span className="text-gray-500">{phone.capacity}</span></td>
                                                                    <td className="p-3"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">{phone.grade}</span></td>
                                                                    <td className="p-3 text-red-600 font-bold">{formatMoney(phone.sellingPrice)}</td>
                                                                    <td className="p-3 text-center">
                                                                        {phone.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Sẵn sàng</span> : 
                                                                         phone.status === 'sold' ? <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Đã bán</span> : 
                                                                         <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">{phone.status}</span>}
                                                                    </td>
                                                                    <td className="p-3 flex justify-end gap-2">
                                                                        <button onClick={() => handleOpenModal(phone)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><Edit size={16} /></button>
                                                                        <button onClick={() => handleDelete(phone._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"><Trash2 size={16} /></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between p-5 border-b bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Cập nhật Thông tin Máy' : 'Nhập Máy Mới Vào Kho'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition bg-white p-1 rounded-full"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Dòng máy (Model) <span className="text-red-500">*</span></label>
                                    <select value={formData.phoneModelId} onChange={e => setFormData({...formData, phoneModelId: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="">-- Chọn Model --</option>
                                        {models.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Cửa hàng chứa máy <span className="text-red-500">*</span></label>
                                    <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="">-- Chọn Cửa Hàng --</option>
                                        {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình ảnh thực tế của máy (Chụp tình trạng xước xát nếu có)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative min-h-[100px]">
                                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="flex flex-wrap gap-3 justify-center mb-2 pointer-events-none">
                                            {/* 🌟 THÊM CHẤM HỎI AN TOÀN ĐỂ CHỐNG LỖI LENGTH */}
                                            {formData.previewImages?.length > 0 ? (
                                                formData.previewImages.map((src, idx) => (
                                                    <img key={idx} src={src} alt="preview" className="h-16 w-16 object-cover rounded-md shadow-sm border border-gray-200" />
                                                ))
                                            ) : (
                                                <ImageIcon className="h-10 w-10 text-gray-300" />
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium pointer-events-none">
                                            {formData.previewImages?.length > 0 ? 'Nhấn để chọn lại ảnh khác' : 'Nhấn vào đây để chọn ảnh (Có thể chọn nhiều ảnh)'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Serial Code <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input type="text" value={formData.serialCode} onChange={e => setFormData({...formData, serialCode: e.target.value.toUpperCase()})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 font-mono" placeholder="Nhập hoặc tạo tự động"/>
                                        <button type="button" onClick={handleGenerateSerial} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 font-bold rounded-xl hover:bg-blue-100 transition whitespace-nowrap">Tạo mã</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nguồn gốc</label>
                                    <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="supplier">Nhập từ nhà cung cấp</option>
                                        <option value="customer_trade_in">Khách thu cũ đổi mới</option>
                                        <option value="assembled">Máy tự ráp</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Dung lượng (ROM) <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" placeholder="Chỉ cần nhập số, VD: 128 hoặc 256"/>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Màu sắc <span className="text-red-500">*</span></label>
                                        <input type="text" value={formData.colorName} onChange={e => setFormData({...formData, colorName: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" placeholder="VD: Titan Tự Nhiên"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình thức <span className="text-red-500">*</span></label>
                                        <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                            {['Mới', 'Đã kích hoạt', 'Cũ Đẹp', 'Trầy Xước', 'Xước Cấn'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá vốn (VNĐ) <span className="text-red-500">*</span></label>
                                    <input type="number" value={formData.importPrice} onChange={e => setFormData({...formData, importPrice: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                                        <input type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Bảo hành (Tháng)</label>
                                        <input type="number" value={formData.warrantyPeriod} onChange={e => setFormData({...formData, warrantyPeriod: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold border border-gray-300 rounded-xl hover:bg-gray-100 transition">Hủy bỏ</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition">{isEditing ? 'Lưu Cập Nhật' : 'Nhập Vào Kho'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}