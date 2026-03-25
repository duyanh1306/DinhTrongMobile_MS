import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Package, Search, X, Settings, MapPin, ChevronDown, ChevronRight, Tag, QrCode, Smartphone } from "lucide-react";

const BASE_CODES = {
    "MB": "Mainboard", "SCR": "Màn hình", "BAT": "Pin", "HSG": "Vỏ máy",
    "CAM-R": "Camera Sau", "CAM-F": "Camera Trước", "CPT": "Cụm chân sạc",
    "SPK": "Loa ngoài", "FGL": "Mặt kính", "BGL": "Kính lưng", "OTH": "Khác"
};

const initialItemFormState = {
    name: '', serialCode: '', item_type: '', status: 'in_stock', storeId: '',
    origin: 'new', sourceDevice: '', quality: '', warrantyPeriod: 12, baseCost: '', price: '',
    ram: '', capacity: '', color: ''
};

const initialPhoneFormState = {
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

export default function ManagerInventory() {
    const [activeTab, setActiveTab] = useState('items');
    const [user, setUser] = useState({});
    const [userStore, setUserStore] = useState(null);

    // Items state
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [itemLoading, setItemLoading] = useState(true);
    const [itemPagination, setItemPagination] = useState({ 
        currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 
    });
    const [itemFilters, setItemFilters] = useState({ search: '', status: '', item_type: '' });
    const [showItemModal, setShowItemModal] = useState(false);
    const [isEditingItem, setIsEditingItem] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [itemFormData, setItemFormData] = useState(initialItemFormState);
    const [expandedItemGroup, setExpandedItemGroup] = useState({});
    const [expandedItemType, setExpandedItemType] = useState({});

    // Phones state
    const [phones, setPhones] = useState([]);
    const [models, setModels] = useState([]);
    const [phoneLoading, setPhoneLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneFormData, setPhoneFormData] = useState(initialPhoneFormState);
    const [editingPhoneId, setEditingPhoneId] = useState(null);
    const [expandedBrand, setExpandedBrand] = useState({});
    const [expandedModel, setExpandedModel] = useState({});

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
        if (userData.storeId) {
            setUserStore(userData.storeId);
            setItemFormData(prev => ({ ...prev, storeId: userData.storeId._id || userData.storeId }));
            setPhoneFormData(prev => ({ ...prev, storeId: userData.storeId._id || userData.storeId }));
        }
    }, []);

    useEffect(() => {
        if (userStore) {
            fetchItemTypes();
            fetchModels();
            fetchItems();
            fetchPhones();
        }
    }, [userStore, itemPagination.currentPage, itemFilters.status, itemFilters.item_type]);

    useEffect(() => {
        const timeout = setTimeout(() => { 
            setItemPagination(prev => ({...prev, currentPage: 1}));
            if (userStore) fetchItems(); 
        }, 500);
        return () => clearTimeout(timeout);
    }, [itemFilters.search, userStore]);

    // Items functions
    const fetchItemTypes = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`http://localhost:9999/api/item_types/all`, { headers: { Authorization: `Bearer ${token}` } });
            setItemTypes(data.data || []);
        } catch (error) {}
    };

    const fetchModels = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`http://localhost:9999/api/phone_models/all`, { headers: { Authorization: `Bearer ${token}` } });
            setModels(data.data || []);
        } catch (error) {}
    };

    const fetchItems = async () => {
        if (!userStore) return;
        setItemLoading(true);
        try {
            const token = localStorage.getItem("token");
            const storeId = userStore._id || userStore;
            const params = new URLSearchParams({
                page: itemPagination.currentPage, limit: itemPagination.limit,
                search: itemFilters.search, status: itemFilters.status, 
                item_type: itemFilters.item_type, storeId 
            });
            const { data } = await axios.get(`http://localhost:9999/api/items?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            setItems(data.data || []);
            if (data.pagination) setItemPagination(data.pagination);
        } catch (error) { toast.error("Lỗi tải danh sách linh kiện"); } 
        finally { setItemLoading(false); }
    };

    const fetchPhones = async () => {
        if (!userStore) return;
        try {
            setPhoneLoading(true);
            const token = localStorage.getItem("token");
            const storeId = userStore._id || userStore;
            const { data } = await axios.get(`http://localhost:9999/api/phones?storeId=${storeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPhones(data.data || []);
        } catch (error) { toast.error("Lỗi tải danh sách máy"); } 
        finally { setPhoneLoading(false); }
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa linh kiện này?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`http://localhost:9999/api/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Xóa thành công");
                fetchItems();
            } catch (error) { toast.error("Xóa thất bại"); }
        }
    };

    const handleDeletePhone = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa máy này?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:9999/api/phones/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Xóa máy thành công!");
            fetchPhones();
        } catch (error) { toast.error("Lỗi khi xóa máy"); }
    };

    const handleGenerateItemQR = async (itemId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:9999/api/items/${itemId}/qr`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "image/png" });
            const qrUrl = window.URL.createObjectURL(blob);

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

    const handleGeneratePhoneQR = async (phoneId, serialCode) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:9999/api/phones/qrcode/${phoneId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: "image/png" });
            const qrUrl = window.URL.createObjectURL(blob);

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

    const handleOpenItemModal = (item = null) => {
        if (item) {
            setIsEditingItem(true); setEditingItemId(item._id);
            setItemFormData({
                name: item.name || '', serialCode: item.serialCode || '', item_type: item.item_type?._id || '',
                status: item.status || 'in_stock', storeId: userStore._id || userStore, 
                origin: item.origin || 'new', sourceDevice: item.sourceDevice || '', quality: item.quality || '', 
                warrantyPeriod: item.warrantyPeriod || (item.origin === 'new' ? 12 : 3),
                baseCost: item.baseCost || '', price: item.price || '',
                ram: item.ram || '', capacity: item.capacity || '', color: item.color || ''
            });
        } else {
            setIsEditingItem(false); setEditingItemId(null);
            setItemFormData({ ...initialItemFormState, storeId: userStore._id || userStore });
        }
        setShowItemModal(true);
    };

    const handleOpenPhoneModal = (phone = null) => {
        if (phone) {
            setIsEditingPhone(true);
            setEditingPhoneId(phone._id);
            setPhoneFormData({
                serialCode: phone.serialCode || '',
                phoneModelId: phone.phoneModelId?._id || phone.phoneModelId,
                storeId: userStore._id || userStore,
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
            setIsEditingPhone(false);
            setEditingPhoneId(null);
            setPhoneFormData({ ...initialPhoneFormState, storeId: userStore._id || userStore });
        }
        setShowPhoneModal(true);
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (isEditingItem) {
                await axios.put(`http://localhost:9999/api/items/update/${editingItemId}`, itemFormData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Cập nhật linh kiện thành công");
            } else {
                await axios.post("http://localhost:9999/api/items/create", itemFormData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Thêm linh kiện thành công");
            }
            setShowItemModal(false);
            fetchItems();
        } catch (error) { toast.error(error.response?.data?.message || "Lỗi khi lưu linh kiện"); }
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const submitData = new FormData();
            
            submitData.append("serialCode", phoneFormData.serialCode);
            submitData.append("phoneModelId", phoneFormData.phoneModelId);
            submitData.append("storeId", phoneFormData.storeId);
            submitData.append("colorName", phoneFormData.colorName);
            
            let finalCapacity = phoneFormData.capacity.trim().toUpperCase();
            if (finalCapacity && !finalCapacity.includes('GB') && !finalCapacity.includes('TB')) {
                finalCapacity += 'GB';
            }
            submitData.append("capacity", finalCapacity);
            
            submitData.append("grade", phoneFormData.grade);
            submitData.append("status", phoneFormData.status);
            submitData.append("importPrice", phoneFormData.importPrice);
            submitData.append("sellingPrice", phoneFormData.sellingPrice);
            submitData.append("warrantyPeriod", phoneFormData.warrantyPeriod);
            submitData.append("source", phoneFormData.source);
            submitData.append("notes", phoneFormData.notes);

            if (isEditingPhone && phoneFormData.retainedImages && phoneFormData.retainedImages.length > 0) {
                submitData.append("retainedImages", JSON.stringify(phoneFormData.retainedImages));
            }
            
            if (phoneFormData.imageFiles && phoneFormData.imageFiles.length > 0) {
                phoneFormData.imageFiles.forEach(file => submitData.append("images", file));
            }

            if (isEditingPhone) {
                await axios.put(`http://localhost:9999/api/phones/update/${editingPhoneId}`, submitData, { 
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
                });
                toast.success("Cập nhật thành công!");
            } else {
                await axios.post("http://localhost:9999/api/phones/create", submitData, { 
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
                });
                toast.success("Thêm máy thành công!");
            }
            setShowPhoneModal(false);
            fetchPhones();
        } catch (error) { toast.error(error.response?.data?.message || "Lưu thất bại!"); }
    };

    // Grouped data for items
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

        return Object.entries(result).sort(([groupA], [groupB]) => {
            if (groupA === "Khác") return 1;
            if (groupB === "Khác") return -1;
            return groupA.localeCompare(groupB);
        });
    }, [items]);

    // Grouped data for phones
    const groupedPhoneData = useMemo(() => {
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

    const toggleItemGroup = (grp) => setExpandedItemGroup(prev => ({ ...prev, [grp]: !prev[grp] }));
    const toggleItemType = (typ) => setExpandedItemType(prev => ({ ...prev, [typ]: !prev[typ] }));
    const toggleBrand = (brand) => setExpandedBrand(prev => ({ ...prev, [brand]: !prev[brand] }));
    const toggleModel = (model) => setExpandedModel(prev => ({ ...prev, [model]: !prev[model] }));
    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const selectedItemTypeObj = itemTypes.find(t => t._id === itemFormData.item_type);
    const selectedItemTypeName = selectedItemTypeObj ? selectedItemTypeObj.name.toLowerCase() : '';
    const isMainboard = selectedItemTypeName.includes('main');
    const isColorPart = selectedItemTypeName.includes('vỏ') || selectedItemTypeName.includes('kính') || selectedItemTypeName.includes('màn') || selectedItemTypeName.includes('camera') || selectedItemTypeName.includes('khay sim');

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Settings className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho</h1>
                </div>

            </div>

            {/* TABS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`flex items-center space-x-2 px-6 py-3 font-medium transition ${
                            activeTab === 'items' 
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Package size={20} />
                        <span>Linh kiện</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('phones')}
                        className={`flex items-center space-x-2 px-6 py-3 font-medium transition ${
                            activeTab === 'phones' 
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Smartphone size={20} />
                        <span>Điện thoại</span>
                    </button>
                </div>

                {/* ITEMS TAB */}
                {activeTab === 'items' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Kho Linh Kiện</h2>
                            <button onClick={() => handleOpenItemModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                                <Plus size={20} /> <span>Nhập linh kiện mới</span>
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-4 items-center mb-6">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Tìm theo tên, mã Serial..." 
                                    value={itemFilters.search} onChange={e => setItemFilters({...itemFilters, search: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <select value={itemFilters.item_type} onChange={e => setItemFilters({...itemFilters, item_type: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="">Tất cả phân loại</option>
                                {itemTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                            <select value={itemFilters.status} onChange={e => setItemFilters({...itemFilters, status: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="">Tất cả trạng thái</option>
                                <option value="in_stock">Đang tồn kho</option>
                                <option value="sold">Đã bán</option>
                                <option value="repairing">Đang lắp ráp</option>
                            </select>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto pb-4">
                            {itemLoading ? (
                                <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                            ) : sortedGroupedData.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy linh kiện nào.</div>
                            ) : (
                                sortedGroupedData.map(([groupName, typesObj]) => (
                                    <div key={groupName} className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center hover:bg-gray-100 transition" onClick={() => toggleItemGroup(groupName)}>
                                            <h2 className="text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
                                                <Tag className="text-blue-600" size={20}/> Nhóm: {groupName}
                                            </h2>
                                            {expandedItemGroup[groupName] ? <ChevronDown className="text-gray-500"/> : <ChevronRight className="text-gray-500"/>}
                                        </div>

                                        {expandedItemGroup[groupName] && (
                                            <div className="p-4 space-y-4 bg-gray-50/20">
                                                {Object.entries(typesObj).map(([typeName, itemsList]) => (
                                                    <div key={typeName} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                                        <div className="bg-blue-50/40 p-3 px-4 cursor-pointer flex justify-between items-center hover:bg-blue-100/50 transition" onClick={() => toggleItemType(typeName)}>
                                                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                                                {typeName} <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">Hiển thị {itemsList.length} món</span>
                                                            </h3>
                                                            {expandedItemType[typeName] ? <ChevronDown size={18} className="text-blue-500"/> : <ChevronRight size={18} className="text-blue-500"/>}
                                                        </div>

                                                        {expandedItemType[typeName] && (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-left text-sm whitespace-nowrap">
                                                                    <thead className="bg-gray-50 text-gray-500 border-y border-gray-100">
                                                                        <tr>
                                                                            <th className="p-3 font-semibold">Tên & Mã Serial</th>
                                                                            <th className="p-3 font-semibold text-center">QR</th>
                                                                            <th className="p-3 font-semibold">Tình trạng / Thuộc tính</th>
                                                                            <th className="p-3 font-semibold">Giá vốn / Bán</th>
                                                                            <th className="p-3 font-semibold text-center">Trạng thái</th>
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
                                                                                        onClick={() => handleGenerateItemQR(item._id)}
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
                                                                                    <div>
                                                                                        {item.status === 'in_stock' ? <span className="text-green-600 font-bold text-xs">Sẵn sàng</span> : 
                                                                                        item.status === 'sold' ? <span className="text-gray-500 font-bold text-xs">Đã bán/Ráp</span> : 
                                                                                        <span className="text-yellow-600 font-bold text-xs">{item.status}</span>}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-3 flex justify-end gap-2">
                                                                                    <button onClick={() => handleOpenItemModal(item)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><Edit size={16}/></button>
                                                                                    <button onClick={() => handleDeleteItem(item._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"><Trash2 size={16}/></button>
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

                        {/* Pagination */}
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                            <span className="text-sm text-gray-600">Trang <span className="font-bold">{itemPagination.currentPage}</span> / <span className="font-bold">{itemPagination.totalPages || 1}</span> | Tổng tìm thấy: <span className="font-bold">{itemPagination.totalCount}</span></span>
                            <div className="flex gap-2">
                                <button disabled={itemPagination.currentPage <= 1} onClick={() => setItemPagination(prev => ({...prev, currentPage: prev.currentPage - 1}))} className="px-4 py-2 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm">Trước</button>
                                <button disabled={itemPagination.currentPage >= itemPagination.totalPages} onClick={() => setItemPagination(prev => ({...prev, currentPage: prev.currentPage + 1}))} className="px-4 py-2 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm">Sau</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PHONES TAB */}
                {activeTab === 'phones' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Kho Điện Thoại</h2>
                            <button onClick={() => handleOpenPhoneModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                                <Plus size={20} /><span>Nhập Máy</span>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="relative w-full md:w-1/2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input type="text" placeholder="Tìm bằng Serial Code hoặc Tên máy..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        {/* Phones List */}
                        <div className="flex-1 overflow-y-auto pb-10">
                            {phoneLoading ? (
                                <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                            ) : Object.keys(groupedPhoneData).length === 0 ? (
                                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Cửa hàng này hiện chưa có điện thoại nào trong kho.</div>
                            ) : (
                                Object.entries(groupedPhoneData).map(([brandName, modelsObj]) => (
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
                                                                                            <Smartphone size={16} className="text-gray-300" />
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-3 font-mono font-bold text-gray-700">{phone.serialCode}</td>
                                                                                <td className="p-3">
                                                                                    <button 
                                                                                        onClick={() => handleGeneratePhoneQR(phone._id, phone.serialCode)}
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
                                                                                    <button onClick={() => handleOpenPhoneModal(phone)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><Edit size={16} /></button>
                                                                                    <button onClick={() => handleDeletePhone(phone._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"><Trash2 size={16} /></button>
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
                    </div>
                )}
            </div>

            {/* ITEM MODAL */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{isEditingItem ? 'Sửa thông tin linh kiện' : 'Nhập linh kiện vào kho'}</h2>
                            <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                        </div>

                        <form onSubmit={handleItemSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-blue-800 border-b pb-2 uppercase text-sm">1. Thông tin cơ bản</h3>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Tên linh kiện *</label>
                                        <input required type="text" value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Mã Serial *</label>
                                        <input required type="text" value={itemFormData.serialCode} onChange={e => setItemFormData({...itemFormData, serialCode: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Loại linh kiện *</label>
                                        <select required value={itemFormData.item_type} onChange={e => setItemFormData({...itemFormData, item_type: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
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
                                                            <input type="text" value={itemFormData.ram} onChange={e => setItemFormData({...itemFormData, ram: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: 6GB" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">ROM (Bộ nhớ)</label>
                                                            <input type="text" value={itemFormData.capacity} onChange={e => setItemFormData({...itemFormData, capacity: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: 128GB" />
                                                        </div>
                                                    </>
                                                )}
                                                {isColorPart && (
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-semibold mb-1">Màu sắc</label>
                                                        <input type="text" value={itemFormData.color} onChange={e => setItemFormData({...itemFormData, color: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: Đen Midnight..." />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Trạng thái</label>
                                        <select value={itemFormData.status} onChange={e => setItemFormData({...itemFormData, status: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
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
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="origin" value="new" checked={itemFormData.origin === 'new'} onChange={e => setItemFormData({...itemFormData, origin: e.target.value, warrantyPeriod: 12})} /> Mới (New)</label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="origin" value="disassembled" checked={itemFormData.origin === 'disassembled'} onChange={e => setItemFormData({...itemFormData, origin: e.target.value, warrantyPeriod: 3})} /> Bóc Máy (Zin)</label>
                                        </div>
                                    </div>

                                    {itemFormData.origin === 'disassembled' && (
                                        <div className="bg-purple-50/50 p-4 rounded-xl space-y-4 border border-purple-100 shadow-inner">
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1">Bóc từ thiết bị nào?</label>
                                                <input type="text" value={itemFormData.sourceDevice} onChange={e => setItemFormData({...itemFormData, sourceDevice: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" placeholder="VD: iPhone 14 Pro vỡ màn" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1">Chất lượng (Ngoại hình)</label>
                                                <input type="text" value={itemFormData.quality} onChange={e => setItemFormData({...itemFormData, quality: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" placeholder="VD: 98% - Zin nguyên bản" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Giá vốn</label>
                                            <input type="number" value={itemFormData.baseCost} onChange={e => setItemFormData({...itemFormData, baseCost: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Giá bán</label>
                                            <input type="number" value={itemFormData.price} onChange={e => setItemFormData({...itemFormData, price: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Bảo hành (tháng)</label>
                                        <input type="number" value={itemFormData.warrantyPeriod} onChange={e => setItemFormData({...itemFormData, warrantyPeriod: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button type="button" onClick={() => setShowItemModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold border border-gray-300 rounded-xl hover:bg-gray-100 transition">Hủy bỏ</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition">{isEditingItem ? 'Lưu Cập Nhật' : 'Nhập Vào Kho'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PHONE MODAL */}
            {showPhoneModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between p-5 border-b bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{isEditingPhone ? 'Cập nhật Thông tin Máy' : 'Nhập Máy Mới Vào Kho'}</h2>
                            <button onClick={() => setShowPhoneModal(false)} className="text-gray-400 hover:text-red-500 transition bg-white p-1 rounded-full"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handlePhoneSubmit} className="overflow-y-auto p-6 space-y-6 max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Dòng máy (Model) <span className="text-red-500">*</span></label>
                                    <select value={phoneFormData.phoneModelId} onChange={e => setPhoneFormData({...phoneFormData, phoneModelId: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="">-- Chọn Model --</option>
                                        {models.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình ảnh thực tế của máy (Chụp tình trạng xước xát nếu có)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative min-h-[100px]">
                                        <input type="file" multiple accept="image/*" onChange={e => {
                                            const files = Array.from(e.target.files);
                                            if (files.length > 0) {
                                                const previews = files.map(file => URL.createObjectURL(file));
                                                setPhoneFormData(prev => ({
                                                    ...prev,
                                                    imageFiles: files,
                                                    previewImages: previews,
                                                    retainedImages: [] 
                                                }));
                                            }
                                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="flex flex-wrap gap-3 justify-center mb-2 pointer-events-none">
                                            {phoneFormData.previewImages?.length > 0 ? (
                                                phoneFormData.previewImages.map((src, idx) => (
                                                    <img key={idx} src={src} alt="preview" className="h-16 w-16 object-cover rounded-md shadow-sm border border-gray-200" />
                                                ))
                                            ) : (
                                                <Smartphone className="h-10 w-10 text-gray-300" />
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium pointer-events-none">
                                            {phoneFormData.previewImages?.length > 0 ? 'Nhấn để chọn lại ảnh khác' : 'Nhấn vào đây để chọn ảnh (Có thể chọn nhiều ảnh)'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Serial Code <span className="text-red-500">*</span></label>
                                    <input type="text" value={phoneFormData.serialCode} onChange={e => setPhoneFormData({...phoneFormData, serialCode: e.target.value.toUpperCase()})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 font-mono" placeholder="Nhập mã serial"/>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nguồn gốc</label>
                                    <select value={phoneFormData.source} onChange={e => setPhoneFormData({...phoneFormData, source: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="supplier">Nhập từ nhà cung cấp</option>
                                        <option value="customer_trade_in">Khách thu cũ đổi mới</option>
                                        <option value="assembled">Máy tự ráp</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Dung lượng (ROM) <span className="text-red-500">*</span></label>
                                    <input type="text" value={phoneFormData.capacity} onChange={e => setPhoneFormData({...phoneFormData, capacity: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" placeholder="Chỉ cần nhập số, VD: 128 hoặc 256"/>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Màu sắc <span className="text-red-500">*</span></label>
                                        <input type="text" value={phoneFormData.colorName} onChange={e => setPhoneFormData({...phoneFormData, colorName: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" placeholder="VD: Titan Tự Nhiên"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình thức <span className="text-red-500">*</span></label>
                                        <select value={phoneFormData.grade} onChange={e => setPhoneFormData({...phoneFormData, grade: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                            {['Mới', 'Đã kích hoạt', 'Cũ Đẹp', 'Trầy Xước', 'Xước Cấn'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá vốn (VNĐ) <span className="text-red-500">*</span></label>
                                    <input type="number" value={phoneFormData.importPrice} onChange={e => setPhoneFormData({...phoneFormData, importPrice: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                                        <input type="number" value={phoneFormData.sellingPrice} onChange={e => setPhoneFormData({...phoneFormData, sellingPrice: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Bảo hành (Tháng)</label>
                                        <input type="number" value={phoneFormData.warrantyPeriod} onChange={e => setPhoneFormData({...phoneFormData, warrantyPeriod: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button type="button" onClick={() => setShowPhoneModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold border border-gray-300 rounded-xl hover:bg-gray-100 transition">Hủy bỏ</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition">{isEditingPhone ? 'Lưu Cập Nhật' : 'Nhập Vào Kho'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}