import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Save, ArrowLeft, Package, Smartphone, Store, List, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// 🌟 IMPORT API
import { 
    fetchStoresApi, 
    fetchItemsByStoreApi, 
    fetchPhonesByStoreApi, 
    createTransferRequestApi 
} from "../../api/manager/transferRequest";

const BASE_CODES = {
    "MB": "Mainboard", "SCR": "Màn hình", "BAT": "Pin", "HSG": "Vỏ máy",
    "CAM-R": "Camera Sau", "CAM-F": "Camera Trước", "CPT": "Cụm chân sạc",
    "SPK": "Loa ngoài", "FGL": "Mặt kính", "BGL": "Kính lưng", "OTH": "Khác"
};

const getBaseCodeFromItemTypeCode = (code, name = '') => {
    if (!code) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('main')) return 'MB';
        if (lowerName.includes('màn')) return 'SCR';
        if (lowerName.includes('pin')) return 'BAT';
        if (lowerName.includes('vỏ')) return 'HSG';
        if (lowerName.includes('camera sau')) return 'CAM-R';
        if (lowerName.includes('camera trước')) return 'CAM-F';
        if (lowerName.includes('sạc')) return 'CPT';
        if (lowerName.includes('loa')) return 'SPK';
        if (lowerName.includes('mặt kính')) return 'FGL';
        if (lowerName.includes('kính lưng')) return 'BGL';
        return 'OTH';
    }
    const parts = code.split('-');
    if (parts[0] === 'CAM') return `CAM-${parts[1]}`;
    if (BASE_CODES[parts[0]]) return parts[0];
    if (BASE_CODES[code]) return code;
    return 'OTH';
};

const ManagerCreateTransferRequest = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [userStore, setUserStore] = useState(null);
    const [fromStoreId, setFromStoreId] = useState('');
    const [note, setNote] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    const [activeTab, setActiveTab] = useState('ITEMS');
    const [selectedBaseCategory, setSelectedBaseCategory] = useState('');

    const [availableItems, setAvailableItems] = useState([]);
    const [availablePhones, setAvailablePhones] = useState([]);

    const [selectedItemQuantities, setSelectedItemQuantities] = useState({});
    const [selectedPhoneQuantities, setSelectedPhoneQuantities] = useState({});
    
    const [expandedPhoneModels, setExpandedPhoneModels] = useState({}); 

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => { fetchStoresAndUserStore(); }, []);

    useEffect(() => {
        if (fromStoreId) {
            fetchInventoryData(fromStoreId);
        } else {
            setAvailableItems([]);
            setAvailablePhones([]);
            setSelectedItemQuantities({});
            setSelectedPhoneQuantities({});
            setSelectedBaseCategory('');
            setExpandedPhoneModels({});
        }
    }, [fromStoreId]);

    const fetchStoresAndUserStore = async () => {
        try {
            const storesArray = await fetchStoresApi();
            setStores(storesArray);

            const currentUserStore = storesArray.find(store => store.staff && store.staff.includes(user._id || user.id));
            if (currentUserStore) setUserStore(currentUserStore);
            else toast.error('Không tìm thấy cửa hàng của bạn');
        } catch (error) {
            toast.error('Lỗi tải danh sách cửa hàng');
        }
    };

    const fetchInventoryData = async (storeId) => {
        setFetchingData(true);
        try {
            const [itemsRes, phonesRes] = await Promise.all([
                fetchItemsByStoreApi(storeId),
                fetchPhonesByStoreApi(storeId)
            ]);

            const itemsData = itemsRes.data || itemsRes || [];
            const phonesData = phonesRes.data || phonesRes || [];

            setAvailableItems(itemsData.filter(i => i.status === 'in_stock' && i.origin === 'new'));
            setAvailablePhones(phonesData.filter(p => p.status === 'in_stock' && p.grade === 'Mới'));
            
            setSelectedItemQuantities({});
            setSelectedPhoneQuantities({});
            setSelectedBaseCategory('');
            setExpandedPhoneModels({});
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu kho cửa hàng nguồn');
        } finally {
            setFetchingData(false);
        }
    };

    const groupedItems = useMemo(() => {
        const groups = {};
        availableItems.forEach(item => {
            const typeId = item.item_type?._id || item.item_type;
            const typeName = item.item_type?.name || item.name || '';
            const typeCode = item.item_type?.code;
            const baseCategory = getBaseCodeFromItemTypeCode(typeCode, typeName);

            if (!groups[typeId]) {
                groups[typeId] = { typeId, typeName, baseCategory, items: [], maxQuantity: 0 };
            }
            groups[typeId].items.push(item);
            groups[typeId].maxQuantity++;
        });
        return Object.values(groups).sort((a, b) => a.typeName.localeCompare(b.typeName));
    }, [availableItems]);

    const availableBaseCategories = useMemo(() => {
        const categories = new Set();
        groupedItems.forEach(g => categories.add(g.baseCategory));
        return Array.from(categories).sort((a, b) => {
            if (a === 'OTH') return 1;
            if (b === 'OTH') return -1;
            return (BASE_CODES[a] || a).localeCompare(BASE_CODES[b] || b);
        });
    }, [groupedItems]);

    const displayedGroupedItems = useMemo(() => {
        if (!selectedBaseCategory) return [];
        return groupedItems.filter(g => g.baseCategory === selectedBaseCategory);
    }, [groupedItems, selectedBaseCategory]);

    const handleItemQuantityChange = (typeId, value, max) => {
        let val = parseInt(value, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > max) {
            val = max;
            toast.warning(`Kho nguồn chỉ còn tối đa ${max} sản phẩm này!`);
        }
        setSelectedItemQuantities(prev => {
            const updated = { ...prev, [typeId]: val };
            if (val === 0) delete updated[typeId]; 
            return updated;
        });
    };

    const groupedPhones = useMemo(() => {
        const groups = {};
        availablePhones.forEach(phone => {
            const modelId = phone.phoneModelId?._id || phone.phoneModelId;
            const modelName = phone.phoneModelId?.name || "Máy chưa rõ tên";
            
            const variationKey = `${modelId}_${phone.colorName}_${phone.capacity}`;

            if (!groups[modelId]) {
                groups[modelId] = { modelId, modelName, totalQty: 0, variations: {} };
            }
            groups[modelId].totalQty++;

            if (!groups[modelId].variations[variationKey]) {
                groups[modelId].variations[variationKey] = {
                    variationKey,
                    modelId,
                    colorName: phone.colorName,
                    capacity: phone.capacity,
                    phones: [],
                    maxQuantity: 0
                };
            }
            groups[modelId].variations[variationKey].phones.push(phone);
            groups[modelId].variations[variationKey].maxQuantity++;
        });
        return Object.values(groups).sort((a, b) => a.modelName.localeCompare(b.modelName));
    }, [availablePhones]);

    const toggleExpandModel = (modelId) => {
        setExpandedPhoneModels(prev => ({ ...prev, [modelId]: !prev[modelId] }));
    };

    const handlePhoneQuantityChange = (variationKey, value, max) => {
        let val = parseInt(value, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > max) {
            val = max;
            toast.warning(`Kho nguồn chỉ còn tối đa ${max} máy phiên bản này!`);
        }
        setSelectedPhoneQuantities(prev => {
            const updated = { ...prev, [variationKey]: val };
            if (val === 0) delete updated[variationKey]; 
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fromStoreId) return toast.error('Vui lòng chọn cửa hàng nguồn để yêu cầu');
        if (!userStore) return toast.error('Lỗi: Không xác định được cửa hàng đích của bạn');
        if (fromStoreId === userStore._id) return toast.error('Bạn không thể yêu cầu chuyển hàng từ chính cửa hàng của mình');
        
        const totalItems = Object.values(selectedItemQuantities).reduce((a, b) => a + b, 0);
        const totalPhones = Object.values(selectedPhoneQuantities).reduce((a, b) => a + b, 0);

        if (totalItems === 0 && totalPhones === 0) {
            return toast.error('Vui lòng nhập số lượng cho ít nhất 1 linh kiện hoặc 1 phiên bản điện thoại');
        }
        const result = await Swal.fire({
            title: 'Xác nhận tạo yêu cầu?',
            text: `Bạn đang xin cấp ${totalItems} linh kiện và ${totalPhones} điện thoại từ cửa hàng khác.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Gửi yêu cầu ngay',
            cancelButtonText: 'Hủy bỏ',
            customClass: {
                confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                popup: 'rounded-2xl' 
            },
            buttonsStyling: false 
        });

        if (!result.isConfirmed) return; 

        setLoading(true);
        try {
            const finalItemIds = [];
            const itemTypesMapForApi = [];
            groupedItems.forEach(group => {
                const qty = selectedItemQuantities[group.typeId] || 0;
                if (qty > 0) {
                    const selectedItems = group.items.slice(0, qty);
                    finalItemIds.push(...selectedItems.map(i => i._id));
                    itemTypesMapForApi.push({ itemTypes: group.typeId, quantity: qty });
                }
            });

            const finalPhoneIds = [];
            const phoneModelsMapForApi = {};

            groupedPhones.forEach(group => {
                let modelQty = 0;
                Object.values(group.variations).forEach(variation => {
                    const qty = selectedPhoneQuantities[variation.variationKey] || 0;
                    if (qty > 0) {
                        const selectedPhones = variation.phones.slice(0, qty);
                        finalPhoneIds.push(...selectedPhones.map(p => p._id));
                        modelQty += qty;
                    }
                });
                
                if (modelQty > 0) {
                    phoneModelsMapForApi[group.modelId] = {
                        phoneModels: group.modelId,
                        quantity: modelQty
                    };
                }
            });

            const transferRequestData = {
                fromStoreId: fromStoreId,
                toStoreId: userStore._id,
                requestedBy: user._id || user.id,
                items: finalItemIds,
                phones: finalPhoneIds,
                itemType: itemTypesMapForApi,
                phoneModel: Object.values(phoneModelsMapForApi),
                note: note
            };

            await createTransferRequestApi(transferRequestData);

            toast.success('Đã gửi yêu cầu luân chuyển kho thành công!');
            navigate('/manager/transfer_approvals');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu chuyển kho');
        } finally {
            setLoading(false);
        }
    };

    const availableStores = stores.filter(store => store._id !== userStore?._id);
    const totalSelectedItems = Object.values(selectedItemQuantities).reduce((a, b) => a + b, 0);
    const totalSelectedPhones = Object.values(selectedPhoneQuantities).reduce((a, b) => a + b, 0);

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate("/manager/transfer_approvals")} className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tạo Yêu Cầu Luân Chuyển</h1>
                    <p className="text-sm text-gray-600">Yêu cầu cấp thêm Linh kiện mới & Điện thoại mới từ kho khác</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2"><Store size={16} className="inline mr-1 text-blue-600" /> Cửa hàng Nguồn (Xin cấp hàng từ)</label>
                        <select value={fromStoreId} onChange={(e) => setFromStoreId(e.target.value)} required className="w-full px-4 py-2.5 border border-blue-300 rounded-lg bg-blue-50/30 focus:ring-2 focus:ring-blue-500 font-semibold text-blue-900 outline-none">
                            <option value="">-- Chọn cửa hàng --</option>
                            {availableStores.map(store => (
                                <option key={store._id} value={store._id}>{store.name} - {store.address || store.location}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2"><Store size={16} className="inline mr-1 text-green-600" /> Cửa hàng Đích (Cửa hàng của bạn)</label>
                        <input type="text" value={userStore ? `${userStore.name}` : "Đang tải..."} readOnly className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold cursor-not-allowed" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => setActiveTab('ITEMS')} 
                        className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'ITEMS' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        <Package size={18}/> Xin cấp Linh Kiện ({totalSelectedItems})
                    </button>
                    <button 
                        onClick={() => setActiveTab('PHONES')} 
                        className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'PHONES' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        <Smartphone size={18}/> Xin cấp Điện Thoại ({totalSelectedPhones})
                    </button>
                </div>

                <div className="p-0 min-h-[300px]">
                    {!fromStoreId ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <List size={48} className="mb-4 opacity-50"/>
                            <p className="font-medium text-lg">Vui lòng chọn Cửa hàng Nguồn ở phía trên</p>
                            <p className="text-sm">Hệ thống sẽ hiển thị danh sách kho của cửa hàng đó tại đây</p>
                        </div>
                    ) : fetchingData ? (
                        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div></div>
                    ) : activeTab === 'ITEMS' ? (
                        <div className="p-4 md:p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">1. Lọc theo Phân Loại Linh Kiện</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableBaseCategories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedBaseCategory(cat)}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${selectedBaseCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {BASE_CODES[cat] || cat}
                                        </button>
                                    ))}
                                    {availableBaseCategories.length === 0 && <span className="text-gray-500 italic text-sm">Kho này không có linh kiện mới nào khả dụng.</span>}
                                </div>
                            </div>

                            {selectedBaseCategory ? (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-bold w-[10%] text-center">STT</th>
                                                <th className="px-6 py-4 font-bold w-[45%]">Chi Tiết Linh Kiện</th>
                                                <th className="px-6 py-4 font-bold text-center w-[20%]">Tồn Kho (Mới)</th>
                                                <th className="px-6 py-4 font-bold text-center w-[25%]">Số Lượng Yêu Cầu</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {displayedGroupedItems.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Không có linh kiện nào trong nhóm này.</td></tr>
                                            ) : (
                                                displayedGroupedItems.map((group, idx) => (
                                                    <tr key={group.typeId} className={`hover:bg-blue-50/30 transition ${selectedItemQuantities[group.typeId] > 0 ? 'bg-blue-50/60' : ''}`}>
                                                        <td className="px-6 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                                        <td className="px-6 py-4 font-bold text-gray-800 text-base">{group.typeName}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-bold">{group.maxQuantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <input 
                                                                type="number" 
                                                                min="0" 
                                                                max={group.maxQuantity}
                                                                value={selectedItemQuantities[group.typeId] || ''}
                                                                onChange={(e) => handleItemQuantityChange(group.typeId, e.target.value, group.maxQuantity)}
                                                                placeholder="0"
                                                                className={`w-28 text-center px-3 py-2 border-2 rounded-lg outline-none font-bold transition ${selectedItemQuantities[group.typeId] > 0 ? 'border-blue-500 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-50'}`}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50/50">
                                    <Package size={48} className="mx-auto mb-3 opacity-30"/>
                                    <p className="font-medium text-gray-500">Vui lòng chọn Nhóm Linh Kiện ở trên để xem danh sách chi tiết.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 md:p-6">
                            {groupedPhones.length === 0 ? (
                                <p className="text-center text-gray-500 py-10 font-medium">Kho này hiện không có điện thoại Mới nào.</p>
                            ) : (
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    {groupedPhones.map((group) => (
                                        <div key={group.modelId} className="border-b border-gray-100 last:border-0">
                                            <div 
                                                className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
                                                onClick={() => toggleExpandModel(group.modelId)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Smartphone className="text-blue-600" size={20}/>
                                                    <span className="font-bold text-gray-800 text-lg">{group.modelName}</span>
                                                    <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">{group.totalQty} máy sẵn sàng</span>
                                                </div>
                                                {expandedPhoneModels[group.modelId] ? <ChevronUp size={20} className="text-gray-500"/> : <ChevronDown size={20} className="text-gray-500"/>}
                                            </div>

                                            {expandedPhoneModels[group.modelId] && (
                                                <table className="w-full text-left text-sm whitespace-nowrap bg-white">
                                                    <thead className="bg-white text-gray-400 uppercase text-[11px] border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-6 py-3 font-bold w-[50%]">Màu sắc & Dung lượng ROM</th>
                                                            <th className="px-6 py-3 font-bold text-center w-[25%]">Tồn Kho (Mới)</th>
                                                            <th className="px-6 py-3 font-bold text-center w-[25%]">Số Lượng Yêu Cầu</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {Object.values(group.variations).map(variation => (
                                                            <tr key={variation.variationKey} className={`hover:bg-blue-50/20 transition ${selectedPhoneQuantities[variation.variationKey] > 0 ? 'bg-blue-50/40' : ''}`}>
                                                                <td className="px-6 py-3 font-semibold text-gray-700 flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                                                                    {variation.colorName} - {variation.capacity}
                                                                </td>
                                                                <td className="px-6 py-3 text-center font-bold text-emerald-600">
                                                                    {variation.maxQuantity}
                                                                </td>
                                                                <td className="px-6 py-3 text-center">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0" 
                                                                        max={variation.maxQuantity}
                                                                        value={selectedPhoneQuantities[variation.variationKey] || ''}
                                                                        onChange={(e) => handlePhoneQuantityChange(variation.variationKey, e.target.value, variation.maxQuantity)}
                                                                        onClick={(e) => e.stopPropagation()} 
                                                                        placeholder="0"
                                                                        className={`w-28 text-center px-3 py-2 border-2 rounded-lg outline-none font-bold transition ${selectedPhoneQuantities[variation.variationKey] > 0 ? 'border-blue-500 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-50'}`}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú (Lý do xin chuyển)</label>
                <textarea
                    name="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Ví dụ: Xin chuyển thêm hàng bán cho khách VIP..."
                />

                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-base font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                        Tổng yêu cầu: <strong className="text-blue-700 text-lg">{totalSelectedItems}</strong> linh kiện & <strong className="text-blue-700 text-lg">{totalSelectedPhones}</strong> máy
                    </div>
                    <div className="flex w-full md:w-auto gap-3">
                        <button type="button" onClick={() => navigate("/manager/transfer_approvals")} className="flex-1 md:flex-none px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition">
                            Hủy Bỏ
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                            <Save size={20} /> {loading ? "Đang xử lý..." : "Gửi Yêu Cầu Luân Chuyển"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManagerCreateTransferRequest;