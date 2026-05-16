import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Plus, Edit, Trash2, Package, Search, X, Settings, MapPin, ChevronDown, Tag, QrCode, Eye, ArrowUpDown } from "lucide-react";

import { fetchItemTypesApi, fetchStoresApi, fetchItemsPaginatedApi, deleteItemApi, fetchItemQrCodeApi, createItemApi, updateItemApi } from "../../api/admin/item";

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

const formatPriceInput = (val) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parsePriceInput = (str) => {
    if (!str) return '';
    return str.toString().replace(/\./g, '');
};

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
    const [editingDots, setEditingDots] = useState(null); 
    const [jumpPage, setJumpPage] = useState('');

    if (totalPages <= 1) return null;

    const handleJumpSubmit = () => {
        let page = parseInt(jumpPage, 10);
        if (!isNaN(page)) {
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            onPageChange(page);
        }
        setEditingDots(null);
        setJumpPage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleJumpSubmit();
        else if (e.key === 'Escape') { setEditingDots(null); setJumpPage(''); }
    };

    const renderInteractiveDots = (position) => {
        if (editingDots === position) {
            return (
                <input
                    key={`input-${position}`} type="number" autoFocus min={1} max={totalPages}
                    value={jumpPage} onChange={(e) => setJumpPage(e.target.value)}
                    onBlur={handleJumpSubmit} onKeyDown={handleKeyDown}
                    className="w-14 px-1 py-1.5 border-2 border-blue-500 rounded-lg text-center text-sm font-bold text-blue-700 outline-none hide-arrows shadow-sm"
                    placeholder="..."
                />
            );
        }
        return (
            <button key={`dots-${position}`} onClick={() => setEditingDots(position)} className="px-2 text-gray-400 font-bold tracking-widest hover:text-blue-600 transition cursor-pointer" title="Nhấn để nhập số trang">...</button>
        );
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = startPage + maxVisible - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(<button key="first" onClick={() => onPageChange(1)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">1</button>);
            if (startPage > 2) pages.push(renderInteractiveDots('start'));
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button key={i} onClick={() => onPageChange(i)} className={`px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm ${i === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(renderInteractiveDots('end'));
            pages.push(<button key="last" onClick={() => onPageChange(totalPages)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">{totalPages}</button>);
        }

        return pages;
    };

    return (
        <div className="flex gap-1.5 items-center">
            <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm">Trước</button>
            {renderPageNumbers()}
            <button disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm">Sau</button>
            <style dangerouslySetInnerHTML={{__html: `.hide-arrows::-webkit-outer-spin-button, .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } .hide-arrows { -moz-appearance: textfield; }`}} />
        </div>
    );
};

export default function AdminItem() {
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const groupsPerPage = 10; 
    const [filters, setFilters] = useState({ search: '', status: '', storeId: '' }); 
    const [selectedBaseFilter, setSelectedBaseFilter] = useState('');
    
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedGroupType, setSelectedGroupType] = useState(null);
    const [detailSearch, setDetailSearch] = useState('');
    const [detailSortPrice, setDetailSortPrice] = useState(''); 
    const [detailCurrentPage, setDetailCurrentPage] = useState(1);
    const detailItemsPerPage = 5;

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedBaseCategory, setSelectedBaseCategory] = useState('');
    
    const initialFormState = {
        name: '', serialCode: '', item_type: '', status: 'in_stock', storeId: '',
        origin: 'new', sourceDevice: '', quality: '', warrantyPeriod: 12, baseCost: '', price: '',
        ram: '', capacity: '', color: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { fetchItems(); }, [filters.storeId]);
    useEffect(() => { setCurrentPage(1); }, [filters.search, selectedBaseFilter]);
    useEffect(() => { setDetailCurrentPage(1); }, [detailSearch, detailSortPrice]);

    const fetchInitialData = async () => {
        const fetchedTypes = await fetchItemTypesApi();
        setItemTypes(fetchedTypes);
        const fetchedStores = await fetchStoresApi();
        setStores(fetchedStores);
    };

    const fetchItems = async () => {
        setLoading(true);
        const params = new URLSearchParams({ limit: 9999 }); 
        if (filters.storeId) params.append('storeId', filters.storeId);
        
        const data = await fetchItemsPaginatedApi(params.toString());
        if (data && data.data) setItems(data.data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy',
            buttonsStyling: false, 
            customClass: {
                confirmButton: 'bg-red-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-600 transition ml-3 shadow-md',
                cancelButton: 'bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition shadow-md'
            }
        });

        if (result.isConfirmed) {
            const isSuccess = await deleteItemApi(id);
            if (isSuccess) {
                Swal.fire({
                    title: 'Thành công!', text: 'Linh kiện đã được xóa khỏi hệ thống.', icon: 'success',
                    timer: 1500, showConfirmButton: false
                });
                fetchItems();
            }
        }
    };

    const handleGenerateQR = async (itemId, serialCode) => {
        const blobData = await fetchItemQrCodeApi(itemId);
        if (!blobData) { 
            return Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Không thể tải mã QR từ máy chủ.',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold' }
            });
        }

        const blob = new Blob([blobData], { type: "image/png" });
        const qrUrl = window.URL.createObjectURL(blob);

        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
        iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc || !iframe.contentWindow) {
            document.body.removeChild(iframe); window.URL.revokeObjectURL(qrUrl);
            return Swal.fire({
                icon: 'error',
                title: 'Lỗi In Ấn!',
                text: 'Không thể khởi tạo chế độ in QR.',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold' }
            });
        }
        iframeDoc.open();
        iframeDoc.write(`
          <!doctype html>
          <html>
            <head>
              <style>
                @page { margin: 0; }
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; }
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .qr-container { display: flex; flex-direction: column; align-items: center; gap: 10px; }
                img { width: 180px; height: 180px; object-fit: contain; }
                .serial-code { font-family: monospace; font-size: 14px; font-weight: bold; color: #000; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <img id="qr-print-image" src="${qrUrl}" alt="QR code" />
                <div class="serial-code">${serialCode}</div>
              </div>
            </body>
          </html>
        `);
        iframeDoc.close();

        const img = iframeDoc.getElementById("qr-print-image");
        if (img) {
            img.onload = () => {
                iframe.contentWindow.focus(); iframe.contentWindow.print();
                setTimeout(() => { window.URL.revokeObjectURL(qrUrl); if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 500);
            };
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true); setEditingId(item._id);
            const typeObj = itemTypes.find(t => t._id === (item.item_type?._id || item.item_type));
            if (typeObj) setSelectedBaseCategory(getBaseCodeFromItemTypeCode(typeObj.code));
            else setSelectedBaseCategory('');

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
            setSelectedBaseCategory(''); 
            setFormData({...initialFormState, storeId: filters.storeId});
        }
        setShowModal(true);
    };

    const handleGenerateSerial = () => {
        if (!formData.item_type) {
            return Swal.fire({
                icon: 'warning',
                title: 'Thiếu thông tin!',
                text: 'Vui lòng chọn Phân loại linh kiện trước khi tạo mã!',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700' }
            });
        }
        const selectedType = itemTypes.find(t => t._id === formData.item_type);
        if (!selectedType) return;

        const date = new Date();
        const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(2)}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newSerial = `${selectedType.code}-${ddmmyyyy}-${randomStr}`;
        setFormData({ ...formData, serialCode: newSerial });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.item_type) {
            return Swal.fire({
                icon: 'warning',
                title: 'Thiếu thông tin!',
                text: 'Vui lòng chọn "Danh mục chính" và "Phân loại chi tiết" cho linh kiện!',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }


        if (!formData.storeId) {
            return Swal.fire({
                icon: 'warning',
                title: 'Thiếu thông tin!',
                text: 'Vui lòng phân bổ linh kiện này vào một "Cửa hàng / Kho lưu trữ" cụ thể!',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }
        let isSuccess = false;
        if (isEditing) {
            isSuccess = await updateItemApi(editingId, formData);
        } else {
            isSuccess = await createItemApi(formData);
        }

        if (isSuccess) {
            setShowModal(false);
            Swal.fire({
                title: 'Thành công!',
                text: isEditing ? 'Đã cập nhật linh kiện thành công.' : 'Đã nhập kho linh kiện thành công.',
                icon: 'success',
                confirmButtonText: 'Đóng',
                allowOutsideClick: false,
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md' }
            }).then((result) => {
                if (result.isConfirmed) {
                    fetchItems();
                }
            });
        }
    };

    const groupedBaseData = useMemo(() => {
        const result = {};
        items.forEach(item => {
            if (item.status === 'sold' || item.status === 'assembled_and_sold' || item.status === 'consumed') return;
            
            const typeCode = item.item_type?.code || 'OTH';
            const base = getBaseCodeFromItemTypeCode(typeCode);
            if (selectedBaseFilter && base !== selectedBaseFilter) return;

            const typeName = item.item_type?.name || 'Loại không xác định';
            if (!result[typeName]) result[typeName] = [];
            result[typeName].push(item);
        });
        return result;
    }, [items, selectedBaseFilter]);

    const filteredGroups = useMemo(() => {
        const entries = Object.entries(groupedBaseData);
        if (!filters.search) return entries;
        const safeKeyword = filters.search.toLowerCase();
        return entries.filter(([typeName, _]) => typeName.toLowerCase().includes(safeKeyword));
    }, [groupedBaseData, filters.search]);

    const paginatedGroups = useMemo(() => {
        const totalGroups = filteredGroups.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        const startIndex = (currentPage - 1) * groupsPerPage;
        const endIndex = startIndex + groupsPerPage;
        const currentGroups = filteredGroups.slice(startIndex, endIndex);

        let totalItemsCount = 0;
        filteredGroups.forEach(([_, list]) => { totalItemsCount += list.length });

        return { groups: currentGroups, totalPages: totalPages || 1, totalItemsCount };
    }, [filteredGroups, currentPage, groupsPerPage]);

    const detailItemsProcessed = useMemo(() => {
        if (!selectedGroupType) return { items: [], totalPages: 1, totalCount: 0 };
        
        let list = groupedBaseData[selectedGroupType] || [];

        if (detailSearch) {
            const keyword = detailSearch.toLowerCase();
            list = list.filter(item => 
                (item.name || '').toLowerCase().includes(keyword) || 
                (item.serialCode || '').toLowerCase().includes(keyword)
            );
        }

        if (detailSortPrice === 'asc') {
            list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (detailSortPrice === 'desc') {
            list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        }

        const totalPages = Math.ceil(list.length / detailItemsPerPage);
        const startIndex = (detailCurrentPage - 1) * detailItemsPerPage;
        const paginatedList = list.slice(startIndex, startIndex + detailItemsPerPage);

        return { items: paginatedList, totalPages: totalPages || 1, totalCount: list.length };
    }, [groupedBaseData, selectedGroupType, detailSearch, detailSortPrice, detailCurrentPage]);

    const openDetailModal = (typeName) => {
        setSelectedGroupType(typeName);
        setDetailSearch('');
        setDetailSortPrice('');
        setDetailCurrentPage(1);
        setShowDetailModal(true);
    };

    const filteredItemTypesForModal = useMemo(() => {
        if (!selectedBaseCategory) return []; 
        return itemTypes.filter(t => getBaseCodeFromItemTypeCode(t.code) === selectedBaseCategory);
    }, [itemTypes, selectedBaseCategory]);

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

   
    const isMainboard = selectedBaseCategory === 'MB'; 
    const isColorPart = ['HSG', 'BGL', 'FGL'].includes(selectedBaseCategory);

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

            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center border border-gray-100">
                <div className="relative min-w-[250px]">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                        value={selectedBaseFilter} 
                        onChange={(e) => setSelectedBaseFilter(e.target.value)} 
                        className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="">Tất cả loại linh kiện</option>
                        {Object.entries(BASE_CODES).map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm theo tên nhóm (Ví dụ: Màn hình Iphone 13)..." 
                        value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg focus:border-blue-500 outline-none text-sm"
                    />
                </div>
                
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <select value={filters.storeId} onChange={e => setFilters({...filters, storeId: e.target.value})} className="appearance-none border border-gray-200 rounded-lg pl-9 pr-8 py-2.5 text-sm outline-none focus:border-blue-500 bg-gray-50">
                        <option value="">Tất cả kho / cửa hàng</option>
                        {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {loading ? (
                    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : paginatedGroups.groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy nhóm linh kiện nào.</div>
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
                                {paginatedGroups.groups.map(([typeName, itemsList]) => {
                                    const inStockCount = itemsList.filter(i => i.status === 'in_stock').length;
                                    return (
                                        <tr key={typeName} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3 text-base">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                    <Package size={20} />
                                                </div>
                                                {typeName}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-bold text-xs ${inStockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {inStockCount} Sẵn sàng
                                                </span>
                                                <span className="text-gray-400 text-xs ml-2 font-medium">/ {itemsList.length} Tổng</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => openDetailModal(typeName)} 
                                                    className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200"
                                                >
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

            {!loading && paginatedGroups.totalItemsCount > 0 && (
                <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Đang xem trang <strong className="text-blue-600">{currentPage}</strong> / {paginatedGroups.totalPages}</span>
                        <span className="text-gray-300">|</span>
                        <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedGroups.totalItemsCount}</strong> linh kiện</span>
                    </div>
                    <CustomPagination 
                        currentPage={currentPage} 
                        totalPages={paginatedGroups.totalPages} 
                        onPageChange={setCurrentPage} 
                    />
                </div>
            )}

            {showDetailModal && selectedGroupType && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                        
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                <Package className="text-blue-600" /> Chi tiết kho: {selectedGroupType}
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border border-gray-200 shadow-sm transition"><X size={24}/></button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-4 shrink-0">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Tìm theo Tên hoặc mã Serial Code..." 
                                    value={detailSearch} onChange={e => setDetailSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="relative min-w-[200px]">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <select 
                                    value={detailSortPrice} onChange={e => setDetailSortPrice(e.target.value)} 
                                    className="appearance-none w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                >
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
                                        <th className="px-4 py-3 font-semibold w-[28%]">Tên & Mã Serial</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[8%]">QR</th>
                                        <th className="px-4 py-3 font-semibold w-[22%]">Tình trạng / Thuộc tính</th>
                                        <th className="px-4 py-3 font-semibold w-[15%]">Giá vốn / Bán</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[17%]">Vị trí & Trạng thái</th>
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
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => handleGenerateQR(item._id, item.serialCode)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition inline-flex justify-center" title="In mã QR">
                                                    <QrCode size={18} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-600 truncate">
                                                <div className="mb-1.5">
                                                    {item.origin === 'disassembled' ? <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Bóc máy</span> : <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Hàng mới</span>}
                                                </div>
                                                {(item.ram || item.capacity || item.color) ? (
                                                    <div className="flex gap-2 truncate">
                                                        {item.ram && <span>RAM: <strong>{item.ram}</strong></span>}
                                                        {item.capacity && <span>ROM: <strong>{item.capacity}</strong></span>}
                                                        {item.color && <span>Màu: <strong>{item.color}</strong></span>}
                                                    </div>
                                                ) : <span className="text-gray-400 italic">Bản tiêu chuẩn</span>}
                                            </td>
                                            <td className="px-4 py-4 truncate">
                                                <div className="text-xs text-gray-400 line-through mb-0.5 truncate">{formatMoney(item.baseCost)}</div>
                                                <div className="font-bold text-red-600 truncate text-sm">{formatMoney(item.price)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center truncate">
                                                <div className="mb-1.5 truncate">
                                                    {item.storeId?.name ? <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100 inline-block truncate max-w-full">{item.storeId.name}</span> : <span className="italic text-gray-400 text-xs">Chưa phân bổ</span>}
                                                </div>
                                                <div className="truncate">
                                                    {item.status === 'in_stock' ? <span className="text-green-600 font-bold text-xs inline-block">Sẵn sàng</span> : 
                                                     item.status === 'reserved' ? <span className="text-orange-500 font-bold text-xs inline-block">Đặt trước</span> :
                                                     <span className="text-yellow-600 font-bold text-xs inline-block">{item.status}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition border border-transparent hover:border-blue-200"><Edit size={16}/></button>
                                                    <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition border border-transparent hover:border-red-200"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!groupedBaseData[selectedGroupType] || groupedBaseData[selectedGroupType].length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-gray-500 italic">Nhóm này hiện đã hết hàng hoặc bị thay đổi phân loại.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {detailItemsProcessed.totalCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <span className="text-sm text-gray-600">Trang <strong className="text-blue-600">{detailCurrentPage}</strong> / {detailItemsProcessed.totalPages} (Tổng: {detailItemsProcessed.totalCount} mục)</span>
                                <CustomPagination 
                                    currentPage={detailCurrentPage} 
                                    totalPages={detailItemsProcessed.totalPages} 
                                    onPageChange={setDetailCurrentPage} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa thông tin linh kiện' : 'Nhập linh kiện vào kho'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <h3 className="font-bold text-blue-800 border-b border-blue-100 pb-2 uppercase text-sm tracking-wide">1. Phân loại & Thông số</h3>
                                    
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-4 shadow-sm">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1.5 text-blue-900">Danh mục chính *</label>
                                            <select 
                                                value={selectedBaseCategory} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSelectedBaseCategory(val);
                                                    const baseName = BASE_CODES[val];
                                                   
                                                   
                                                    setFormData({...formData, item_type: '', name: baseName ? `${baseName} ` : '', serialCode: '', ram: '', capacity: '', color: ''}); 
                                                }} 
                                                className="w-full border border-blue-200 bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            >
                                                <option value="">-- Chọn Danh mục (VD: Màn hình, Pin...) --</option>
                                                {Object.entries(BASE_CODES).map(([code, label]) => (
                                                    <option key={code} value={code}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1.5 text-blue-900">Phân loại chi tiết *</label>
                                            <select 
                                                required 
                                                value={formData.item_type} 
                                                onChange={e => {
                                                    const typeObj = itemTypes.find(t => t._id === e.target.value);
                                                    setFormData({...formData, item_type: e.target.value, name: typeObj ? `${typeObj.name} ` : formData.name});
                                                }} 
                                                className="w-full border border-blue-200 bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                disabled={!selectedBaseCategory}
                                            >
                                                <option value="">-- Chọn Phân loại (VD: Màn hình IP14) --</option>
                                                {filteredItemTypesForModal.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {(isMainboard || isColorPart) && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <h4 className="text-[11px] font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2"><Tag size={12}/> Thông số kỹ thuật chi tiết</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {isMainboard && (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1.5 text-gray-700">RAM</label>
                                                            <input type="text" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="VD: 6GB" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1.5 text-gray-700">ROM (Bộ nhớ)</label>
                                                            <input type="text" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="VD: 128GB" />
                                                        </div>
                                                    </>
                                                )}
                                                {isColorPart && (
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">Màu sắc ngoại quan</label>
                                                        <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="VD: Đen Midnight, Trắng Ngọc..." />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <h3 className="font-bold text-blue-800 border-b border-blue-100 pb-2 uppercase text-sm tracking-wide">2. Nguồn gốc & Giá bán</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">Tình trạng linh kiện</label>
                                        <div className="flex gap-6 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                                            <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-800"><input type="radio" name="origin" value="new" checked={formData.origin === 'new'} onChange={e => setFormData({...formData, origin: e.target.value, warrantyPeriod: 12})} className="w-4 h-4 text-blue-600" /> Hàng Mới (New)</label>
                                            <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-800"><input type="radio" name="origin" value="disassembled" checked={formData.origin === 'disassembled'} onChange={e => setFormData({...formData, origin: e.target.value, warrantyPeriod: 3})} className="w-4 h-4 text-blue-600" /> Bóc Máy (Zin)</label>
                                        </div>
                                    </div>

                                    {formData.origin === 'disassembled' && (
                                        <div className="bg-purple-50 p-4 rounded-xl space-y-4 border border-purple-100 shadow-sm">
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1.5">Bóc từ thiết bị nào?</label>
                                                <input type="text" value={formData.sourceDevice} onChange={e => setFormData({...formData, sourceDevice: e.target.value})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm" placeholder="VD: iPhone 13 chết cam" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1.5">Chất lượng thực tế</label>
                                                <input type="text" value={formData.quality} onChange={e => setFormData({...formData, quality: e.target.value})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm" placeholder="VD: Zin nguyên bản 98%" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Giá nhập (VNĐ)</label>
                                            <input type="text" value={formatPriceInput(formData.baseCost)} onChange={e => setFormData({...formData, baseCost: parsePriceInput(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="0" />
                                        </div>
                                        <div className="relative">
                                            <label className="block text-sm font-bold mb-1.5 text-red-600">Giá bán ra (VNĐ)</label>
                                            <input type="text" value={formatPriceInput(formData.price)} onChange={e => setFormData({...formData, price: parsePriceInput(e.target.value)})} className="w-full border-2 border-red-200 bg-red-50 p-2.5 rounded-lg outline-none focus:border-red-500 font-bold text-red-700" placeholder="0" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">Thời gian Bảo hành (Tháng)</label>
                                        <input type="number" value={formData.warrantyPeriod} onChange={e => setFormData({...formData, warrantyPeriod: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>

                         
                            <div className="mt-8 pt-6 border-t border-gray-200 space-y-5">
                                <h3 className="font-bold text-blue-800 border-b border-blue-100 pb-2 uppercase text-sm tracking-wide">3. Thông tin hiển thị & Quản lý vị trí</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-gray-800">Tên linh kiện hiển thị *</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-blue-900" placeholder="VD: Mainboard iPhone 13 Zin bóc máy..." />
                                        <p className="text-[11px] text-gray-500 mt-1 italic">Tên này được gợi ý dựa trên Phân loại. Bạn có thể gõ thêm chi tiết tuỳ ý.</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-gray-800">Mã Serial / Định danh *</label>
                                        <div className="flex gap-2">
                                            <input required type="text" value={formData.serialCode} onChange={e => setFormData({...formData, serialCode: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider bg-gray-50" placeholder="Nhập mã vạch hoặc Tạo tự động" />
                                            <button type="button" onClick={handleGenerateSerial} className="px-5 py-2.5 bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg hover:bg-blue-200 transition whitespace-nowrap shadow-sm">Tạo mã</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-gray-800">Cửa hàng / Kho lưu trữ <span className="text-red-500">*</span></label>
                                    <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white">
                                        <option value="">-- Vui lòng chọn cửa hàng --</option>
                                        {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-gray-800">Trạng thái tồn kho</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white font-medium">
                                            <option value="in_stock">Trong kho (Sẵn sàng bán/ráp)</option>
                                            <option value="sold">Đã xuất (Đã bán/Lắp rắp xong)</option>
                                            <option value="defective">Hàng lỗi / Đang chờ bảo hành</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6 p-5 rounded-b-2xl">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 font-bold rounded-xl hover:bg-gray-100 text-gray-700 transition shadow-sm">Hủy bỏ</button>
                                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition">{isEditing ? 'Lưu Cập Nhật' : 'Thêm Vào Kho'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}