import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit, Wrench, CheckCircle, ShoppingCart, ChevronLeft, Search, Plus, X, Filter, Trash2, Package, MapPin, ChevronDown } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast } from "react-toastify";

export default function BuildPhone() {
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [itemTypesMap, setItemTypesMap] = useState({}); 
    const [loading, setLoading] = useState(true);

    const [selectedRecipe, setSelectedRecipe] = useState("");
    const [selectedParts, setSelectedParts] = useState({}); 

    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(localStorage.getItem('selectedStoreId') || "");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPartType, setCurrentPartType] = useState(null); 
    
    const [modalSearch, setModalSearch] = useState("");
    const [modalPriceFilter, setModalPriceFilter] = useState("");
    const [modalCapacityFilter, setModalCapacityFilter] = useState("");
    const [modalRamFilter, setModalRamFilter] = useState("");
    const [modalColorFilter, setModalColorFilter] = useState("");
    
    const [modalPage, setModalPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchBuildData = async () => {
            try {
                setLoading(true);
                const [recipesRes, itemsRes, itemTypesRes, storesRes] = await Promise.all([
                    axiosClient.get('/recipes/all'),
                    axiosClient.get('/items/all'),
                    axiosClient.get('/item_types/all').catch(() => ({ data: { data: [] } })),
                    axiosClient.get('/stores/all') 
                ]);
                
                const storeData = storesRes.data.data || storesRes.data || [];
                setStores(storeData);

                let activeStore = selectedStore;
                if (!activeStore && storeData.length > 0) {
                    activeStore = storeData[0]._id;
                    setSelectedStore(activeStore);
                    localStorage.setItem('selectedStoreId', activeStore);
                }

                setRecipes(recipesRes.data.data || []);
                
                const availableItems = (itemsRes.data.data || []).filter(i => {
                    const iStoreId = i.storeId?._id || i.storeId;
                    return i.status === 'in_stock' && String(iStoreId) === String(activeStore);
                });
                setAllItems(availableItems);

                const typesMap = {};
                (itemTypesRes.data.data || []).forEach(type => {
                    typesMap[type._id] = type;
                });
                setItemTypesMap(typesMap);

            } catch (error) {
                toast.error("Không thể tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchBuildData();
    }, [selectedStore]);

    const handleStoreChange = (e) => {
        const storeId = e.target.value;
        setSelectedStore(storeId);
        localStorage.setItem('selectedStoreId', storeId);
        if (Object.keys(selectedParts).length > 0) {
            setSelectedParts({}); 
            toast.info("Đã đổi cửa hàng. Vui lòng chọn lại linh kiện do tồn kho khác nhau!");
        }
        window.dispatchEvent(new Event('storeChanged'));
    };

    const handleRecipeChange = (e) => {
        setSelectedRecipe(e.target.value);
        setSelectedParts({}); 
    };

    const activeRecipe = recipes.find(r => r._id === selectedRecipe);

    const openSelectionModal = (partKey, partName, acceptedTypes) => {
        setCurrentPartType({ id: partKey, name: partName, acceptedTypes: acceptedTypes });
        setModalSearch("");
        setModalPriceFilter("");
        setModalCapacityFilter("");
        setModalRamFilter("");
        setModalColorFilter("");
        setModalPage(1);
        setIsModalOpen(true);
    };

    const handleSelectItem = (itemGroup) => {
        const actualItemToSelect = itemGroup.itemsList[0]; 
        setSelectedParts(prev => ({
            ...prev,
            [currentPartType.id]: actualItemToSelect
        }));
        setIsModalOpen(false);
    };

    const handleRemoveItem = (partKey) => {
        setSelectedParts(prev => {
            const newState = { ...prev };
            delete newState[partKey];
            return newState;
        });
    };

    const availableCapacities = useMemo(() => {
        if (!currentPartType || !currentPartType.acceptedTypes) return [];
        const itemsInScope = allItems.filter(i => {
            const tId = i.item_type?._id || i.item_type;
            return currentPartType.acceptedTypes.some(acc => (acc._id || acc) === tId);
        });
        return [...new Set(itemsInScope.map(i => i.capacity).filter(Boolean))];
    }, [currentPartType, allItems]);

    const availableRams = useMemo(() => {
        if (!currentPartType || !currentPartType.acceptedTypes) return [];
        const itemsInScope = allItems.filter(i => {
            const tId = i.item_type?._id || i.item_type;
            return currentPartType.acceptedTypes.some(acc => (acc._id || acc) === tId);
        });
        return [...new Set(itemsInScope.map(i => i.ram).filter(Boolean))];
    }, [currentPartType, allItems]);

    const availableColors = useMemo(() => {
        if (!currentPartType || !currentPartType.acceptedTypes) return [];
        const itemsInScope = allItems.filter(i => {
            const tId = i.item_type?._id || i.item_type;
            return currentPartType.acceptedTypes.some(acc => (acc._id || acc) === tId);
        });
        return [...new Set(itemsInScope.map(i => i.color).filter(Boolean))];
    }, [currentPartType, allItems]);

    const modalFilteredItems = useMemo(() => {
        if (!currentPartType || !currentPartType.acceptedTypes) return [];
        
        let filtered = allItems.filter(i => {
            const typeId = i.item_type?._id || i.item_type;
            return currentPartType.acceptedTypes.some(acc => String(acc._id || acc) === String(typeId));
        });

        const alreadySelectedIds = Object.values(selectedParts).map(item => item._id);
        filtered = filtered.filter(i => !alreadySelectedIds.includes(i._id));

        if (modalSearch) {
            filtered = filtered.filter(i => i.name.toLowerCase().includes(modalSearch.toLowerCase()) || i.serialCode.toLowerCase().includes(modalSearch.toLowerCase()));
        }
        if (modalPriceFilter) {
            if (modalPriceFilter === 'under1') filtered = filtered.filter(i => i.price < 1000000);
            else if (modalPriceFilter === '1to3') filtered = filtered.filter(i => i.price >= 1000000 && i.price <= 3000000);
            else if (modalPriceFilter === 'over3') filtered = filtered.filter(i => i.price > 3000000);
        }
        if (modalCapacityFilter) filtered = filtered.filter(i => i.capacity === modalCapacityFilter);
        if (modalRamFilter) filtered = filtered.filter(i => i.ram === modalRamFilter);
        if (modalColorFilter) filtered = filtered.filter(i => i.color === modalColorFilter);

        return filtered;
    }, [currentPartType, allItems, modalSearch, modalPriceFilter, modalCapacityFilter, modalRamFilter, modalColorFilter, selectedParts]);

    const groupedItems = useMemo(() => {
        const groups = {};
        modalFilteredItems.forEach(item => {
            const typeId = item.item_type?._id || item.item_type;
            const signature = `${typeId}-${item.price}-${item.origin}-${item.color || ''}-${item.capacity || ''}-${item.ram || ''}-${item.quality || ''}`;
            
            if (!groups[signature]) {
                groups[signature] = {
                    ...item, 
                    stockQuantity: 1,
                    itemsList: [item] 
                };
            } else {
                groups[signature].stockQuantity += 1;
                groups[signature].itemsList.push(item);
            }
        });
        return Object.values(groups);
    }, [modalFilteredItems]);

    const modalTotalPages = Math.ceil(groupedItems.length / itemsPerPage);
    const modalCurrentItems = groupedItems.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

    const getPaginationRange = (currentPage, totalPages) => {
        const delta = 1;
        const range = [];
        const rangeWithDots = [];
        let l;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }
        for (let i of range) {
            if (l) {
                if (i - l === 2) rangeWithDots.push(l + 1);
                else if (i - l !== 1) rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            l = i;
        }
        return rangeWithDots;
    };

    const totalPrice = Object.values(selectedParts).reduce((sum, item) => sum + (item.price || 0), 0);

    const isReadyToBuild = activeRecipe?.requiredParts?.every(part => {
        if (!part.isRequired) return true;
        return !!selectedParts[part.name];
    });

    const handleAddToCart = async () => {
        if (!isReadyToBuild) return toast.warning("Vui lòng chọn đầy đủ linh kiện bắt buộc!");
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) { toast.warning("Vui lòng đăng nhập!"); navigate('/login'); return; }

        const currentUserId = user._id || user.id;
        const selectedPartIds = Object.values(selectedParts).map(item => item._id);

        const newItem = {
            productType: 'CUSTOM_BUILD',
            phoneModelId: activeRecipe.phoneModelId._id,
            name: `${activeRecipe.phoneModelId.name} (Tự ráp)`,
            image: activeRecipe.phoneModelId.image,
            price: totalPrice,
            quantity: 1,
            selectedParts: selectedPartIds,
            storeId: selectedStore // 🌟 GỬI KÈM STORE ID ĐỂ BIẾT NÓ ĐƯỢC RÁP Ở ĐÂU 🌟
        };

        try {
            await axiosClient.post('/cart/add', { userId: currentUserId, item: newItem });
            window.dispatchEvent(new Event('cartUpdated')); 
            toast.success("Đã thêm máy tự ráp vào giỏ hàng!");
            navigate('/cart');
        } catch (error) { toast.error("Lỗi khi thêm vào giỏ hàng."); }
    };

    const getImageUrl = (url) => {
        if (!url) return "https://via.placeholder.com/150";
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `http://localhost:9999${url}`;
    };

    if (loading) return <CustomerLayout><div className="py-20 text-center flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div></CustomerLayout>;

    return (
        <CustomerLayout>
            <div className="max-w-7xl mx-auto py-8 px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-4 border-b border-gray-200 gap-4">
                    <div>
                        <Link to="/home" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium mb-2 w-max"><ChevronLeft size={16}/> Về trang chủ</Link>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Wrench className="text-blue-600" size={32} /> Xây Dựng Cấu Hình Máy
                        </h1>
                    </div>
                    <div className="relative inline-block z-20">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white" size={18} />
                        <select
                            value={selectedStore}
                            onChange={handleStoreChange}
                            className="appearance-none bg-[#e01a22] text-white text-sm font-bold py-2 pl-9 pr-8 rounded-lg outline-none cursor-pointer hover:bg-red-700 transition shadow-md"
                        >
                            {stores.map(s => <option key={s._id} value={s._id} className="bg-white text-gray-800">{s.name} - {s.location || s.address}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 max-w-xl">
                    <label className="block font-bold text-gray-800 mb-3">1. Vui lòng chọn dòng máy muốn dựng</label>
                    <select 
                        value={selectedRecipe} onChange={handleRecipeChange}
                        className="w-full border-2 border-blue-200 focus:border-blue-600 rounded-xl p-3 outline-none font-medium bg-blue-50/50 transition"
                    >
                        <option value="">-- Chọn Dòng Máy --</option>
                        {recipes.map(r => <option key={r._id} value={r._id}>{r.phoneModelId?.name || "Máy tự dựng"} - {r.description}</option>)}
                    </select>
                </div>

                {activeRecipe && (
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-2/3 space-y-3">
                            <h2 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2">2. Chọn linh kiện tương thích</h2>
                            
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {activeRecipe.requiredParts.map((part, index) => {
                                    const partKey = part.name; 
                                    const partName = part.name || "Linh kiện";
                                    const selectedItem = selectedParts[partKey];

                                    const previewTypeId = part.acceptedItemTypes?.[0]?._id || part.acceptedItemTypes?.[0];
                                    const typeImage = itemTypesMap[previewTypeId]?.image;

                                    return (
                                        <div key={index} className="flex flex-col md:flex-row items-center border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 transition">
                                            <div className="w-full md:w-1/4 font-semibold text-gray-700 flex items-center gap-2 mb-3 md:mb-0">
                                                {index + 1}. {partName} {part.isRequired && <span className="text-red-500">*</span>}
                                            </div>
                                            
                                            <div className="w-full md:w-3/4">
                                                {selectedItem ? (
                                                    <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded border flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                <img src={getImageUrl(itemTypesMap[selectedItem.item_type?._id || selectedItem.item_type]?.image)} alt="" className="max-w-full max-h-full object-contain p-1" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">
                                                                    {selectedItem.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Trạng thái: {selectedItem.origin === 'new' ? 'Mới 100%' : 'Bóc máy'} | BH: {selectedItem.warrantyPeriod} tháng
                                                                </p>
                                                                <p className="font-bold text-red-600 text-sm mt-0.5">{selectedItem.price.toLocaleString()} đ</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => openSelectionModal(partKey, partName, part.acceptedItemTypes)} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition"><Edit size={18}/></button>
                                                            <button onClick={() => handleRemoveItem(partKey)} className="text-red-500 hover:bg-red-50 p-2 rounded transition"><Trash2 size={18}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => openSelectionModal(partKey, partName, part.acceptedItemTypes)}
                                                        className="w-full border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors py-3 rounded-lg flex items-center justify-center gap-2 font-bold"
                                                    >
                                                        <Plus size={20}/> Chọn {partName}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lg:w-1/3">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200 sticky top-24">
                                <h2 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100">Chi phí dự tính</h2>
                                <div className="space-y-3 mb-6 min-h-[150px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.keys(selectedParts).length === 0 && <p className="text-sm text-gray-400 italic text-center py-10">Chưa chọn linh kiện nào</p>}
                                    {Object.entries(selectedParts).map(([key, item]) => (
                                        <div key={key} className="flex justify-between text-sm items-start border-b border-gray-50 pb-2">
                                            <span className="text-gray-600 line-clamp-2 pr-2">{key}: {item.name}</span>
                                            <span className="font-bold text-gray-800 whitespace-nowrap">{item.price?.toLocaleString()} đ</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center py-4 border-y border-gray-200 mb-6 bg-gray-50 -mx-6 px-6">
                                    <span className="font-bold text-gray-800 text-lg">Tổng cộng:</span>
                                    <span className="text-2xl font-black text-red-600">{totalPrice.toLocaleString()} đ</span>
                                </div>
                                <button onClick={handleAddToCart} disabled={!isReadyToBuild} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isReadyToBuild ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                                    <ShoppingCart size={20} /> {isReadyToBuild ? 'TIẾN HÀNH ĐẶT HÀNG' : 'CHỌN ĐỦ LINH KIỆN (*)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#1e3a8a] text-white p-4 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold uppercase tracking-wide">Chọn {currentPartType?.name}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={24}/></button>
                        </div>
                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-64 bg-gray-50 border-r border-gray-200 p-5 overflow-y-auto hidden md:block flex-shrink-0 custom-scrollbar">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={18}/> Lọc sản phẩm</h3>
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Khoảng giá</h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        {['', 'under1', '1to3', 'over3'].map(p => (
                                            <label key={p} className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                                                <input type="radio" name="price" checked={modalPriceFilter === p} onChange={() => setModalPriceFilter(p)} className="accent-blue-600"/> 
                                                {p === '' ? 'Tất cả' : p === 'under1' ? 'Dưới 1 triệu' : p === '1to3' ? '1 - 3 triệu' : 'Trên 3 triệu'}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {[
                                    { label: 'Dung lượng (ROM)', list: availableCapacities, state: modalCapacityFilter, setter: setModalCapacityFilter },
                                    { label: 'Dung lượng RAM', list: availableRams, state: modalRamFilter, setter: setModalRamFilter },
                                    { label: 'Màu sắc', list: availableColors, state: modalColorFilter, setter: setModalColorFilter }
                                ].map(group => group.list.length > 0 && (
                                    <div key={group.label} className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">{group.label}</h4>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                                                <input type="radio" name={group.label} checked={group.state === ''} onChange={() => group.setter('')} className="accent-blue-600"/> Tất cả
                                            </label>
                                            {group.list.map(val => (
                                                <label key={val} className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                                                    <input type="radio" name={group.label} checked={group.state === val} onChange={() => group.setter(val)} className="accent-blue-600"/> {val}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                                    <div className="relative w-full sm:w-1/2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" placeholder={`Tìm kiếm...`} value={modalSearch} onChange={e => {setModalSearch(e.target.value); setModalPage(1);}} className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg outline-none text-sm" />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="text-gray-500">Tìm thấy <strong>{groupedItems.length}</strong> mẫu linh kiện</span>
                                        {modalTotalPages > 1 && (
                                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                                                <button disabled={modalPage === 1} onClick={() => setModalPage(p => p - 1)} className="px-2 py-1 hover:bg-gray-200 disabled:opacity-50 rounded transition">&lt;</button>
                                                {getPaginationRange(modalPage, modalTotalPages).map((pageNum, idx) => (
                                                    pageNum === '...' ? <span key={idx} className="px-2 text-gray-500">...</span> : 
                                                    <button key={idx} onClick={() => setModalPage(pageNum)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${modalPage === pageNum ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}>{pageNum}</button>
                                                ))}
                                                <button disabled={modalPage === modalTotalPages} onClick={() => setModalPage(p => p + 1)} className="px-2 py-1 hover:bg-gray-200 disabled:opacity-50 rounded transition">&gt;</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {modalCurrentItems.length === 0 ? (
                                        <div className="text-center py-20 text-gray-500 font-semibold">Cửa hàng này hiện chưa có sẵn loại linh kiện này! Vui lòng chọn cửa hàng khác.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {modalCurrentItems.map((group, index) => {
                                                const typeId = group.item_type?._id || group.item_type;
                                                const typeImage = itemTypesMap[typeId]?.image;
                                                return (
                                                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition bg-white">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="w-16 h-16 bg-gray-50 rounded flex items-center justify-center border border-gray-100 flex-shrink-0">
                                                                <img src={getImageUrl(typeImage)} alt="" className="max-w-full max-h-full object-contain p-1" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 text-sm md:text-base">{group.name}</h4>
                                                                <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{group.origin === 'new' ? 'Mới 100%' : 'Bóc máy'}</span>
                                                                    <span className="flex items-center gap-1 text-emerald-600 font-semibold"><Package size={14}/> Sẵn có: {group.stockQuantity}</span>
                                                                </div>
                                                                <div className="font-bold text-red-600 mt-1">{group.price.toLocaleString()} đ</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleSelectItem(group)} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-semibold rounded-lg transition ml-4">
                                                            <Plus size={16}/> <span className="hidden sm:inline">Chọn</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>
        </CustomerLayout>
    );
}