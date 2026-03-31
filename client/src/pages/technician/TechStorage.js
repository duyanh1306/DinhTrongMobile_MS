import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Package, Search, MapPin, ChevronDown, Tag, QrCode, Image as ImageIcon, Smartphone } from "lucide-react";

// 🌟 IMPORT API TỪ FILE RIÊNG CỦA TECH
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

export default function TechStorage() {
    const [activeTab, setActiveTab] = useState('ITEMS'); // 'ITEMS' hoặc 'PHONES'
    
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Lấy thông tin Cửa hàng của Technician đang đăng nhập
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const techStoreId = user?.storeId?._id || user?.storeId || "";
    const techStoreName = user?.storeId?.name || "Cửa hàng của tôi";
    
    // PHÂN TRANG THEO NHÓM
    const [currentPage, setCurrentPage] = useState(1);
    const groupsPerPage = 3; 
    
    const [filters, setFilters] = useState({ search: '', status: '' }); 
    const [selectedBaseFilter, setSelectedBaseFilter] = useState('');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState(''); // 🌟 STATE CHO BRAND LỌC ĐIỆN THOẠI

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { fetchKhoData(); }, [techStoreId]);

    // Reset bộ lọc và trang khi chuyển Tab
    useEffect(() => {
        setCurrentPage(1);
        setFilters({ search: '', status: '' });
        setSelectedBaseFilter('');
        setSelectedBrandFilter('');
    }, [activeTab]);

    // Reset trang khi gõ tìm kiếm hoặc đổi bộ lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [filters.search, filters.status, selectedBaseFilter, selectedBrandFilter]);

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
            // Lấy song song cả 2 kho Linh kiện và Điện thoại
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

    // Hàm in QR chung cho cả Item và Phone
    const handleGenerateQR = async (id, type = 'ITEM') => {
        const blobData = type === 'ITEM' ? await fetchItemQrCodeApi(id) : await fetchTechPhoneQrCodeApi(id);
        
        if (!blobData) {
            toast.error("Lỗi khi tải mã QR.");
            return;
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
            toast.error("Không thể khởi tạo chế độ in."); return;
        }

        iframeDoc.open();
        iframeDoc.write(`
          <!doctype html>
          <html>
            <head><style>@page { margin: 0; } html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; display: flex; align-items: center; justify-content: center; } img { width: 180px; height: 180px; object-fit: contain; }</style></head>
            <body><img id="qr-print-image" src="${qrUrl}" alt="QR code" /></body>
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

    // 🌟 GOM NHÓM DỮ LIỆU LINH KIỆN
    const groupedItemsData = useMemo(() => {
        if (activeTab !== 'ITEMS') return [];
        const result = {};
        const safeKeyword = filters.search.toLowerCase();
        
        const filtered = items.filter(item => {
            if (filters.status && item.status !== filters.status) return false;
            if (!filters.status && (item.status === 'sold' || item.status === 'assembled_and_sold')) return false;

            const serialMatch = (item.serialCode || '').toLowerCase().includes(safeKeyword);
            const nameMatch = (item.name || '').toLowerCase().includes(safeKeyword);
            const searchPass = serialMatch || nameMatch;

            const typeCode = item.item_type?.code || 'OTH';
            const base = getBaseCodeFromItemTypeCode(typeCode);
            const basePass = selectedBaseFilter ? base === selectedBaseFilter : true;

            return searchPass && basePass;
        });

        filtered.forEach(item => {
            const typeName = item.item_type?.name || 'Loại không xác định';
            if (!result[typeName]) result[typeName] = [];
            result[typeName].push(item);
        });
        return Object.entries(result);
    }, [items, filters.search, filters.status, selectedBaseFilter, activeTab]);

    // 🌟 LẤY DANH SÁCH BRAND TỪ ĐIỆN THOẠI
    const uniqueBrands = useMemo(() => {
        const brands = new Set();
        phones.forEach(p => {
            const brandName = p.phoneModelId?.brand?.name || p.phoneModelId?.brand;
            if (brandName && typeof brandName === 'string') brands.add(brandName);
        });
        return Array.from(brands);
    }, [phones]);

    // 🌟 GOM NHÓM DỮ LIỆU ĐIỆN THOẠI (CÓ LỌC THEO BRAND)
    const groupedPhonesData = useMemo(() => {
        if (activeTab !== 'PHONES') return [];
        const result = {};
        const safeKeyword = filters.search.toLowerCase();
        
        const filtered = phones.filter(phone => {
            if (filters.status && phone.status !== filters.status) return false;
            if (!filters.status && phone.status === 'sold') return false;

            const serialMatch = (phone.serialCode || '').toLowerCase().includes(safeKeyword);
            const nameMatch = (phone.phoneModelId?.name || '').toLowerCase().includes(safeKeyword);
            const searchPass = serialMatch || nameMatch;

            const brandName = phone.phoneModelId?.brand?.name || phone.phoneModelId?.brand || 'Khác';
            const brandPass = selectedBrandFilter ? brandName === selectedBrandFilter : true;

            return searchPass && brandPass;
        });

        filtered.forEach(phone => {
            const modelName = phone.phoneModelId?.name || 'Model không xác định';
            if (!result[modelName]) result[modelName] = [];
            result[modelName].push(phone);
        });
        return Object.entries(result);
    }, [phones, filters.search, filters.status, selectedBrandFilter, activeTab]);

    // 🌟 PHÂN TRANG CHUNG
    const paginatedData = useMemo(() => {
        const sourceData = activeTab === 'ITEMS' ? groupedItemsData : groupedPhonesData;
        const totalGroups = sourceData.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        
        const startIndex = (currentPage - 1) * groupsPerPage;
        const endIndex = startIndex + groupsPerPage;
        const currentGroups = sourceData.slice(startIndex, endIndex);

        let totalItemsCount = 0;
        sourceData.forEach(([_, list]) => { totalItemsCount += list.length });

        return { groups: currentGroups, totalPages: totalPages || 1, totalItemsCount: totalItemsCount };
    }, [groupedItemsData, groupedPhonesData, currentPage, activeTab]);

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    if (!techStoreId) return <div className="py-20 text-center text-red-500 font-bold">Lỗi: Tài khoản kỹ thuật viên chưa được gán cửa hàng!</div>;

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

            {/* TAB NAVIGATION CHUẨN */}
            <div className="flex gap-6 border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('ITEMS')} 
                    className={`pb-3 text-base font-bold transition-all border-b-4 flex items-center gap-2 ${activeTab === 'ITEMS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Package size={18}/> Linh Kiện
                </button>
                <button 
                    onClick={() => setActiveTab('PHONES')} 
                    className={`pb-3 text-base font-bold transition-all border-b-4 flex items-center gap-2 ${activeTab === 'PHONES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Smartphone size={18}/> Điện Thoại
                </button>
            </div>

            {/* BỘ LỌC TÌM KIẾM CHUNG */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center border border-gray-100">
                {activeTab === 'ITEMS' ? (
                    <div className="relative min-w-[200px] flex-1 md:flex-none">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select 
                            value={selectedBaseFilter} onChange={(e) => setSelectedBaseFilter(e.target.value)} 
                            className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">Tất cả danh mục chính</option>
                            {Object.entries(BASE_CODES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                ) : (
                    <div className="relative min-w-[200px] flex-1 md:flex-none">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select 
                            value={selectedBrandFilter} onChange={(e) => setSelectedBrandFilter(e.target.value)} 
                            className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">Tất cả Hãng (Brands)</option>
                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                )}

                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder={`Tìm theo tên ${activeTab === 'ITEMS' ? 'linh kiện' : 'máy'} hoặc mã Serial...`} 
                        value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg focus:border-blue-500 outline-none text-sm"
                    />
                </div>
                
                <div className="relative min-w-[180px] flex-1 md:flex-none">
                    <select 
                        value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} 
                        className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-4 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="">Lọc theo Trạng thái (Sẵn sàng)</option>
                        <option value="in_stock">Trong kho (Sẵn sàng)</option>
                        {activeTab === 'ITEMS' && <option value="repairing">Đang gắn vào máy</option>}
                        {activeTab === 'PHONES' && <option value="waiting_for_tech_decision">Đang xử lý thu cũ</option>}
                        <option value="sold">Đã xuất / Đã bán</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* DANH SÁCH BẢNG */}
            <div className="flex-1 overflow-y-auto pb-4">
                {loading ? (
                    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : paginatedData.groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        Không tìm thấy {activeTab === 'ITEMS' ? 'linh kiện' : 'điện thoại'} nào trong kho của bạn.
                    </div>
                ) : (
                    paginatedData.groups.map(([groupName, dataList]) => (
                        <div key={groupName} className="mb-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-blue-50/60 p-3 px-4 flex justify-between items-center border-b border-gray-200">
                                <h3 className="font-bold text-blue-900 flex items-center gap-2 text-lg">
                                    {activeTab === 'ITEMS' ? <Package size={20} className="text-blue-600"/> : <Smartphone size={20} className="text-blue-600"/>} 
                                    {groupName} 
                                    <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full ml-2 shadow-sm">{dataList.length} chiếc</span>
                                </h3>
                            </div>

                            <div className="bg-white overflow-x-auto">
                                <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                    {/* HEADERS TÙY THEO TAB */}
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                        <tr>
                                            {activeTab === 'ITEMS' ? (
                                                <>
                                                    <th className="px-4 py-3 font-semibold w-[35%]">Tên & Mã Serial</th>
                                                    <th className="px-4 py-3 font-semibold text-center w-[15%]">QR Code</th>
                                                    <th className="px-4 py-3 font-semibold w-[30%]">Tình trạng / Thuộc tính</th>
                                                    <th className="px-4 py-3 font-semibold text-center w-[20%]">Trạng thái</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-4 py-3 font-semibold text-center w-[10%]">Ảnh</th>
                                                    <th className="px-4 py-3 font-semibold w-[25%]">Serial Code</th>
                                                    <th className="px-4 py-3 font-semibold text-center w-[10%]">QR Code</th>
                                                    <th className="px-4 py-3 font-semibold w-[25%]">Màu / ROM</th>
                                                    <th className="px-4 py-3 font-semibold text-center w-[15%]">Hình thức</th>
                                                    <th className="px-4 py-3 font-semibold text-center w-[15%]">Trạng thái</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    
                                    <tbody className="divide-y divide-gray-100">
                                        {dataList.map(item => (
                                            <tr key={item._id} className="hover:bg-blue-50/30 transition">
                                                {/* ROWS DÀNH CHO LINH KIỆN */}
                                                {activeTab === 'ITEMS' ? (
                                                    <>
                                                        <td className="px-4 py-3 truncate">
                                                            <div className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</div>
                                                            <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border max-w-full truncate">{item.serialCode}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button onClick={() => handleGenerateQR(item._id, 'ITEM')} className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition border border-blue-100 shadow-sm inline-flex justify-center" title="In mã QR">
                                                                <QrCode size={16} />
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
                                                            <div className="truncate">
                                                                {item.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold border border-green-200 inline-block">Sẵn sàng</span> : 
                                                                item.status === 'repairing' ? <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200 inline-block">Đang lắp ráp</span> : 
                                                                (item.status === 'sold' || item.status === 'assembled_and_sold') ? <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 inline-block">Đã xuất kho</span> : 
                                                                <span className="text-yellow-600 font-bold text-xs inline-block">{item.status}</span>}
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    // ROWS DÀNH CHO ĐIỆN THOẠI
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
                                                                <QrCode size={16} />
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 truncate" title={`${item.colorName} - ${item.capacity}`}>
                                                            <span className="text-gray-800 font-medium">{item.colorName}</span> - <span className="text-gray-500">{item.capacity}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center truncate">
                                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold inline-block">{item.grade}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center truncate">
                                                            {item.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold inline-block border border-green-200">Sẵn sàng</span> : 
                                                             item.status === 'waiting_for_tech_decision' ? <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-bold inline-block border border-yellow-200">Đang xử lý</span> :
                                                             item.status === 'sold' ? <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-bold inline-block border border-gray-200">Đã bán</span> : 
                                                             <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-bold inline-block border border-yellow-200">{item.status}</span>}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* THANH PHÂN TRANG */}
            {!loading && paginatedData.totalItemsCount > 0 && (
                <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Đang xem trang <strong className="text-blue-600">{currentPage}</strong> / {paginatedData.totalPages}</span>
                        <span className="text-gray-300">|</span>
                        <span>Kho bạn có: <strong className="text-gray-800">{paginatedData.totalItemsCount}</strong> {activeTab === 'ITEMS' ? 'linh kiện' : 'chiếc'}</span>
                    </div>
                    <div className="flex gap-2">
                        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-5 py-2 border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm">Trang trước</button>
                        <button disabled={currentPage >= paginatedData.totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-5 py-2 border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm">Trang sau</button>
                    </div>
                </div>
            )}
        </div>
    );
}