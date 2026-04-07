import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Package, Search, X, Settings, ChevronDown, Tag, QrCode, Smartphone, Eye, ArrowUpDown, Image as ImageIcon } from "lucide-react";

// IMPORT TỪ FILE API MỚI
import { 
    fetchItemTypesApi, fetchModelsApi, fetchItemsApi, fetchPhonesApi, 
    deleteItemApi, deletePhoneApi, submitItemApi, submitPhoneApi, getQrBlobApi 
} from "../../api/manager/inventory";

const BASE_CODES = {
    "MB": "Mainboard", "SCR": "Màn hình", "BAT": "Pin", "HSG": "Vỏ máy",
    "CAM-R": "Camera Sau", "CAM-F": "Camera Trước", "CPT": "Cụm chân sạc",
    "SPK": "Loa ngoài", "FGL": "Mặt kính", "BGL": "Kính lưng", "OTH": "Khác"
};

const getBaseCodeFromItemTypeCode = (code) => {
    if (!code) return 'OTH';
    const parts = code.split('-');
    if (parts[0] === 'CAM') return `CAM-${parts[1]}`;
    if (BASE_CODES[parts[0]]) return parts[0];
    if (BASE_CODES[code]) return code;
    return 'OTH';
};

const initialItemFormState = {
    name: '', serialCode: '', item_type: '', status: 'in_stock', storeId: '',
    origin: 'new', sourceDevice: '', quality: '', warrantyPeriod: 12, baseCost: '', price: '',
    ram: '', capacity: '', color: ''
};

const initialPhoneFormState = {
    serialCode: '', phoneModelId: '', storeId: '', colorName: '', capacity: '',
    grade: 'Mới', status: 'in_stock', importPrice: 0, sellingPrice: 0,
    warrantyPeriod: 12, source: 'supplier', notes: '',
    imageFiles: [], previewImages: [], retainedImages: []
};

// ==============================================================
// 🌟 COMPONENT PHÂN TRANG THÔNG MINH DẠNG SỐ (1, 2, 3, ..., 100)
// ==============================================================
const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }

    return (
        <div className="flex gap-1.5 items-center">
            <button 
                disabled={currentPage <= 1} 
                onClick={() => onPageChange(currentPage - 1)} 
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm"
            >
                Trước
            </button>
            {pages.map((p, i) => (
                <button
                    key={i}
                    disabled={p === '...'}
                    onClick={() => p !== '...' && onPageChange(p)}
                    className={`px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm ${
                        p === currentPage 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : p === '...' 
                                ? 'bg-transparent text-gray-500 border-transparent shadow-none cursor-default px-1' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {p}
                </button>
            ))}
            <button 
                disabled={currentPage >= totalPages} 
                onClick={() => onPageChange(currentPage + 1)} 
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm"
            >
                Sau
            </button>
        </div>
    );
};

export default function ManagerInventory() {
    const [activeTab, setActiveTab] = useState('items');
    const [user, setUser] = useState({});
    const [userStore, setUserStore] = useState(null);
    const groupsPerPage = 10; 

    // ==============================================================
    // ITEMS STATE
    // ==============================================================
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [itemLoading, setItemLoading] = useState(true);
    const [itemFilters, setItemFilters] = useState({ search: '', status: '', item_type: '' });
    const [itemCurrentPage, setItemCurrentPage] = useState(1);
    
    const [showItemModal, setShowItemModal] = useState(false);
    const [isEditingItem, setIsEditingItem] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [itemFormData, setItemFormData] = useState(initialItemFormState);
    const [selectedBaseCategory, setSelectedBaseCategory] = useState('');

    const [showItemDetailModal, setShowItemDetailModal] = useState(false);
    const [selectedItemTypeGroup, setSelectedItemTypeGroup] = useState(null);
    const [detailItemSearch, setDetailItemSearch] = useState('');
    const [detailItemSortPrice, setDetailItemSortPrice] = useState(''); 
    const [detailItemCurrentPage, setDetailItemCurrentPage] = useState(1);

    // ==============================================================
    // PHONES STATE
    // ==============================================================
    const [phones, setPhones] = useState([]);
    const [models, setModels] = useState([]);
    const [phoneLoading, setPhoneLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [phoneCurrentPage, setPhoneCurrentPage] = useState(1);

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneFormData, setPhoneFormData] = useState(initialPhoneFormState);
    const [editingPhoneId, setEditingPhoneId] = useState(null);
    const [selectedFormBrand, setSelectedFormBrand] = useState('');

    const [showPhoneDetailModal, setShowPhoneDetailModal] = useState(false);
    const [selectedPhoneModelGroup, setSelectedPhoneModelGroup] = useState(null);
    const [detailPhoneSearch, setDetailPhoneSearch] = useState('');
    const [detailPhoneSortPrice, setDetailPhoneSortPrice] = useState(''); 
    const [detailPhoneCurrentPage, setDetailPhoneCurrentPage] = useState(1);

    const detailItemsPerPage = 5; 

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
        if (userData.storeId) {
            const storeIdValue = userData.storeId._id || userData.storeId;
            setUserStore(storeIdValue);
            setItemFormData(prev => ({ ...prev, storeId: storeIdValue }));
            setPhoneFormData(prev => ({ ...prev, storeId: storeIdValue }));
        }
    }, []);

    useEffect(() => {
        if (userStore) {
            loadInitData();
            loadItems();
            loadPhones();
        }
    }, [userStore, itemFilters.status, itemFilters.item_type]);

    useEffect(() => {
        const timeout = setTimeout(() => { 
            setItemCurrentPage(1);
            if (userStore) loadItems(); 
        }, 500);
        return () => clearTimeout(timeout);
    }, [itemFilters.search, userStore]);

    useEffect(() => { setPhoneCurrentPage(1); }, [searchKeyword]);
    useEffect(() => { setDetailItemCurrentPage(1); }, [detailItemSearch, detailItemSortPrice]);
    useEffect(() => { setDetailPhoneCurrentPage(1); }, [detailPhoneSearch, detailPhoneSortPrice]);

    // ==============================================================
    // DATA FETCHING
    // ==============================================================
    const loadInitData = async () => {
        const types = await fetchItemTypesApi();
        const modelsData = await fetchModelsApi();
        setItemTypes(types);
        setModels(modelsData);
    };

    const loadItems = async () => {
        setItemLoading(true);
        const data = await fetchItemsApi({
            limit: 9999,
            search: itemFilters.search, status: itemFilters.status, 
            item_type: itemFilters.item_type, storeId: userStore 
        });
        if (data) setItems(data.data || []);
        setItemLoading(false);
    };

    const loadPhones = async () => {
        setPhoneLoading(true);
        const data = await fetchPhonesApi(userStore);
        setPhones(data);
        setPhoneLoading(false);
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa linh kiện này?")) {
            const success = await deleteItemApi(id);
            if (success) loadItems();
        }
    };

    const handleDeletePhone = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa máy này?")) {
            const success = await deletePhoneApi(id);
            if (success) loadPhones();
        }
    };

    const handlePrintQR = async (type, id) => {
        const blob = await getQrBlobApi(type, id);
        if (!blob) return;

        const qrUrl = window.URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
        iframe.setAttribute("aria-hidden", "true");
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
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
              <style>
                @page { margin: 0; }
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; }
                body { display: flex; align-items: center; justify-content: center; }
                img { width: 180px; height: 180px; object-fit: contain; }
              </style>
            </head>
            <body><img id="qr-print-image" src="${qrUrl}" alt="QR code" /></body>
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
        }
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        const success = await submitItemApi(isEditingItem, editingItemId, itemFormData);
        if (success) {
            setShowItemModal(false);
            loadItems();
        }
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        const submitData = new FormData();
        submitData.append("serialCode", phoneFormData.serialCode); submitData.append("phoneModelId", phoneFormData.phoneModelId);
        submitData.append("storeId", phoneFormData.storeId); submitData.append("colorName", phoneFormData.colorName);
        let finalCapacity = phoneFormData.capacity.trim().toUpperCase();
        if (finalCapacity && !finalCapacity.includes('GB') && !finalCapacity.includes('TB')) finalCapacity += 'GB';
        submitData.append("capacity", finalCapacity); submitData.append("grade", phoneFormData.grade);
        submitData.append("status", phoneFormData.status); submitData.append("importPrice", phoneFormData.importPrice);
        submitData.append("sellingPrice", phoneFormData.sellingPrice); submitData.append("warrantyPeriod", phoneFormData.warrantyPeriod);
        submitData.append("source", phoneFormData.source); submitData.append("notes", phoneFormData.notes);
        if (isEditingPhone && phoneFormData.retainedImages && phoneFormData.retainedImages.length > 0) submitData.append("retainedImages", JSON.stringify(phoneFormData.retainedImages));
        if (phoneFormData.imageFiles && phoneFormData.imageFiles.length > 0) phoneFormData.imageFiles.forEach(file => submitData.append("images", file));

        const success = await submitPhoneApi(isEditingPhone, editingPhoneId, submitData);
        if (success) {
            setShowPhoneModal(false);
            loadPhones();
        }
    };

    // ==============================================================
    // MODAL THÊM / SỬA HANDLERS
    // ==============================================================
    const handleOpenItemModal = (item = null) => {
        if (item) {
            setIsEditingItem(true); setEditingItemId(item._id);
            const typeObj = itemTypes.find(t => t._id === (item.item_type?._id || item.item_type));
            if (typeObj) setSelectedBaseCategory(getBaseCodeFromItemTypeCode(typeObj.code));
            else setSelectedBaseCategory('');

            setItemFormData({
                name: item.name || '', serialCode: item.serialCode || '', item_type: item.item_type?._id || '',
                status: item.status || 'in_stock', storeId: userStore, origin: item.origin || 'new', sourceDevice: item.sourceDevice || '', 
                quality: item.quality || '', warrantyPeriod: item.warrantyPeriod || (item.origin === 'new' ? 12 : 3),
                baseCost: item.baseCost || '', price: item.price || '', ram: item.ram || '', capacity: item.capacity || '', color: item.color || ''
            });
        } else {
            setIsEditingItem(false); setEditingItemId(null);
            setSelectedBaseCategory('');
            setItemFormData({ ...initialItemFormState, storeId: userStore });
        }
        setShowItemModal(true);
    };

    const handleOpenPhoneModal = (phone = null) => {
        if (phone) {
            setIsEditingPhone(true); setEditingPhoneId(phone._id);
            const modelObj = models.find(m => m._id === (phone.phoneModelId?._id || phone.phoneModelId));
            if (modelObj) setSelectedFormBrand(modelObj.brand?.name || modelObj.brand || 'Hãng khác');
            else setSelectedFormBrand('');

            setPhoneFormData({
                serialCode: phone.serialCode || '', phoneModelId: phone.phoneModelId?._id || phone.phoneModelId,
                storeId: userStore, colorName: phone.colorName || '', capacity: phone.capacity || '', grade: phone.grade || 'Mới',
                status: phone.status || 'in_stock', importPrice: phone.importPrice || 0, sellingPrice: phone.sellingPrice || 0,
                warrantyPeriod: phone.warrantyPeriod || 12, source: phone.source || 'supplier', notes: phone.notes || '',
                imageFiles: [], previewImages: phone.specificImages || [], retainedImages: phone.specificImages || []
            });
        } else {
            setIsEditingPhone(false); setEditingPhoneId(null);
            setSelectedFormBrand('');
            setPhoneFormData({ ...initialPhoneFormState, storeId: userStore });
        }
        setShowPhoneModal(true);
    };

    const handleGenerateItemSerial = () => {
        if (!itemFormData.item_type) return toast.warning("Vui lòng chọn Phân loại linh kiện trước!");
        const selectedType = itemTypes.find(t => t._id === itemFormData.item_type);
        if (!selectedType) return;
        const date = new Date();
        const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(2)}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        setItemFormData({ ...itemFormData, serialCode: `${selectedType.code}-${ddmmyyyy}-${randomStr}` });
    };

    const handleGeneratePhoneSerial = () => {
        if (!phoneFormData.phoneModelId) return toast.warning("Vui lòng chọn Dòng máy trước!");
        const selectedModel = models.find(m => m._id === phoneFormData.phoneModelId);
        if (!selectedModel) return;

        let prefix = selectedModel.name.toUpperCase().replace(/\s+/g, '');
        prefix = prefix.replace('IPHONE', 'IP').replace('SAMSUNGGALAXY', 'SS').replace('XIAOMI', 'MI');
        if (prefix.length > 8) prefix = prefix.substring(0, 8);

        const date = new Date();
        const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        setPhoneFormData({ ...phoneFormData, serialCode: `${prefix}-${ddmmyyyy}-${randomStr}` });
    };

    // ==============================================================
    // COMPUTED DATA CHO BẢNG ITEM
    // ==============================================================
    const filteredItemTypesForModal = useMemo(() => {
        if (!selectedBaseCategory) return []; 
        return itemTypes.filter(t => getBaseCodeFromItemTypeCode(t.code) === selectedBaseCategory);
    }, [itemTypes, selectedBaseCategory]);

    const groupedItemData = useMemo(() => {
        const result = {};
        items.forEach(item => {
            if (item.status === 'sold' || item.status === 'assembled_and_sold' || item.status === 'consumed') return;
            const typeName = item.item_type?.name || 'Loại không xác định';
            if (!result[typeName]) result[typeName] = [];
            result[typeName].push(item);
        });
        return Object.entries(result);
    }, [items]);

    const paginatedItemGroups = useMemo(() => {
        const totalGroups = groupedItemData.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        const startIndex = (itemCurrentPage - 1) * groupsPerPage;
        const currentGroups = groupedItemData.slice(startIndex, startIndex + groupsPerPage);

        let totalItemsCount = 0;
        groupedItemData.forEach(([_, list]) => { totalItemsCount += list.length });

        return { groups: currentGroups, totalPages: totalPages || 1, totalItemsCount };
    }, [groupedItemData, itemCurrentPage, groupsPerPage]);

    const detailItemsProcessed = useMemo(() => {
        if (!selectedItemTypeGroup) return { items: [], totalPages: 1, totalCount: 0 };
        const foundGroup = groupedItemData.find(([name]) => name === selectedItemTypeGroup);
        let list = foundGroup ? foundGroup[1] : [];

        if (detailItemSearch) {
            const keyword = detailItemSearch.toLowerCase();
            list = list.filter(item => (item.name || '').toLowerCase().includes(keyword) || (item.serialCode || '').toLowerCase().includes(keyword));
        }
        if (detailItemSortPrice === 'asc') list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (detailItemSortPrice === 'desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));

        const totalPages = Math.ceil(list.length / detailItemsPerPage);
        const paginatedList = list.slice((detailItemCurrentPage - 1) * detailItemsPerPage, detailItemCurrentPage * detailItemsPerPage);
        return { items: paginatedList, totalPages: totalPages || 1, totalCount: list.length };
    }, [groupedItemData, selectedItemTypeGroup, detailItemSearch, detailItemSortPrice, detailItemCurrentPage]);

    const openItemDetailModal = (typeName) => {
        setSelectedItemTypeGroup(typeName); setDetailItemSearch(''); setDetailItemSortPrice(''); setDetailItemCurrentPage(1);
        setShowItemDetailModal(true);
    };

    // ==============================================================
    // COMPUTED DATA CHO BẢNG PHONE
    // ==============================================================
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

    const groupedPhoneData = useMemo(() => {
        const result = {};
        const safeKeyword = searchKeyword.toLowerCase();
        const filtered = phones.filter(p => {
            if (p.status === 'sold') return false; 
            const serialMatch = (p.serialCode || '').toLowerCase().includes(safeKeyword);
            const nameMatch = (p.phoneModelId?.name || '').toLowerCase().includes(safeKeyword);
            return serialMatch || nameMatch;
        });

        filtered.forEach(phone => {
            const modelName = phone.phoneModelId?.name || 'Model không xác định';
            if (!result[modelName]) result[modelName] = [];
            result[modelName].push(phone);
        });
        return Object.entries(result);
    }, [phones, searchKeyword]);

    const paginatedPhoneGroups = useMemo(() => {
        const totalGroups = groupedPhoneData.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        const startIndex = (phoneCurrentPage - 1) * groupsPerPage;
        const currentGroups = groupedPhoneData.slice(startIndex, startIndex + groupsPerPage);

        let totalItemsCount = 0;
        groupedPhoneData.forEach(([_, list]) => { totalItemsCount += list.length });

        return { groups: currentGroups, totalPages: totalPages || 1, totalItemsCount };
    }, [groupedPhoneData, phoneCurrentPage, groupsPerPage]);

    const detailPhonesProcessed = useMemo(() => {
        if (!selectedPhoneModelGroup) return { items: [], totalPages: 1, totalCount: 0 };
        const foundGroup = groupedPhoneData.find(([name]) => name === selectedPhoneModelGroup);
        let list = foundGroup ? foundGroup[1] : [];

        if (detailPhoneSearch) {
            const keyword = detailPhoneSearch.toLowerCase();
            list = list.filter(item => (item.phoneModelId?.name || '').toLowerCase().includes(keyword) || (item.serialCode || '').toLowerCase().includes(keyword));
        }
        if (detailPhoneSortPrice === 'asc') list = [...list].sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
        else if (detailPhoneSortPrice === 'desc') list = [...list].sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));

        const totalPages = Math.ceil(list.length / detailItemsPerPage);
        const paginatedList = list.slice((detailPhoneCurrentPage - 1) * detailItemsPerPage, detailPhoneCurrentPage * detailItemsPerPage);
        return { items: paginatedList, totalPages: totalPages || 1, totalCount: list.length };
    }, [groupedPhoneData, selectedPhoneModelGroup, detailPhoneSearch, detailPhoneSortPrice, detailPhoneCurrentPage]);

    const openPhoneDetailModal = (modelName) => {
        setSelectedPhoneModelGroup(modelName); setDetailPhoneSearch(''); setDetailPhoneSortPrice(''); setDetailPhoneCurrentPage(1);
        setShowPhoneDetailModal(true);
    };

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
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho Cửa Hàng</h1>
                </div>
            </div>

            {/* TABS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('items')} className={`flex items-center space-x-2 px-6 py-3 font-medium transition ${activeTab === 'items' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Package size={20} /><span>Linh kiện</span>
                    </button>
                    <button onClick={() => setActiveTab('phones')} className={`flex items-center space-x-2 px-6 py-3 font-medium transition ${activeTab === 'phones' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Smartphone size={20} /><span>Điện thoại</span>
                    </button>
                </div>

                {/* ============================================================== */}
                {/* ITEMS TAB */}
                {/* ============================================================== */}
                {activeTab === 'items' && (
                    <div className="p-6 flex flex-col h-[calc(100vh-200px)]">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h2 className="text-lg font-semibold text-gray-800">Kho Linh Kiện</h2>
                            <button onClick={() => handleOpenItemModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                                <Plus size={20} /> <span>Nhập linh kiện mới</span>
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-4 items-center mb-6 shrink-0 border border-gray-100">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Tìm theo tên nhóm (Màn hình IP13)..." 
                                    value={itemFilters.search} onChange={e => setItemFilters({...itemFilters, search: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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

                        {/* 🌟 Items List: BẢNG TỔNG HỢP */}
                        <div className="flex-1 overflow-y-auto pb-4">
                            {itemLoading ? (
                                <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                            ) : paginatedItemGroups.groups.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy linh kiện nào.</div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold w-[50%]">Loại Linh Kiện / Máy</th>
                                                <th className="px-6 py-4 font-semibold text-center w-[25%]">Số lượng trong kho</th>
                                                <th className="px-6 py-4 font-semibold text-center w-[25%]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedItemGroups.groups.map(([typeName, itemsList]) => {
                                                const inStockCount = itemsList.filter(i => i.status === 'in_stock').length;
                                                return (
                                                    <tr key={typeName} className="hover:bg-blue-50/30 transition">
                                                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3 text-base">
                                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Package size={20} /></div>
                                                            {typeName}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${inStockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {inStockCount} Sẵn sàng
                                                            </span>
                                                            <span className="text-gray-400 text-xs ml-2 font-medium">/ {itemsList.length} Tổng</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button onClick={() => openItemDetailModal(typeName)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200">
                                                                <Eye size={18} /> <span className="font-semibold text-sm">Xem chi tiết</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 🌟 PHÂN TRANG THÔNG MINH CHO ITEM (MAIN) */}
                        {!itemLoading && paginatedItemGroups.totalItemsCount > 0 && (
                            <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span>Đang xem trang <strong className="text-blue-600">{itemCurrentPage}</strong> / {paginatedItemGroups.totalPages}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedItemGroups.totalItemsCount}</strong> linh kiện</span>
                                </div>
                                <CustomPagination 
                                    currentPage={itemCurrentPage} 
                                    totalPages={paginatedItemGroups.totalPages} 
                                    onPageChange={setItemCurrentPage} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================================== */}
                {/* PHONES TAB */}
                {/* ============================================================== */}
                {activeTab === 'phones' && (
                    <div className="p-6 flex flex-col h-[calc(100vh-200px)]">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h2 className="text-lg font-semibold text-gray-800">Kho Điện Thoại</h2>
                            <button onClick={() => handleOpenPhoneModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                                <Plus size={20} /><span>Nhập Máy Mới</span>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 shrink-0 border border-gray-100">
                            <div className="relative w-full md:w-1/2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input type="text" placeholder="Tìm tên dòng máy (VD: iPhone 13)..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 bg-white rounded-lg outline-none focus:border-blue-500 text-sm" />
                            </div>
                        </div>

                        {/* 🌟 Phones List: BẢNG TỔNG HỢP */}
                        <div className="flex-1 overflow-y-auto pb-4">
                            {phoneLoading ? (
                                <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                            ) : paginatedPhoneGroups.groups.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy dòng máy nào phù hợp.</div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold w-[50%]">Dòng Máy (Model)</th>
                                                <th className="px-6 py-4 font-semibold text-center w-[25%]">Số lượng trong kho</th>
                                                <th className="px-6 py-4 font-semibold text-center w-[25%]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedPhoneGroups.groups.map(([modelName, phonesList]) => {
                                                const inStockCount = phonesList.filter(p => p.status === 'in_stock').length;
                                                return (
                                                    <tr key={modelName} className="hover:bg-blue-50/30 transition">
                                                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3 text-base">
                                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Smartphone size={20} /></div>
                                                            {modelName}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${inStockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {inStockCount} Sẵn sàng
                                                            </span>
                                                            <span className="text-gray-400 text-xs ml-2 font-medium">/ {phonesList.length} Tổng</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button onClick={() => openPhoneDetailModal(modelName)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200">
                                                                <Eye size={18} /> <span className="font-semibold text-sm">Xem chi tiết</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 🌟 PHÂN TRANG THÔNG MINH CHO PHONE (MAIN) */}
                        {!phoneLoading && paginatedPhoneGroups.totalItemsCount > 0 && (
                            <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span>Đang xem trang <strong className="text-blue-600">{phoneCurrentPage}</strong> / {paginatedPhoneGroups.totalPages}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedPhoneGroups.totalItemsCount}</strong> chiếc</span>
                                </div>
                                <CustomPagination 
                                    currentPage={phoneCurrentPage} 
                                    totalPages={paginatedPhoneGroups.totalPages} 
                                    onPageChange={setPhoneCurrentPage} 
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ============================================================== */}
            {/* 🌟 MODAL CHI TIẾT TỪNG BẢNG */}
            {/* ============================================================== */}

            {/* MODAL CHI TIẾT LINH KIỆN */}
            {showItemDetailModal && selectedItemTypeGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2"><Package className="text-blue-600" /> Chi tiết: {selectedItemTypeGroup}</h2>
                            <button onClick={() => setShowItemDetailModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border border-gray-200 transition"><X size={24}/></button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-4 shrink-0">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Tìm theo Tên hoặc mã Serial..." value={detailItemSearch} onChange={e => setDetailItemSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"/>
                            </div>
                            <div className="relative min-w-[200px]">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <select value={detailItemSortPrice} onChange={e => setDetailItemSortPrice(e.target.value)} className="appearance-none w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
                                    <option value="">Sắp xếp Giá mặc định</option>
                                    <option value="asc">Giá: Thấp đến Cao</option>
                                    <option value="desc">Giá: Cao đến Thấp</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div className="p-0 overflow-auto flex-1 bg-white">
                            <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[11px] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-[30%]">Tên & Mã Serial</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[8%]">QR</th>
                                        <th className="px-4 py-3 font-semibold w-[22%]">Tình trạng / Thuộc tính</th>
                                        <th className="px-4 py-3 font-semibold w-[15%]">Giá vốn / Bán</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[15%]">Trạng thái</th>
                                        <th className="px-4 py-3 font-semibold text-right w-[10%]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailItemsProcessed.items.map(item => (
                                        <tr key={item._id} className="hover:bg-blue-50/40 transition">
                                            <td className="px-4 py-4 truncate">
                                                <div className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border truncate max-w-full">{item.serialCode}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center"><button onClick={() => handlePrintQR('item', item._id)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><QrCode size={18} /></button></td>
                                            <td className="px-4 py-4 text-xs text-gray-600 truncate">
                                                <div className="mb-1.5">{item.origin === 'disassembled' ? <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Bóc máy</span> : <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Hàng mới</span>}</div>
                                                {(item.ram || item.capacity || item.color) ? (<div className="flex gap-2 truncate">{item.ram && <span>RAM: <strong>{item.ram}</strong></span>}{item.capacity && <span>ROM: <strong>{item.capacity}</strong></span>}{item.color && <span>Màu: <strong>{item.color}</strong></span>}</div>) : <span className="text-gray-400 italic">Tiêu chuẩn</span>}
                                            </td>
                                            <td className="px-4 py-4 truncate">
                                                <div className="text-xs text-gray-400 line-through mb-0.5 truncate">{formatMoney(item.baseCost)}</div>
                                                <div className="font-bold text-red-600 truncate text-sm">{formatMoney(item.price)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center truncate">
                                                {item.status === 'in_stock' ? <span className="text-green-600 font-bold text-xs">Sẵn sàng</span> : item.status === 'sold' ? <span className="text-gray-500 font-bold text-xs">Đã xuất</span> : <span className="text-yellow-600 font-bold text-xs">{item.status}</span>}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenItemModal(item)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg border border-transparent hover:border-blue-200"><Edit size={16}/></button>
                                                
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {detailItemsProcessed.items.length === 0 && (<tr><td colSpan="6" className="text-center py-10 text-gray-500 italic">Không tìm thấy linh kiện khớp bộ lọc.</td></tr>)}
                                </tbody>
                            </table>
                        </div>

                        {/* 🌟 PHÂN TRANG THÔNG MINH CHO CHI TIẾT ITEM */}
                        {detailItemsProcessed.totalCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <span className="text-sm text-gray-600">Trang <strong className="text-blue-600">{detailItemCurrentPage}</strong> / {detailItemsProcessed.totalPages} (Tổng: {detailItemsProcessed.totalCount})</span>
                                <CustomPagination 
                                    currentPage={detailItemCurrentPage} 
                                    totalPages={detailItemsProcessed.totalPages} 
                                    onPageChange={setDetailItemCurrentPage} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT ĐIỆN THOẠI */}
            {showPhoneDetailModal && selectedPhoneModelGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2"><Smartphone className="text-blue-600" /> Chi tiết: {selectedPhoneModelGroup}</h2>
                            <button onClick={() => setShowPhoneDetailModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border border-gray-200 transition"><X size={24}/></button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-4 shrink-0">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Tìm theo Mã Serial Code..." value={detailPhoneSearch} onChange={e => setDetailPhoneSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"/>
                            </div>
                            <div className="relative min-w-[200px]">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <select value={detailPhoneSortPrice} onChange={e => setDetailPhoneSortPrice(e.target.value)} className="appearance-none w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
                                    <option value="">Sắp xếp Giá Bán</option>
                                    <option value="asc">Giá bán: Thấp đến Cao</option>
                                    <option value="desc">Giá bán: Cao đến Thấp</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div className="p-0 overflow-auto flex-1 bg-white">
                            <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[11px] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-[25%]">Ảnh & Serial</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[8%]">QR</th>
                                        <th className="px-4 py-3 font-semibold w-[22%]">Màu / ROM / Hình thức</th>
                                        <th className="px-4 py-3 font-semibold w-[18%]">Giá vốn / Bán</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[17%]">Trạng thái</th>
                                        <th className="px-4 py-3 font-semibold text-right w-[10%]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailPhonesProcessed.items.map(phone => (
                                        <tr key={phone._id} className="hover:bg-blue-50/40 transition">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded border border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                                                        {phone.specificImages?.length > 0 ? <img src={phone.specificImages[0]} alt="img" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-300"/>}
                                                    </div>
                                                    <div className="truncate">
                                                        <div className="font-bold text-gray-800 text-sm truncate" title={phone.phoneModelId?.name}>{phone.phoneModelId?.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border truncate max-w-full">{phone.serialCode}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center"><button onClick={() => handlePrintQR('phone', phone._id)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><QrCode size={18} /></button></td>
                                            <td className="px-4 py-4 text-xs text-gray-600 truncate">
                                                <div className="mb-1.5"><span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">{phone.grade}</span></div>
                                                <div className="flex gap-2 truncate"><span>Màu: <strong>{phone.colorName}</strong></span><span>ROM: <strong>{phone.capacity}</strong></span></div>
                                            </td>
                                            <td className="px-4 py-4 truncate">
                                                <div className="text-xs text-gray-400 line-through mb-0.5 truncate">{formatMoney(phone.importPrice)}</div>
                                                <div className="font-bold text-red-600 truncate text-sm">{formatMoney(phone.sellingPrice)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center truncate">
                                                {phone.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Sẵn sàng</span> : 
                                                 phone.status === 'sold' ? <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Đã xuất</span> : 
                                                 <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">{phone.status}</span>}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenPhoneModal(phone)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg border border-transparent hover:border-blue-200"><Edit size={16}/></button>
                                                    <button onClick={() => handleDeletePhone(phone._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg border border-transparent hover:border-red-200"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {detailPhonesProcessed.items.length === 0 && (<tr><td colSpan="6" className="text-center py-10 text-gray-500 italic">Không tìm thấy máy khớp bộ lọc.</td></tr>)}
                                </tbody>
                            </table>
                        </div>

                        {/* 🌟 PHÂN TRANG THÔNG MINH CHO CHI TIẾT PHONE */}
                        {detailPhonesProcessed.totalCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <span className="text-sm text-gray-600">Trang <strong className="text-blue-600">{detailPhoneCurrentPage}</strong> / {detailPhonesProcessed.totalPages} (Tổng: {detailPhonesProcessed.totalCount})</span>
                                <CustomPagination 
                                    currentPage={detailPhoneCurrentPage} 
                                    totalPages={detailPhonesProcessed.totalPages} 
                                    onPageChange={setDetailPhoneCurrentPage} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* MODALS NHẬP FORM ĐÃ ĐƯỢC CHUẨN HÓA GIAO DIỆN */}
            {/* ============================================================== */}

            {/* ITEM FORM MODAL */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{isEditingItem ? 'Sửa thông tin linh kiện' : 'Nhập linh kiện vào kho'}</h2>
                            <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                        </div>

                        <form onSubmit={handleItemSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-blue-800 border-b pb-2 uppercase text-sm">1. Định danh & Phân loại</h3>
                                    
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-3">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-blue-800">Bước 1: Chọn Danh mục chính <span className="text-red-500">*</span></label>
                                            <select 
                                                value={selectedBaseCategory} 
                                                onChange={(e) => {
                                                    setSelectedBaseCategory(e.target.value);
                                                    setItemFormData({...itemFormData, item_type: '', name: '', serialCode: ''}); 
                                                }} 
                                                className="w-full border border-blue-200 bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">-- Chọn Danh mục (VD: Màn hình, Pin...) --</option>
                                                {Object.entries(BASE_CODES).map(([code, label]) => (
                                                    <option key={code} value={code}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-blue-800">Bước 2: Chọn Phân loại chi tiết <span className="text-red-500">*</span></label>
                                            <select 
                                                required 
                                                value={itemFormData.item_type} 
                                                onChange={e => {
                                                    const typeObj = itemTypes.find(t => t._id === e.target.value);
                                                    setItemFormData({...itemFormData, item_type: e.target.value, name: typeObj?.name || ''});
                                                }} 
                                                className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                disabled={!selectedBaseCategory}
                                            >
                                                <option value="">-- Chọn Phân loại (VD: Màn hình IP14) --</option>
                                                {filteredItemTypesForModal.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Tên linh kiện <span className="text-red-500">*</span></label>
                                        <input required type="text" value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Hệ thống tự điền, có thể sửa thêm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Mã Serial <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            <input required type="text" value={itemFormData.serialCode} onChange={e => setItemFormData({...itemFormData, serialCode: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Nhập mã vạch hoặc nhấn Tạo mã" />
                                            <button type="button" onClick={handleGenerateItemSerial} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 font-bold rounded-lg hover:bg-blue-100 transition whitespace-nowrap">Tạo mã</button>
                                        </div>
                                    </div>

                                    {(isMainboard || isColorPart) && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                                            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Thông số kỹ thuật (Chỉ dành cho Main / Vỏ)</h4>
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
                                        <label className="block text-sm font-semibold mb-1">Cửa hàng / Kho chứa</label>
                                        <select value={itemFormData.storeId} onChange={e => setItemFormData({...itemFormData, storeId: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">-- Chưa phân bổ kho --</option>
                                            {/* Chặn Manager chọn cửa hàng khác */}
                                            <option value={userStore}>Cửa hàng của bạn</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Trạng thái</label>
                                        <select value={itemFormData.status} onChange={e => setItemFormData({...itemFormData, status: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="in_stock">Trong kho (Sẵn sàng)</option>
                                            <option value="reserved">Đang giữ (Reserved)</option>
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
                                                <input type="text" value={itemFormData.sourceDevice} onChange={e => setItemFormData({...itemFormData, sourceDevice: e.target.value})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" placeholder="VD: iPhone 14 Pro vỡ màn" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1">Chất lượng (Ngoại hình)</label>
                                                <input type="text" value={itemFormData.quality} onChange={e => setItemFormData({...itemFormData, quality: e.target.value})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" placeholder="VD: 98% - Zin nguyên bản" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Giá nhập (VNĐ)</label>
                                            <input type="number" value={itemFormData.baseCost} onChange={e => setItemFormData({...itemFormData, baseCost: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-red-600">Giá bán ra (VNĐ)</label>
                                            <input type="number" value={itemFormData.price} onChange={e => setItemFormData({...itemFormData, price: e.target.value})} className="w-full border border-red-300 bg-red-50/30 p-2.5 rounded-lg outline-none font-bold" />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        <label className="block text-sm font-semibold mb-1">Bảo hành (Tháng)</label>
                                        <input type="number" value={itemFormData.warrantyPeriod} onChange={e => setItemFormData({...itemFormData, warrantyPeriod: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setShowItemModal(false)} className="px-6 py-2.5 bg-gray-100 font-bold rounded-xl hover:bg-gray-200 text-gray-700 transition">Hủy</button>
                                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition">{isEditingItem ? 'Lưu Cập Nhật' : 'Lưu Dữ Liệu'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PHONE FORM MODAL */}
            {showPhoneModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{isEditingPhone ? 'Cập nhật Thông tin Máy' : 'Nhập Máy Mới Vào Kho'}</h2>
                            <button onClick={() => setShowPhoneModal(false)} className="text-gray-400 hover:text-red-500 transition bg-white p-1 rounded-full"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handlePhoneSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* HÀNG 1: HÃNG & DÒNG MÁY (FULL CHIỀU NGANG) */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-1.5">Bước 1: Chọn Hãng sản xuất <span className="text-red-500">*</span></label>
                                        <select 
                                            value={selectedFormBrand} 
                                            onChange={(e) => {
                                                setSelectedFormBrand(e.target.value);
                                                setPhoneFormData({...phoneFormData, phoneModelId: ''}); 
                                            }} 
                                            className="w-full border border-blue-200 bg-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Chọn Hãng --</option>
                                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-1.5">Bước 2: Chọn Dòng máy (Model) <span className="text-red-500">*</span></label>
                                        <select 
                                            value={phoneFormData.phoneModelId} 
                                            onChange={e => setPhoneFormData({...phoneFormData, phoneModelId: e.target.value})} 
                                            required 
                                            disabled={!selectedFormBrand}
                                            className="w-full border border-blue-200 bg-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">-- Chọn Model --</option>
                                            {filteredModelsForForm.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* HÀNG 2: CỬA HÀNG (ẨN) & SERIAL CODE */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Serial Code <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input type="text" value={phoneFormData.serialCode} onChange={e => setPhoneFormData({...phoneFormData, serialCode: e.target.value.toUpperCase()})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 font-mono" placeholder="Nhập hoặc tạo tự động"/>
                                        <button type="button" onClick={handleGeneratePhoneSerial} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 font-bold rounded-xl hover:bg-blue-100 transition whitespace-nowrap">Tạo mã</button>
                                    </div>
                                </div>

                                {/* HÀNG 3: DUNG LƯỢNG & MÀU SẮC/HÌNH THỨC */}
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

                                {/* HÀNG 4: HÌNH ẢNH THỰC TẾ */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình ảnh thực tế của máy (Chụp tình trạng xước xát nếu có)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative min-h-[100px]">
                                        <input type="file" multiple accept="image/*" onChange={e => {
                                            const files = Array.from(e.target.files);
                                            if (files.length > 0) {
                                                const previews = files.map(file => URL.createObjectURL(file));
                                                setPhoneFormData(prev => ({
                                                    ...prev, imageFiles: files, previewImages: previews, retainedImages: [] 
                                                }));
                                            }
                                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="flex flex-wrap gap-3 justify-center mb-2 pointer-events-none">
                                            {phoneFormData.previewImages?.length > 0 ? (
                                                phoneFormData.previewImages.map((src, idx) => (
                                                    <img key={idx} src={src} alt="preview" className="h-16 w-16 object-cover rounded-md shadow-sm border border-gray-200" />
                                                ))
                                            ) : (
                                                <ImageIcon className="h-10 w-10 text-gray-300" />
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium pointer-events-none">
                                            {phoneFormData.previewImages?.length > 0 ? 'Nhấn để chọn lại ảnh khác' : 'Nhấn vào đây để chọn ảnh (Có thể chọn nhiều ảnh)'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* HÀNG 5: NGUỒN GỐC & TRẠNG THÁI */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nguồn gốc</label>
                                    <select value={phoneFormData.source} onChange={e => setPhoneFormData({...phoneFormData, source: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="supplier">Nhập từ nhà cung cấp</option>
                                        <option value="customer_trade_in">Khách thu cũ đổi mới</option>
                                        <option value="assembled">Máy tự ráp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Trạng thái máy <span className="text-red-500">*</span></label>
                                    <select value={phoneFormData.status} onChange={e => setPhoneFormData({...phoneFormData, status: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="in_stock">Sẵn sàng (Trong kho)</option>
                                        <option value="reserved">Đang giữ (Đặt trước)</option>
                                        <option value="waiting_for_tech_decision">Đang chờ xử lý</option>
                                        <option value="defective">Hàng lỗi / Hỏng</option>
                                    </select>
                                </div>

                                {/* HÀNG 6: GIÁ VỐN & GIÁ BÁN/BẢO HÀNH */}
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

                            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-200 shrink-0">
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