import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Package, Search, X, Settings, MapPin, ChevronDown, ChevronRight, Tag, QrCode } from "lucide-react";

const BASE_CODES = {
    "MB": "Mainboard", "SCR": "Màn hình", "BAT": "Pin", "HSG": "Vỏ máy",
    "CAM-R": "Camera Sau", "CAM-F": "Camera Trước", "CPT": "Cụm chân sạc",
    "SPK": "Loa ngoài", "FGL": "Mặt kính", "BGL": "Kính lưng", "OTH": "Khác"
};

export default function AdminItem() {
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [pagination, setPagination] = useState({ 
        currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 
    });
    
    const [filters, setFilters] = useState({ search: '', status: '', item_type: '', storeId: '' }); 
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const initialFormState = {
        name: '', serialCode: '', item_type: '', status: 'in_stock', storeId: '',
        origin: 'new', sourceDevice: '', quality: '', warrantyPeriod: 12, baseCost: '', price: '',
        ram: '', capacity: '', color: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const [expandedGroup, setExpandedGroup] = useState({});
    const [expandedType, setExpandedType] = useState({});

    useEffect(() => { fetchItemTypes(); fetchStores(); }, []);

    useEffect(() => { fetchItems(); }, [pagination.currentPage, filters.status, filters.item_type, filters.storeId]);

    useEffect(() => {
        const timeout = setTimeout(() => { 
            setPagination(prev => ({...prev, currentPage: 1}));
            fetchItems(); 
        }, 500);
        return () => clearTimeout(timeout);
    }, [filters.search]);

    const fetchItemTypes = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`http://localhost:9999/api/item_types/all`, { headers: { Authorization: `Bearer ${token}` } });
            setItemTypes(data.data || []);
        } catch (error) {}
    };

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:9999/api/stores/all`, { headers: { Authorization: `Bearer ${token}` } });
            setStores(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (err) {}
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination.currentPage, limit: pagination.limit,
                search: filters.search, status: filters.status, item_type: filters.item_type, storeId: filters.storeId 
            });
            const { data } = await axios.get(`http://localhost:9999/api/items?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            setItems(data.data || []);
            if (data.pagination) setPagination(data.pagination);
        } catch (error) { toast.error("Lỗi tải danh sách linh kiện"); } 
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa linh kiện này?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`http://localhost:9999/api/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Xóa thành công");
                fetchItems();
            } catch (error) { toast.error("Xóa thất bại"); }
        }
    };

    const handleGenerateQR = async (itemId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:9999/api/items/${itemId}/qr`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "image/png" });
            const qrUrl = window.URL.createObjectURL(blob);

            // Use hidden iframe to keep printing stable across browsers.
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
            console.error("Item QR generation error:", error);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true); setEditingId(item._id);
            setFormData({
                name: item.name || '', serialCode: item.serialCode || '', item_type: item.item_type?._id || '',
                status: item.status || 'in_stock', storeId: item.storeId?._id || item.storeId || '', 
                origin: item.origin || 'new', sourceDevice: item.sourceDevice || '', quality: item.quality || '', 
                warrantyPeriod: item.warrantyPeriod || (item.origin === 'new' ? 12 : 3),
                baseCost: item.baseCost || '', price: item.price || '',
                ram: item.ram || '', capacity: item.capacity || '', color: item.color || ''
            });
        } else {
            setIsEditing(false); setEditingId(null);
            setFormData(initialFormState);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (isEditing) {
                await axios.put(`http://localhost:9999/api/items/update/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Cập nhật linh kiện thành công");
            } else {
                await axios.post("http://localhost:9999/api/items/create", formData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Thêm linh kiện thành công");
            }
            setShowModal(false);
            fetchItems();
        } catch (error) { toast.error(error.response?.data?.message || "Lỗi khi lưu linh kiện"); }
    };

    // 🌟 GỘP NHÓM THÀNH CÂY THƯ MỤC VÀ ĐẨY "KHÁC" XUỐNG CUỐI
    const sortedGroupedData = useMemo(() => {
        const result = {};
        
        items.forEach(item => {
            const typeName = item.item_type?.name || 'Loại không xác định';
            const typeCode = item.item_type?.code || 'OTH';
            let base = 'OTH';
            const parts = typeCode.split('-');
            if (parts[0] === 'CAM') base = `CAM-${parts[1]}`;
            else if (BASE_CODES[parts[0]]) base = parts[0];
            else if (BASE_CODES[typeCode]) base = typeCode;

            const baseLabel = BASE_CODES[base] || "Khác";

            if (!result[baseLabel]) result[baseLabel] = {};
            if (!result[baseLabel][typeName]) result[baseLabel][typeName] = [];
            result[baseLabel][typeName].push(item);
        });

        // Sắp xếp để Nhóm "Khác" nằm cuối cùng
        return Object.entries(result).sort(([groupA], [groupB]) => {
            if (groupA === "Khác") return 1;
            if (groupB === "Khác") return -1;
            return groupA.localeCompare(groupB);
        });
    }, [items]);

    const toggleGroup = (grp) => setExpandedGroup(prev => ({ ...prev, [grp]: !prev[grp] }));
    const toggleType = (typ) => setExpandedType(prev => ({ ...prev, [typ]: !prev[typ] }));
    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const selectedItemTypeObj = itemTypes.find(t => t._id === formData.item_type);
    const selectedItemTypeName = selectedItemTypeObj ? selectedItemTypeObj.name.toLowerCase() : '';
    const isMainboard = selectedItemTypeName.includes('main');
    const isColorPart = selectedItemTypeName.includes('vỏ') || selectedItemTypeName.includes('kính') || selectedItemTypeName.includes('màn') || selectedItemTypeName.includes('camera') || selectedItemTypeName.includes('khay sim');

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Settings className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Kho Linh Kiện</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /> <span>Nhập linh kiện mới</span>
                </button>
            </div>

            {/* BỘ LỌC TÌM KIẾM */}
            <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-center border border-gray-100">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm theo tên, mã Serial..." 
                        value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <select value={filters.item_type} onChange={e => setFilters({...filters, item_type: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                    <option value="">Tất cả phân loại</option>
                    {itemTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                <select value={filters.storeId} onChange={e => setFilters({...filters, storeId: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                    <option value="">Tất cả kho / cửa hàng</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                    <option value="">Tất cả trạng thái</option>
                    <option value="in_stock">Đang tồn kho</option>
                    <option value="sold">Đã bán</option>
                    <option value="repairing">Đang lắp ráp</option>
                </select>
            </div>

            {/* DANH SÁCH DẠNG CÂY */}
            <div className="flex-1 overflow-y-auto pb-4">
                {loading ? (
                    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : sortedGroupedData.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy linh kiện nào.</div>
                ) : (
                    sortedGroupedData.map(([groupName, typesObj]) => (
                        <div key={groupName} className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center hover:bg-gray-100 transition" onClick={() => toggleGroup(groupName)}>
                                <h2 className="text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
                                    <Tag className="text-blue-600" size={20}/> Nhóm: {groupName}
                                </h2>
                                {expandedGroup[groupName] ? <ChevronDown className="text-gray-500"/> : <ChevronRight className="text-gray-500"/>}
                            </div>

                            {expandedGroup[groupName] && (
                                <div className="p-4 space-y-4 bg-gray-50/20">
                                    {Object.entries(typesObj).map(([typeName, itemsList]) => (
                                        <div key={typeName} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <div className="bg-blue-50/40 p-3 px-4 cursor-pointer flex justify-between items-center hover:bg-blue-100/50 transition" onClick={() => toggleType(typeName)}>
                                                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                                    {typeName} <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">Hiển thị {itemsList.length} món</span>
                                                </h3>
                                                {expandedType[typeName] ? <ChevronDown size={18} className="text-blue-500"/> : <ChevronRight size={18} className="text-blue-500"/>}
                                            </div>

                                            {expandedType[typeName] && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                                        <thead className="bg-gray-50 text-gray-500 border-y border-gray-100">
                                                            <tr>
                                                                <th className="p-3 font-semibold">Tên & Mã Serial</th>
                                                                <th className="p-3 font-semibold text-center">QR</th>
                                                                <th className="p-3 font-semibold">Tình trạng / Thuộc tính</th>
                                                                <th className="p-3 font-semibold">Giá vốn / Bán</th>
                                                                <th className="p-3 font-semibold text-center">Vị trí & Trạng thái</th>
                                                                <th className="p-3 font-semibold text-right">Thao tác</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {itemsList.map(item => (
                                                                <tr key={item._id} className="hover:bg-blue-50/30 transition">
                                                                    <td className="p-3">
                                                                        <div className="font-bold text-gray-800 text-sm max-w-[250px] truncate" title={item.name}>{item.name}</div>
                                                                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border">{item.serialCode}</div>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <button
                                                                            onClick={() => handleGenerateQR(item._id)}
                                                                            className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"
                                                                            title="In mã QR"
                                                                        >
                                                                            <QrCode size={16} />
                                                                        </button>
                                                                    </td>
                                                                    <td className="p-3 text-xs text-gray-600">
                                                                        <div className="mb-1">
                                                                            {item.origin === 'disassembled' ? <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Bóc máy</span> : <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Hàng mới</span>}
                                                                        </div>
                                                                        {(item.ram || item.capacity || item.color) ? (
                                                                            <div className="flex gap-2">
                                                                                {item.ram && <span>RAM: <strong>{item.ram}</strong></span>}
                                                                                {item.capacity && <span>ROM: <strong>{item.capacity}</strong></span>}
                                                                                {item.color && <span>Màu: <strong>{item.color}</strong></span>}
                                                                            </div>
                                                                        ) : <span className="text-gray-400 italic">Bản tiêu chuẩn</span>}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <div className="text-xs text-gray-400 line-through mb-0.5">{formatMoney(item.baseCost)}</div>
                                                                        <div className="font-bold text-red-600">{formatMoney(item.price)}</div>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <div className="mb-1">
                                                                            {item.storeId?.name ? <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">{item.storeId.name}</span> : <span className="italic text-gray-400 text-xs">Chưa phân bổ</span>}
                                                                        </div>
                                                                        <div>
                                                                            {item.status === 'in_stock' ? <span className="text-green-600 font-bold text-xs">Sẵn sàng</span> : 
                                                                            item.status === 'sold' ? <span className="text-gray-500 font-bold text-xs">Đã bán/Ráp</span> : 
                                                                            <span className="text-yellow-600 font-bold text-xs">{item.status}</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 flex justify-end gap-2">
                                                                        <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><Edit size={16}/></button>
                                                                        <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"><Trash2 size={16}/></button>
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

            {/* 🌟 THANH PHÂN TRANG */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-600">Trang <span className="font-bold">{pagination.currentPage}</span> / <span className="font-bold">{pagination.totalPages || 1}</span> | Tổng tìm thấy: <span className="font-bold">{pagination.totalCount}</span></span>
                <div className="flex gap-2">
                    <button disabled={pagination.currentPage <= 1} onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage - 1}))} className="px-4 py-2 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm">Trước</button>
                    <button disabled={pagination.currentPage >= pagination.totalPages} onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage + 1}))} className="px-4 py-2 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm">Sau</button>
                </div>
            </div>

            {/* MODAL THÊM SỬA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa thông tin linh kiện' : 'Nhập linh kiện vào kho'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-blue-800 border-b pb-2 uppercase text-sm">1. Thông tin cơ bản</h3>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Tên linh kiện *</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Mã Serial *</label>
                                        <input required type="text" value={formData.serialCode} onChange={e => setFormData({...formData, serialCode: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Loại linh kiện *</label>
                                        <select required value={formData.item_type} onChange={e => setFormData({...formData, item_type: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">-- Chọn phân loại --</option>
                                            {itemTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
                                        </select>
                                    </div>

                                    {(isMainboard || isColorPart) && (
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-inner mt-2">
                                            <h4 className="text-xs font-bold text-blue-800 mb-3 uppercase">Thông số kỹ thuật</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {isMainboard && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">RAM</label>
                                                            <input type="text" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: 6GB" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">ROM (Bộ nhớ)</label>
                                                            <input type="text" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: 128GB" />
                                                        </div>
                                                    </>
                                                )}
                                                {isColorPart && (
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-semibold mb-1">Màu sắc</label>
                                                        <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: Đen Midnight..." />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Cửa hàng / Kho chứa</label>
                                        <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">-- Chưa phân bổ kho --</option>
                                            {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Trạng thái</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="in_stock">Trong kho (Sẵn sàng)</option>
                                            <option value="sold">Đã bán / Đã ráp máy</option>
                                            <option value="defective">Hàng lỗi</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-blue-800 border-b pb-2 uppercase text-sm">2. Nguồn gốc & Giá cả</h3>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Nguồn gốc hàng</label>
                                        <div className="flex gap-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="origin" value="new" checked={formData.origin === 'new'} onChange={e => setFormData({...formData, origin: e.target.value, warrantyPeriod: 12})} /> Mới (New)</label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="origin" value="disassembled" checked={formData.origin === 'disassembled'} onChange={e => setFormData({...formData, origin: e.target.value, warrantyPeriod: 3})} /> Bóc Máy (Zin)</label>
                                        </div>
                                    </div>

                                    {formData.origin === 'disassembled' && (
                                        <div className="bg-purple-50/50 p-4 rounded-xl space-y-4 border border-purple-100 shadow-inner">
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1">Bóc từ thiết bị nào?</label>
                                                <input type="text" value={formData.sourceDevice} onChange={e => setFormData({...formData, sourceDevice: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" placeholder="VD: iPhone 14 Pro vỡ màn" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1">Chất lượng (Ngoại hình)</label>
                                                <input type="text" value={formData.quality} onChange={e => setFormData({...formData, quality: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" placeholder="VD: 98% - Zin nguyên bản" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Giá nhập (VNĐ)</label>
                                            <input type="number" value={formData.baseCost} onChange={e => setFormData({...formData, baseCost: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-red-600">Giá bán ra (VNĐ)</label>
                                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-red-300 bg-red-50/30 p-2.5 rounded-lg outline-none font-bold" />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        <label className="block text-sm font-semibold mb-1">Bảo hành (Tháng)</label>
                                        <input type="number" value={formData.warrantyPeriod} onChange={e => setFormData({...formData, warrantyPeriod: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 font-bold rounded-xl hover:bg-gray-200">Hủy</button>
                                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30">Lưu Dữ Liệu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}