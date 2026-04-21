import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Package, Search, MapPin, ChevronDown, Tag, QrCode, Image as ImageIcon, Smartphone, Eye, X } from "lucide-react";

import { fetchItemTypesApi, fetchItemsPaginatedApi, fetchItemQrCodeApi } from "../../api/technician/item";
import { fetchTechPhonesApi, fetchTechPhoneQrCodeApi } from "../../api/technician/phone";

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

export default function TechStorage() {
    const [activeTab, setActiveTab] = useState('ITEMS'); 
    
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const techStoreId = user?.storeId?._id || user?.storeId || "";
    const techStoreName = user?.storeId?.name || "Cửa hàng của tôi";
    

    const [filters, setFilters] = useState({ search: '' }); 
    const [selectedBaseFilter, setSelectedBaseFilter] = useState('');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
    

    const [currentPage, setCurrentPage] = useState(1);
    const groupsPerPage = 10; 


    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [detailSearch, setDetailSearch] = useState('');
    const [detailCurrentPage, setDetailCurrentPage] = useState(1);
    const detailItemsPerPage = 5;

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { fetchKhoData(); }, [techStoreId]);


    useEffect(() => {
        setCurrentPage(1);
        setFilters({ search: '' });
        setSelectedBaseFilter('');
        setSelectedBrandFilter('');
    }, [activeTab]);

  
    useEffect(() => { setCurrentPage(1); }, [filters.search, selectedBaseFilter, selectedBrandFilter]);
    useEffect(() => { setDetailCurrentPage(1); }, [detailSearch]);

    const fetchInitialData = async () => {
        const fetchedTypes = await fetchItemTypesApi();
        setItemTypes(fetchedTypes);
    };

    const fetchKhoData = async () => {
        if (!techStoreId) {
            toast.error("Tài khoản của bạn chưa được phân bổ Cửa hàng!");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 9999, storeId: techStoreId }); 
            const [itemsData, phonesData] = await Promise.all([
                fetchItemsPaginatedApi(params.toString()),
                fetchTechPhonesApi(techStoreId)
            ]);
            if (itemsData && itemsData.data) setItems(itemsData.data);
            if (phonesData) setPhones(phonesData);
        } catch (error) {
            toast.error("Lỗi lấy dữ liệu kho");
        }
        setLoading(false);
    };

    const handleGenerateQR = async (id, type = 'ITEM') => {
        const blobData = type === 'ITEM' ? await fetchItemQrCodeApi(id) : await fetchTechPhoneQrCodeApi(id);
        if (!blobData) { toast.error("Lỗi khi tải mã QR."); return; }

        const blob = new Blob([blobData], { type: "image/png" });
        const qrUrl = window.URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
        iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc || !iframe.contentWindow) {
            document.body.removeChild(iframe); window.URL.revokeObjectURL(qrUrl);
            toast.error("Không thể khởi tạo chế độ in."); return;
        }
        iframeDoc.open();
        iframeDoc.write(`<!doctype html><html><head><style>@page { margin: 0; } html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; display: flex; align-items: center; justify-content: center; } img { width: 180px; height: 180px; object-fit: contain; }</style></head><body><img id="qr-print-image" src="${qrUrl}" alt="QR code" /></body></html>`);
        iframeDoc.close();

        const img = iframeDoc.getElementById("qr-print-image");
        if (img) {
            img.onload = () => {
                iframe.contentWindow.focus(); iframe.contentWindow.print();
                setTimeout(() => { window.URL.revokeObjectURL(qrUrl); if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 500);
            };
        }
    };

  
    const groupedBaseData = useMemo(() => {
        const result = {};
        
        if (activeTab === 'ITEMS') {
            items.forEach(item => {
                if (item.status === 'sold' || item.status === 'assembled_and_sold' || item.status === 'consumed') return;
                
                const typeCode = item.item_type?.code || 'OTH';
                const base = getBaseCodeFromItemTypeCode(typeCode);
                if (selectedBaseFilter && base !== selectedBaseFilter) return;

                const groupName = item.item_type?.name || 'Loại không xác định';
                if (!result[groupName]) result[groupName] = [];
                result[groupName].push(item);
            });
        } else {
            phones.forEach(phone => {
                if (phone.status === 'sold' || phone.status === 'consumed') return; 

                const brandName = phone.phoneModelId?.brand?.name || phone.phoneModelId?.brand || 'Khác';
                if (selectedBrandFilter && brandName !== selectedBrandFilter) return;

                const groupName = phone.phoneModelId?.name || 'Model không xác định';
                if (!result[groupName]) result[groupName] = [];
                result[groupName].push(phone);
            });
        }
        return result;
    }, [items, phones, selectedBaseFilter, selectedBrandFilter, activeTab]);

    const filteredGroups = useMemo(() => {
        const entries = Object.entries(groupedBaseData);
        if (!filters.search) return entries;
        const safeKeyword = filters.search.toLowerCase();
        return entries.filter(([groupName, _]) => groupName.toLowerCase().includes(safeKeyword));
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
        if (!selectedGroup) return { items: [], totalPages: 1, totalCount: 0 };
        
        let list = groupedBaseData[selectedGroup] || [];

        if (detailSearch) {
            const keyword = detailSearch.toLowerCase();
            list = list.filter(item => 
                (item.name || item.phoneModelId?.name || '').toLowerCase().includes(keyword) || 
                (item.serialCode || '').toLowerCase().includes(keyword)
            );
        }

        const totalPages = Math.ceil(list.length / detailItemsPerPage);
        const startIndex = (detailCurrentPage - 1) * detailItemsPerPage;
        const paginatedList = list.slice(startIndex, startIndex + detailItemsPerPage);

        return { items: paginatedList, totalPages: totalPages || 1, totalCount: list.length };
    }, [groupedBaseData, selectedGroup, detailSearch, detailCurrentPage]);

    const openDetailModal = (groupName) => {
        setSelectedGroup(groupName);
        setDetailSearch('');
        setDetailCurrentPage(1);
        setShowDetailModal(true);
    };

    const uniqueBrands = useMemo(() => {
        const brands = new Set();
        phones.forEach(p => {
            const brandName = p.phoneModelId?.brand?.name || p.phoneModelId?.brand;
            if (brandName && typeof brandName === 'string') brands.add(brandName);
        });
        return Array.from(brands);
    }, [phones]);

    if (!techStoreId) return <div className="py-20 text-center text-red-500 font-bold">Lỗi: Kỹ thuật viên chưa được gán cửa hàng!</div>;

    return (
        <div className="flex flex-col h-full space-y-6 p-2 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        {activeTab === 'ITEMS' ? <Package className="text-blue-700" size={28} /> : <Smartphone className="text-blue-700" size={28}/>}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Kho Cửa Hàng</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={14}/> {techStoreName}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 border-b border-gray-200">
                <button onClick={() => setActiveTab('ITEMS')} className={`pb-3 text-base font-bold transition-all border-b-4 flex items-center gap-2 ${activeTab === 'ITEMS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Package size={18}/> Linh Kiện
                </button>
                <button onClick={() => setActiveTab('PHONES')} className={`pb-3 text-base font-bold transition-all border-b-4 flex items-center gap-2 ${activeTab === 'PHONES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Smartphone size={18}/> Điện Thoại
                </button>
            </div>

            {/* BỘ LỌC TÌM KIẾM */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center border border-gray-100">
                {activeTab === 'ITEMS' ? (
                    <div className="relative min-w-[200px] flex-1 md:flex-none">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select value={selectedBaseFilter} onChange={(e) => setSelectedBaseFilter(e.target.value)} className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer">
                            <option value="">Tất cả danh mục linh kiện</option>
                            {Object.entries(BASE_CODES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                ) : (
                    <div className="relative min-w-[200px] flex-1 md:flex-none">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select value={selectedBrandFilter} onChange={(e) => setSelectedBrandFilter(e.target.value)} className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer">
                            <option value="">Tất cả Hãng (Brands)</option>
                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                )}

                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder={`Tìm kiếm tên nhóm ${activeTab === 'ITEMS' ? 'linh kiện' : 'dòng máy'}...`} 
                        value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg focus:border-blue-500 outline-none text-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {loading ? (
                    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : paginatedGroups.groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        Không tìm thấy {activeTab === 'ITEMS' ? 'linh kiện' : 'điện thoại'} nào trong kho của bạn.
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-[50%]">{activeTab === 'ITEMS' ? 'Loại Linh Kiện' : 'Dòng Máy (Model)'}</th>
                                    <th className="px-6 py-4 font-semibold text-center w-[25%]">Số lượng trong kho</th>
                                    <th className="px-6 py-4 font-semibold text-center w-[25%]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedGroups.groups.map(([groupName, dataList]) => {
                                    const inStockCount = dataList.filter(i => i.status === 'in_stock').length;
                                    return (
                                        <tr key={groupName} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3 text-base">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                    {activeTab === 'ITEMS' ? <Package size={20} /> : <Smartphone size={20} />}
                                                </div>
                                                {groupName}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-bold text-xs ${inStockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {inStockCount} Sẵn sàng
                                                </span>
                                                <span className="text-gray-400 text-xs ml-2 font-medium">/ {dataList.length} Tổng</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => openDetailModal(groupName)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200">
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
                        <span>Tổng: <strong className="text-gray-800">{paginatedGroups.totalItemsCount}</strong> chiếc</span>
                    </div>
                    <CustomPagination currentPage={currentPage} totalPages={paginatedGroups.totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {showDetailModal && selectedGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                        
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                {activeTab === 'ITEMS' ? <Package className="text-blue-600"/> : <Smartphone className="text-blue-600"/>} 
                                Chi tiết kho: {selectedGroup}
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border border-gray-200 shadow-sm transition"><X size={24}/></button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-4 shrink-0">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Tìm theo Mã Serial Code..." 
                                    value={detailSearch} onChange={e => setDetailSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="p-0 overflow-auto flex-1 bg-white">
                            <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[11px] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {activeTab === 'ITEMS' ? (
                                            <>
                                                <th className="px-4 py-3 font-semibold w-[40%]">Tên & Mã Serial</th>
                                                <th className="px-4 py-3 font-semibold text-center w-[15%]">QR Code</th>
                                                <th className="px-4 py-3 font-semibold w-[25%]">Tình trạng / Thuộc tính</th>
                                                <th className="px-4 py-3 font-semibold text-center w-[20%]">Trạng thái</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-4 py-3 font-semibold text-center w-[8%]">Ảnh</th>
                                                <th className="px-4 py-3 font-semibold w-[23%]">Serial Code</th>
                                                <th className="px-4 py-3 font-semibold text-center w-[12%]">QR Code</th>
                                                <th className="px-4 py-3 font-semibold w-[23%]">Màu / ROM</th>
                                                <th className="px-4 py-3 font-semibold text-center w-[14%]">Hình thức</th>
                                                <th className="px-4 py-3 font-semibold text-center w-[20%]">Trạng thái</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailItemsProcessed.items.map(item => (
                                        <tr key={item._id} className="hover:bg-blue-50/40 transition">
                                            {activeTab === 'ITEMS' ? (
                                                <>
                                                    <td className="px-4 py-3 truncate">
                                                        <div className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border max-w-full truncate">{item.serialCode}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={() => handleGenerateQR(item._id, 'ITEM')} className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition border border-blue-100 shadow-sm inline-flex justify-center" title="In mã QR">
                                                            <QrCode size={18} />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 truncate">
                                                        <div className="mb-1">
                                                            {item.origin === 'disassembled' ? <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block">Bóc máy zin</span> : <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block">Mới 100%</span>}
                                                        </div>
                                                        {(item.ram || item.capacity || item.color) ? (
                                                            <div className="flex gap-2 truncate">
                                                                {item.ram && <span>RAM: <strong>{item.ram}</strong></span>}
                                                                {item.capacity && <span>ROM: <strong>{item.capacity}</strong></span>}
                                                                {item.color && <span>Màu: <strong>{item.color}</strong></span>}
                                                            </div>
                                                        ) : <span className="text-gray-400 italic">Bản tiêu chuẩn</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-center truncate">
                                                        {item.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold border border-green-200 inline-block">Sẵn sàng</span> : 
                                                        item.status === 'repairing' ? <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200 inline-block">Đang lắp ráp</span> : 
                                                        item.status === 'defective' ? <span className="bg-red-100 text-red-700 px-1.5 py-1 rounded-lg text-xs font-bold border border-red-200 inline-block">Thiếu linh kiện</span> :
                                                        item.status === 'reserved' ? <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold border border-orange-200 inline-block">Đặt trước</span> :
                                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 inline-block">{item.status}</span>}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="w-10 h-10 mx-auto rounded border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                                                            {item.specificImages && item.specificImages.length > 0 ? (
                                                                <img src={item.specificImages[0]} alt="img" className="w-full h-full object-cover" />
                                                            ) : <ImageIcon size={16} className="text-gray-300" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-bold text-gray-700 truncate" title={item.serialCode}>{item.serialCode}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={() => handleGenerateQR(item._id, 'PHONE')} className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition border border-blue-100 shadow-sm inline-flex justify-center" title="In mã QR">
                                                            <QrCode size={18} />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 truncate">
                                                        <span className="text-gray-800 font-medium">{item.colorName}</span> - <span className="text-gray-500">{item.capacity}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center truncate">
                                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold inline-block">{item.grade}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center truncate">
                                                        {item.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold inline-block border border-green-200">Sẵn sàng</span> : 
                                                        item.status === 'waiting_for_tech_decision' ? <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-bold inline-block border border-yellow-200">Đang xử lý</span> :
                                                        item.status === 'defective' ? <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold border border-red-200 inline-block">Thiếu linh kiện</span> :
                                                        item.status === 'reserved' ? <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold border border-orange-200 inline-block">Đặt trước</span> :
                                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-bold inline-block border border-gray-200">{item.status}</span>}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {detailItemsProcessed.items.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-gray-500 italic">Không tìm thấy máy nào khớp với bộ lọc.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {detailItemsProcessed.totalCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <span className="text-sm text-gray-600">Trang <strong className="text-blue-600">{detailCurrentPage}</strong> / {detailItemsProcessed.totalPages} (Tổng: {detailItemsProcessed.totalCount} mục)</span>
                                <CustomPagination currentPage={detailCurrentPage} totalPages={detailItemsProcessed.totalPages} onPageChange={setDetailCurrentPage} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}