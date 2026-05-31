import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Save, ArrowLeft, Package, Smartphone, Store, List, ChevronDown, ChevronUp, X, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { 
    fetchStoresApi, 
    fetchItemsByStoreApi, 
    fetchPhonesByStoreApi, 
    createTransferRequestApi,
    fetchTransferRequestsApi,     
    getTransferRequestDetailsApi    
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
    const [itemOriginFilter, setItemOriginFilter] = useState('new'); 
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItemQuantities, setSelectedItemQuantities] = useState({});
    const [selectedSpecificItems, setSelectedSpecificItems] = useState({}); 

    const [availablePhones, setAvailablePhones] = useState([]);
    const [phoneOriginFilter, setPhoneOriginFilter] = useState('new'); 
    const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
    const [selectedPhoneBrand, setSelectedPhoneBrand] = useState('');
    const [selectedPhoneQuantities, setSelectedPhoneQuantities] = useState({});
    const [selectedSpecificPhones, setSelectedSpecificPhones] = useState({}); 
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
            setSelectedSpecificItems({});
            setSelectedPhoneQuantities({});
            setSelectedSpecificPhones({});
            setSelectedBaseCategory('');
            setItemOriginFilter('new');
            setItemSearchQuery('');
            setPhoneOriginFilter('new');
            setExpandedPhoneModels({});
            setPhoneSearchQuery('');
            setSelectedPhoneBrand('');
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
            const [itemsRes, phonesRes, requestsRes] = await Promise.all([
                fetchItemsByStoreApi(storeId),
                fetchPhonesByStoreApi(storeId),
                fetchTransferRequestsApi() 
            ]);

            const itemsData = itemsRes.data || itemsRes || [];
            const phonesData = phonesRes.data || phonesRes || [];
            const allRequests = requestsRes.data || requestsRes || [];

            const activeRequests = allRequests.filter(req => 
                req.fromStoreId?._id === storeId && 
                ['PENDING', 'APPROVED', 'DELIVERING', 'IN PROGRESS'].includes(req.status?.toUpperCase())
            );

            let lockedPhoneIds = new Set();
            let lockedItemIds = new Set();

            activeRequests.forEach(req => {
                (req.phones || []).forEach(p => {
                    lockedPhoneIds.add(p._id || p);
                });
            });

            const detailPromises = activeRequests.map(req => getTransferRequestDetailsApi(req._id).catch(() => []));
            const detailsArray = await Promise.all(detailPromises);
            
            detailsArray.forEach(details => {
                const detail = details[0] || {};
                (detail.itemId || []).forEach(i => lockedItemIds.add(i._id || i));
                (detail.phoneId || []).forEach(p => lockedPhoneIds.add(p._id || p));
            });

            const processedItems = itemsData.map(i => ({
                ...i,
                isLocked: lockedItemIds.has(i._id)
            }));

            const processedPhones = phonesData.map(p => ({
                ...p,
                isLocked: lockedPhoneIds.has(p._id)
            }));

            setAvailableItems(processedItems.filter(i => i.status === 'in_stock'));
            setAvailablePhones(processedPhones.filter(p => p.status === 'in_stock'));
            
            setSelectedItemQuantities({});
            setSelectedSpecificItems({});
            setSelectedPhoneQuantities({});
            setSelectedSpecificPhones({});
            setSelectedBaseCategory('');
            setItemOriginFilter('new');
            setItemSearchQuery('');
            setPhoneOriginFilter('new');
            setPhoneSearchQuery('');
            setSelectedPhoneBrand('');
            setExpandedPhoneModels({});
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu đối chiếu kho');
        } finally {
            setFetchingData(false);
        }
    };


    const groupedItems = useMemo(() => {
        const groups = {};
        availableItems.filter(i => i.origin === 'new' && !i.isLocked).forEach(item => {
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

    const displayedGroupedItems = useMemo(() => {
        let filtered = groupedItems;
        if (selectedBaseCategory) {
            filtered = filtered.filter(g => g.baseCategory === selectedBaseCategory);
        }
        if (itemSearchQuery) {
            const query = itemSearchQuery.toLowerCase();
            filtered = filtered.filter(g => g.typeName.toLowerCase().includes(query));
        }
        return filtered;
    }, [groupedItems, selectedBaseCategory, itemSearchQuery]);

    const displayedOldItems = useMemo(() => {
        let filtered = availableItems.filter(i => i.origin !== 'new');
        if (selectedBaseCategory) {
            filtered = filtered.filter(i => {
                const typeCode = i.item_type?.code;
                const typeName = i.item_type?.name || i.name || '';
                return getBaseCodeFromItemTypeCode(typeCode, typeName) === selectedBaseCategory;
            });
        }
        if (itemSearchQuery) {
            const query = itemSearchQuery.toLowerCase();
            filtered = filtered.filter(i => 
                (i.name || i.item_type?.name || '').toLowerCase().includes(query) ||
                (i.serialCode || '').toLowerCase().includes(query)
            );
        }
        return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [availableItems, selectedBaseCategory, itemSearchQuery]);

    const availableBaseCategories = useMemo(() => {
        const categories = new Set();
        availableItems.forEach(item => {
            const typeCode = item.item_type?.code;
            const typeName = item.item_type?.name || item.name || '';
            categories.add(getBaseCodeFromItemTypeCode(typeCode, typeName));
        });
        return Array.from(categories).sort((a, b) => {
            if (a === 'OTH') return 1;
            if (b === 'OTH') return -1;
            return (BASE_CODES[a] || a).localeCompare(BASE_CODES[b] || b);
        });
    }, [availableItems]);

    const availablePhoneBrands = useMemo(() => {
        const brands = new Set();
        availablePhones.forEach(phone => {
            const brandName = phone.phoneModelId?.brand?.name || phone.phoneModelId?.brand || 'Hãng khác';
            brands.add(brandName);
        });
        return Array.from(brands).sort();
    }, [availablePhones]);

    const groupedPhones = useMemo(() => {
        const groups = {};
        let filteredPhones = availablePhones.filter(p => p.grade === 'Mới' && !p.isLocked);

        if (selectedPhoneBrand) {
            filteredPhones = filteredPhones.filter(phone => {
                const brandName = phone.phoneModelId?.brand?.name || phone.phoneModelId?.brand || 'Hãng khác';
                return brandName === selectedPhoneBrand;
            });
        }
        if (phoneSearchQuery) {
            const query = phoneSearchQuery.toLowerCase();
            filteredPhones = filteredPhones.filter(phone => {
                const modelName = phone.phoneModelId?.name || "Máy chưa rõ tên";
                return modelName.toLowerCase().includes(query);
            });
        }

        filteredPhones.forEach(phone => {
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
    }, [availablePhones, selectedPhoneBrand, phoneSearchQuery]);

    const displayedOldPhones = useMemo(() => {
        let filtered = availablePhones.filter(p => p.grade !== 'Mới');

        if (selectedPhoneBrand) {
            filtered = filtered.filter(phone => {
                const brandName = phone.phoneModelId?.brand?.name || phone.phoneModelId?.brand || 'Hãng khác';
                return brandName === selectedPhoneBrand;
            });
        }
        if (phoneSearchQuery) {
            const query = phoneSearchQuery.toLowerCase();
            filtered = filtered.filter(phone => 
                (phone.phoneModelId?.name || '').toLowerCase().includes(query) ||
                (phone.serialCode || '').toLowerCase().includes(query)
            );
        }
        return filtered.sort((a, b) => (a.phoneModelId?.name || '').localeCompare(b.phoneModelId?.name || ''));
    }, [availablePhones, selectedPhoneBrand, phoneSearchQuery]);

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

    const toggleExpandModel = (modelId) => {
        setExpandedPhoneModels(prev => ({ ...prev, [modelId]: !prev[modelId] }));
    };

    const handleRemoveSelectedItem = (typeId) => setSelectedItemQuantities(prev => { const updated = { ...prev }; delete updated[typeId]; return updated; });
    const handleRemoveSelectedSpecificItem = (itemId) => setSelectedSpecificItems(prev => { const updated = { ...prev }; delete updated[itemId]; return updated; });
    const handleRemoveSelectedSpecificPhone = (phoneId) => setSelectedSpecificPhones(prev => { const updated = { ...prev }; delete updated[phoneId]; return updated; });
    const handleRemoveSelectedPhone = (variationKey) => setSelectedPhoneQuantities(prev => { const updated = { ...prev }; delete updated[variationKey]; return updated; });

    const selectedItemsSummary = useMemo(() => {
        const summary = [];
        groupedItems.forEach(group => {
            const qty = selectedItemQuantities[group.typeId] || 0;
            if (qty > 0) summary.push({ id: group.typeId, name: group.typeName, qty, isOld: false });
        });
        Object.values(selectedSpecificItems).forEach(item => {
            summary.push({ id: item._id, name: `${item.name || item.item_type?.name} (SN: ${item.serialCode})`, qty: 1, isOld: true });
        });
        return summary;
    }, [groupedItems, selectedItemQuantities, selectedSpecificItems]);

    const selectedPhonesSummary = useMemo(() => {
        const summary = [];
        const allGroups = {};
        
        availablePhones.forEach(phone => {
             const modelId = phone.phoneModelId?._id || phone.phoneModelId;
             const modelName = phone.phoneModelId?.name || "Máy chưa rõ tên";
             const variationKey = `${modelId}_${phone.colorName}_${phone.capacity}`;
             if(!allGroups[variationKey]) allGroups[variationKey] = { variationKey, modelName: `${modelName} (${phone.colorName} - ${phone.capacity})` }
        });
        Object.keys(selectedPhoneQuantities).forEach(variationKey => {
             const qty = selectedPhoneQuantities[variationKey];
             if(qty > 0 && allGroups[variationKey]){
                 summary.push({ id: variationKey, name: allGroups[variationKey].modelName, qty: qty, isOld: false });
             }
        });
        Object.values(selectedSpecificPhones).forEach(phone => {
            summary.push({ id: phone._id, name: `${phone.phoneModelId?.name} (${phone.colorName} - ${phone.capacity}) (SN: ${phone.serialCode})`, qty: 1, isOld: true });
        });
        return summary;
    }, [availablePhones, selectedPhoneQuantities, selectedSpecificPhones]);

    const totalSelectedItems = selectedItemsSummary.reduce((a, b) => a + b.qty, 0);
    const totalSelectedPhones = selectedPhonesSummary.reduce((a, b) => a + b.qty, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fromStoreId) return toast.error('Vui lòng chọn cửa hàng nguồn để yêu cầu');
        if (!userStore) return toast.error('Lỗi: Không xác định được cửa hàng đích của bạn');
        if (fromStoreId === userStore._id) return toast.error('Bạn không thể yêu cầu chuyển hàng từ chính cửa hàng của mình');
        if (totalSelectedItems === 0 && totalSelectedPhones === 0) return toast.error('Vui lòng chọn ít nhất 1 linh kiện hoặc 1 phiên bản điện thoại');

        const result = await Swal.fire({
            title: 'Xác nhận tạo yêu cầu?',
            text: `Bạn đang xin cấp ${totalSelectedItems} linh kiện và ${totalSelectedPhones} điện thoại từ cửa hàng khác.`,
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
            const itemTypeCounts = {}; 

            groupedItems.forEach(group => {
                const qty = selectedItemQuantities[group.typeId] || 0;
                if (qty > 0) {
                    const selectedItems = group.items.slice(0, qty);
                    finalItemIds.push(...selectedItems.map(i => i._id));
                    itemTypeCounts[group.typeId] = (itemTypeCounts[group.typeId] || 0) + qty;
                }
            });

            Object.values(selectedSpecificItems).forEach(item => {
                finalItemIds.push(item._id);
                const typeId = item.item_type?._id || item.item_type;
                itemTypeCounts[typeId] = (itemTypeCounts[typeId] || 0) + 1;
            });

            const itemTypesMapForApi = Object.keys(itemTypeCounts).map(typeId => ({ itemTypes: typeId, quantity: itemTypeCounts[typeId] }));
            const finalPhoneIds = [];
            
            availablePhones.filter(p => p.grade === 'Mới' && !p.isLocked).forEach(phone => {
                const modelId = phone.phoneModelId?._id || phone.phoneModelId;
                const variationKey = `${modelId}_${phone.colorName}_${phone.capacity}`;
                const requestedQty = selectedPhoneQuantities[variationKey] || 0;
                
                if (requestedQty > 0 && !phone._isAssignedToTransfer) { 
                    const currentCount = finalPhoneIds.filter(id => {
                        const p = availablePhones.find(x => x._id === id);
                        return `${p.phoneModelId?._id || p.phoneModelId}_${p.colorName}_${p.capacity}` === variationKey;
                    }).length;

                    if (currentCount < requestedQty) {
                        finalPhoneIds.push(phone._id);
                        phone._isAssignedToTransfer = true; 
                    }
                }
            });
            availablePhones.forEach(p => delete p._isAssignedToTransfer);

            Object.values(selectedSpecificPhones).forEach(phone => {
                finalPhoneIds.push(phone._id);
            });

           const transferRequestData = {
                fromStoreId: fromStoreId,
                toStoreId: userStore._id,
                requestedBy: user._id || user.id,
                items: finalItemIds, 
                phones: finalPhoneIds, 
                itemType: itemTypesMapForApi,
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

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate("/manager/transfer_approvals")} className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tạo Yêu Cầu Luân Chuyển</h1>
                    <p className="text-sm text-gray-600">Yêu cầu cấp thêm Hàng hóa & Điện thoại từ kho khác</p>
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
                        <Package size={18}/> Xin cấp Linh Kiện
                    </button>
                    <button 
                        onClick={() => setActiveTab('PHONES')} 
                        className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'PHONES' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        <Smartphone size={18}/> Xin cấp Điện Thoại
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
                            <div className="flex flex-col xl:flex-row gap-4 mb-5">
                                <div className="flex bg-gray-100 p-1 rounded-lg w-full xl:w-max shrink-0 h-11">
                                    <button 
                                        onClick={() => setItemOriginFilter('new')}
                                        className={`flex-1 px-4 h-full flex items-center justify-center text-sm font-bold rounded-md transition whitespace-nowrap ${itemOriginFilter === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Mới 100% (Nhập SL)
                                    </button>
                                    <button 
                                        onClick={() => setItemOriginFilter('old')}
                                        className={`flex-1 px-4 h-full flex items-center justify-center text-sm font-bold rounded-md transition whitespace-nowrap ${itemOriginFilter === 'old' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Bóc Máy/Cũ (Chọn Mã)
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row gap-4">
                                    <div className="relative w-full sm:w-1/2 h-11">
                                        <select 
                                            value={selectedBaseCategory} 
                                            onChange={(e) => setSelectedBaseCategory(e.target.value)}
                                            className="w-full h-full appearance-none pl-4 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 outline-none cursor-pointer"
                                        >
                                            <option value="">-- Tất cả nhóm linh kiện --</option>
                                            {availableBaseCategories.map(cat => (
                                                <option key={cat} value={cat}>{BASE_CODES[cat] || cat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                    <div className="relative w-full sm:w-1/2 h-11">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Tìm tên hoặc mã Serial..." 
                                            value={itemSearchQuery}
                                            onChange={(e) => setItemSearchQuery(e.target.value)}
                                            className="w-full h-full pl-10 pr-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {itemOriginFilter === 'new' && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-4 font-bold text-center w-[10%]">STT</th>
                                                <th className="px-4 py-4 font-bold w-[30%]">Tên Linh Kiện</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Giá Gốc</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Mã Serial</th>
                                                
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {displayedGroupedItems.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Không có linh kiện mới nào.</td></tr>
                                            ) : (
                                                displayedGroupedItems.map((group, idx) => (
                                                    <tr key={group.typeId} className={`hover:bg-blue-50/30 transition ${selectedItemQuantities[group.typeId] > 0 ? 'bg-blue-50/60' : ''}`}>
                                                        <td className="px-4 md:px-6 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                                        <td className="px-4 md:px-6 py-4 font-bold text-gray-800 text-sm md:text-base">{group.typeName}</td>
                                                        <td className="px-4 md:px-6 py-4 text-center">
                                                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md font-bold text-xs">{group.maxQuantity}</span>
                                                        </td>
                                                        <td className="px-4 md:px-6 py-4 flex justify-center">
                                                            <input 
                                                                type="number" 
                                                                min="0" 
                                                                max={group.maxQuantity}
                                                                value={selectedItemQuantities[group.typeId] || ''}
                                                                onChange={(e) => handleItemQuantityChange(group.typeId, e.target.value, group.maxQuantity)}
                                                                placeholder="0"
                                                                className={`w-20 md:w-28 text-center px-3 py-2 border rounded-md outline-none font-bold transition ${selectedItemQuantities[group.typeId] > 0 ? 'border-blue-500 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-50'}`}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {itemOriginFilter === 'old' && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-4 font-bold text-center w-[10%]">STT</th>
                                                <th className="px-4 py-4 font-bold w-[30%]">Tên Linh Kiện</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Giá Gốc</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Mã Serial</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {displayedOldItems.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Không có linh kiện bóc máy nào khả dụng.</td></tr>
                                            ) : (
                                                displayedOldItems.map((item, idx) => {
                                                    const isSelected = !!selectedSpecificItems[item._id];
                                                    const isLocked = item.isLocked;
                                                    
                                                    return (
                                                        <tr key={item._id} className={`hover:bg-blue-50/30 transition ${isSelected ? 'bg-blue-50/60' : ''} ${isLocked ? 'opacity-60 bg-gray-50' : ''}`}>
                                                        <td className="px-4 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                                        <td className="px-4 py-4 font-bold text-gray-800">{item.name || item.item_type?.name}</td>
                                                        <td className="px-4 py-4 text-center font-bold text-rose-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.baseCost || 0)}</td>
                                                        <td className="px-4 py-4 text-center font-mono font-bold text-gray-600">{item.serialCode}</td>
                                                            <td className="px-4 py-4 text-center">
                                                                {isLocked ? (
                                                                    <span className="px-3 py-1.5 rounded-md font-bold text-[11px] bg-orange-50 text-orange-600 border border-orange-200">
                                                                        Đã có yêu cầu
                                                                    </span>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setSelectedSpecificItems(prev => {
                                                                                const updated = {...prev};
                                                                                if (updated[item._id]) delete updated[item._id];
                                                                                else updated[item._id] = item;
                                                                                return updated;
                                                                            });
                                                                        }}
                                                                        className={`px-4 py-1.5 rounded-md font-bold text-xs transition border ${isSelected ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm'}`}
                                                                    >
                                                                        {isSelected ? 'Đã Chọn (Hủy)' : '+ Chọn Mã'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 md:p-6 space-y-5">
                            <div className="flex flex-col xl:flex-row gap-4 mb-5">
                                <div className="flex bg-gray-100 p-1 rounded-lg w-full xl:w-max shrink-0 h-11">
                                    <button 
                                        onClick={() => setPhoneOriginFilter('new')}
                                        className={`flex-1 px-4 h-full flex items-center justify-center text-sm font-bold rounded-md transition whitespace-nowrap ${phoneOriginFilter === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Mới (Nhập SL)
                                    </button>
                                    <button 
                                        onClick={() => setPhoneOriginFilter('old')}
                                        className={`flex-1 px-4 h-full flex items-center justify-center text-sm font-bold rounded-md transition whitespace-nowrap ${phoneOriginFilter === 'old' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Cũ/Đã SD (Chọn Mã)
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row gap-4">
                                    <div className="relative w-full sm:w-1/2 h-11">
                                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                        <select 
                                            value={selectedPhoneBrand} 
                                            onChange={(e) => setSelectedPhoneBrand(e.target.value)}
                                            className="w-full h-full appearance-none pl-10 pr-10 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer font-medium text-gray-800"
                                        >
                                            <option value="">Tất cả Hãng máy</option>
                                            {availablePhoneBrands.map(brand => (
                                                <option key={brand} value={brand}>{brand}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                    <div className="relative w-full sm:w-1/2 h-11">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Tên máy hoặc Mã Serial..." 
                                            value={phoneSearchQuery}
                                            onChange={(e) => setPhoneSearchQuery(e.target.value)}
                                            className="w-full h-full pl-10 pr-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        
                            {phoneOriginFilter === 'new' && (
                                <>
                                    {groupedPhones.length === 0 ? (
                                        <p className="text-center text-gray-500 py-10 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">Không tìm thấy máy mới nào phù hợp.</p>
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
                                                            <span className="font-bold text-gray-800 text-base md:text-lg">{group.modelName}</span>
                                                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-md text-[11px] font-bold">{group.totalQty} máy sẵn sàng</span>
                                                        </div>
                                                        {expandedPhoneModels[group.modelId] ? <ChevronUp size={20} className="text-gray-500"/> : <ChevronDown size={20} className="text-gray-500"/>}
                                                    </div>

                                                    {expandedPhoneModels[group.modelId] && (
                                                        <table className="w-full text-left text-sm whitespace-nowrap bg-white">
                                                            <thead className="bg-white text-gray-400 uppercase text-[10px] md:text-[11px] border-b border-gray-100">
                                                                <tr>
                                                                    <th className="px-4 md:px-6 py-3 font-bold w-[50%]">Màu sắc & Dung lượng ROM</th>
                                                                    <th className="px-4 md:px-6 py-3 font-bold text-center w-[25%]">Tồn Kho</th>
                                                                    <th className="px-4 md:px-6 py-3 font-bold text-center w-[25%]">Số Lượng Yêu Cầu</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {Object.values(group.variations).map(variation => (
                                                                    <tr key={variation.variationKey} className={`hover:bg-blue-50/20 transition ${selectedPhoneQuantities[variation.variationKey] > 0 ? 'bg-blue-50/40' : ''}`}>
                                                                        <td className="px-4 md:px-6 py-3 font-semibold text-gray-700 flex items-center gap-2 text-xs md:text-sm">
                                                                            <div className="w-2 h-2 rounded-full bg-blue-300 flex-shrink-0"></div>
                                                                            <span className="truncate max-w-[120px] md:max-w-xs">{variation.colorName}</span> - {variation.capacity}
                                                                        </td>
                                                                        <td className="px-4 md:px-6 py-3 text-center font-bold text-emerald-600 text-xs md:text-sm">
                                                                            {variation.maxQuantity}
                                                                        </td>
                                                                        <td className="px-4 md:px-6 py-3 flex justify-center">
                                                                            <input 
                                                                                type="number" 
                                                                                min="0" 
                                                                                max={variation.maxQuantity}
                                                                                value={selectedPhoneQuantities[variation.variationKey] || ''}
                                                                                onChange={(e) => handlePhoneQuantityChange(variation.variationKey, e.target.value, variation.maxQuantity)}
                                                                                onClick={(e) => e.stopPropagation()} 
                                                                                placeholder="0"
                                                                                className={`w-20 md:w-28 text-center px-3 py-2 border rounded-md outline-none font-bold transition text-xs md:text-sm ${selectedPhoneQuantities[variation.variationKey] > 0 ? 'border-blue-500 bg-white text-blue-700 shadow-sm' : 'border-gray-200 bg-gray-50'}`}
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
                                </>
                            )}

                            {phoneOriginFilter === 'old' && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-4 font-bold text-center w-[10%]">STT</th>
                                                <th className="px-4 py-4 font-bold w-[30%]">Tên Máy (Phân loại)</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Giá Gốc</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Mã Serial</th>
                                                <th className="px-4 py-4 font-bold text-center w-[20%]">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {displayedOldPhones.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Không có điện thoại qua sử dụng nào.</td></tr>
                                            ) : (
                                                displayedOldPhones.map((phone, idx) => {
                                                    const isSelected = !!selectedSpecificPhones[phone._id];
                                                    const isLocked = phone.isLocked;
                                                    return (
                                                        <tr key={phone._id} className={`hover:bg-blue-50/30 transition ${isSelected ? 'bg-blue-50/60' : ''} ${isLocked ? 'opacity-60 bg-gray-50' : ''}`}>
                                                            <td className="px-4 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                                            <td className="px-4 py-4">
                                                                <div className="font-bold text-gray-800">{phone.phoneModelId?.name}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5">{phone.colorName} - {phone.capacity} <span className="font-bold text-orange-600 ml-1">[{phone.grade}]</span></div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center font-bold text-rose-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(phone.importPrice || 0)}</td>
                                                            <td className="px-4 py-4 text-center font-mono font-bold text-gray-600">{phone.serialCode}</td>
                                                            <td className="px-4 py-4 text-center">
                                                                {isLocked ? (
                                                                    <span className="px-3 py-1.5 rounded-md font-bold text-[11px] bg-orange-50 text-orange-600 border border-orange-200">
                                                                        Đã có yêu cầu
                                                                    </span>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setSelectedSpecificPhones(prev => {
                                                                                const updated = {...prev};
                                                                                if (updated[phone._id]) delete updated[phone._id];
                                                                                else updated[phone._id] = phone;
                                                                                return updated;
                                                                            });
                                                                        }}
                                                                        className={`px-4 py-1.5 rounded-md font-bold text-xs transition border ${isSelected ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm'}`}
                                                                    >
                                                                        {isSelected ? 'Đã Chọn (Hủy)' : '+ Chọn Mã'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {(selectedItemsSummary.length > 0 || selectedPhonesSummary.length > 0) && (
                    <div className="mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <List size={18} className="text-orange-500"/> Danh sách đã chọn ({totalSelectedItems + totalSelectedPhones} món)
                        </h3>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedPhonesSummary.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md"><Smartphone size={16}/></div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.isOld ? 'Điện thoại Cũ/Đã qua SD' : 'Điện thoại Mới'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-orange-600 text-sm">SL: {item.qty}</span>
                                        <button onClick={() => {
                                            if (item.isOld) handleRemoveSelectedSpecificPhone(item.id);
                                            else handleRemoveSelectedPhone(item.id);
                                        }} className="text-gray-400 hover:text-red-500 transition" title="Xóa"><X size={18}/></button>
                                    </div>
                                </div>
                            ))}
                            {selectedItemsSummary.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-md"><Package size={16}/></div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.isOld ? 'Linh kiện Bóc máy' : 'Linh kiện Mới'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-orange-600 text-sm">SL: {item.qty}</span>
                                        <button onClick={() => {
                                            if (item.isOld) handleRemoveSelectedSpecificItem(item.id);
                                            else handleRemoveSelectedItem(item.id);
                                        }} className="text-gray-400 hover:text-red-500 transition" title="Xóa"><X size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú (Lý do xin chuyển)</label>
                <textarea
                    name="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
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
                            <Save size={20} /> {loading ? "Đang xử lý..." : "Gửi Yêu Cầu"}
                        </button>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
}

export default ManagerCreateTransferRequest;