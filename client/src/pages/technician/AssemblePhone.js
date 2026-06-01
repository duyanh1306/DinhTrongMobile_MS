import React, { useState, useEffect, useMemo } from "react";
import { Wrench, CheckCircle, Search, Plus, X, Filter, Package, Eye, ArrowLeft, RefreshCw, Camera, UploadCloud } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import { fetchAssembleDataApi, submitAssemblePhoneApi, getImageUrl } from "../../api/technician/assemble";

export default function AssemblePhone() {
    const [recipes, setRecipes] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [itemTypesMap, setItemTypesMap] = useState({}); 
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('LIST'); 
    const [selectedRecipe, setSelectedRecipe] = useState("");
    const [selectedParts, setSelectedParts] = useState({}); 
    const [assemblyImages, setAssemblyImages] = useState([]); 

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const techStoreId = user?.storeId?._id || user?.storeId || "";

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPartType, setCurrentPartType] = useState(null); 
   
    const [modalSearch, setModalSearch] = useState("");
    const [listSearch, setListSearch] = useState(""); 
    const [modalOriginFilter, setModalOriginFilter] = useState(""); 
    const [modalCapacityFilter, setModalCapacityFilter] = useState("");
    const [modalColorFilter, setModalColorFilter] = useState("");
    
    const [modalPage, setModalPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        if (!techStoreId) {
            toast.error("Tài khoản của bạn chưa được phân bổ Cửa hàng. Vui lòng liên hệ Admin!");
            setLoading(false); return;
        }

        const data = await fetchAssembleDataApi();
        if (data) {
            setRecipes(data.recipes);
            const availableItems = data.items.filter(i => {
                const iStoreId = i.storeId?._id || i.storeId;
                return i.status === 'in_stock' && String(iStoreId) === String(techStoreId);
            });
            setAllItems(availableItems);

            const typesMap = {};
            data.itemTypes.forEach(type => { typesMap[type._id] = type; });
            setItemTypesMap(typesMap);
        }
        setLoading(false);
    };

    const notifications = useMemo(() => {
        if (!recipes.length || !allItems.length) return [];
        const notifs = [];

        recipes.forEach(recipe => {
            if (!recipe.requiredParts || recipe.requiredParts.length === 0) return;

            let minNewNeeded = 0;
            let missingCount = 0;

            for (let part of recipe.requiredParts) {
                const acceptedIds = part.acceptedItemTypes.map(t => String(t._id || t));
                const availableForSlot = allItems.filter(i => acceptedIds.includes(String(i.item_type?._id || i.item_type)));

                if (availableForSlot.length === 0) {
                    missingCount++;
                } else {
                    const hasUsedPart = availableForSlot.some(i => i.origin === 'disassembled');
                    if (!hasUsedPart) minNewNeeded++;
                }
            }

            if (missingCount === 0 && minNewNeeded <= 2) {
                notifs.push({
                    recipeId: recipe._id,
                    title: recipe.phoneModelId?.name || 'Máy tự ráp',
                    message: minNewNeeded === 0 ? 'Đã đủ 100% linh kiện cũ để dựng.' : `Đủ đồ (Cần xuất bù ${minNewNeeded} linh kiện mới).`,
                    type: 'READY',
                    isBuildable: true 
                });
            } 
            else if (missingCount === 1 && minNewNeeded < 2) {
                notifs.push({
                    recipeId: recipe._id,
                    title: recipe.phoneModelId?.name || 'Máy tự ráp',
                    message: 'Chỉ thiếu 1 linh kiện. Đề xuất xuất thêm đồ mới để ráp.',
                    type: 'ALMOST',
                    isBuildable: false 
                });
            }
        });

        return notifs;
    }, [recipes, allItems]);

    const buildableRecipesData = useMemo(() => {
        if (!recipes.length || !allItems.length) return [];
        
        const buildableIds = notifications.filter(n => n.isBuildable).map(n => n.recipeId);
        let result = recipes.filter(r => buildableIds.includes(r._id));

        result = result.map(recipe => {
           
            const slotStats = recipe.requiredParts.map(part => {
                const acceptedIds = part.acceptedItemTypes.map(t => String(t._id || t));
                const availableItemsForSlot = allItems.filter(i => acceptedIds.includes(String(i.item_type?._id || i.item_type)));
                
                const usedCount = availableItemsForSlot.filter(i => i.origin === 'disassembled').length;
                const newCount = availableItemsForSlot.filter(i => i.origin === 'new').length;
                
                return { used: usedCount, new: newCount, total: usedCount + newCount };
            });

        
            let maxK = slotStats.length > 0 ? Math.min(...slotStats.map(s => s.total)) : 0;
            
           
            let possibleQuantity = 0;
            for (let k = maxK; k >= 1; k--) {
                let requiredNewItems = 0;
            
                for (const stats of slotStats) {
                
                    requiredNewItems += Math.max(0, k - stats.used); 
                }
                
                if (requiredNewItems <= 2 * k) {
                    possibleQuantity = k;
                    break; 
                }
            }

            return { ...recipe, possibleQuantity };
        });

        if (listSearch) {
            return result.filter(r => (r.phoneModelId?.name || '').toLowerCase().includes(listSearch.toLowerCase()));
        }
        return result;
    }, [recipes, allItems, listSearch, notifications]);

    const handleViewRecipe = (recipe) => {
        setSelectedRecipe(recipe._id);
        
        const autoSelected = {};
        recipe.requiredParts.forEach(part => {
            const acceptedIds = part.acceptedItemTypes.map(t => String(t._id || t));
            const availableForSlot = allItems.filter(i => acceptedIds.includes(String(i.item_type?._id || i.item_type)));
            
            const usedPart = availableForSlot.find(i => i.origin === 'disassembled' && !Object.values(autoSelected).some(sel => sel._id === i._id));
            if (usedPart) {
                autoSelected[part.name] = usedPart;
            } else {
                const newPart = availableForSlot.find(i => !Object.values(autoSelected).some(sel => sel._id === i._id));
                if (newPart) autoSelected[part.name] = newPart;
            }
        });
        
        setSelectedParts(autoSelected);
        setViewMode('DETAIL');
    };

    const handleBackToList = () => {
        setViewMode('LIST');
        setSelectedRecipe("");
        setSelectedParts({});
        setAssemblyImages([]); 
    };

    const openSelectionModal = (partKey, partName, acceptedTypes) => {
        setCurrentPartType({ id: partKey, name: partName, acceptedTypes: acceptedTypes });
        setModalSearch(""); setModalOriginFilter(""); setModalCapacityFilter(""); setModalColorFilter(""); setModalPage(1);
        setIsModalOpen(true);
    };

    const handleSelectItem = (itemGroup) => {
        const itemToSelect = itemGroup.itemsList[0]; 
        setSelectedParts(prev => ({ ...prev, [currentPartType.id]: itemToSelect }));
        setIsModalOpen(false);
    };

    const availableFilters = useMemo(() => {
        if (!currentPartType || !currentPartType.acceptedTypes) return { capacities: [], colors: [] };
        const itemsInScope = allItems.filter(i => {
            const tId = String(i.item_type?._id || i.item_type);
            return currentPartType.acceptedTypes.some(acc => String(acc._id || acc) === tId);
        });
        return {
            capacities: [...new Set(itemsInScope.map(i => i.capacity).filter(Boolean))],
            colors: [...new Set(itemsInScope.map(i => i.color).filter(Boolean))]
        };
    }, [currentPartType, allItems]);

    const modalFilteredItems = useMemo(() => {
        if (!currentPartType || !currentPartType.acceptedTypes) return [];
        let filtered = allItems.filter(i => {
            const typeId = String(i.item_type?._id || i.item_type);
            return currentPartType.acceptedTypes.some(acc => String(acc._id || acc) === typeId);
        });
        const alreadySelectedIds = Object.values(selectedParts).map(item => item._id);
        filtered = filtered.filter(i => !alreadySelectedIds.includes(i._id));

        if (modalSearch) filtered = filtered.filter(i => i.name.toLowerCase().includes(modalSearch.toLowerCase()) || i.serialCode.toLowerCase().includes(modalSearch.toLowerCase()));
        if (modalOriginFilter) filtered = filtered.filter(i => i.origin === modalOriginFilter);
        if (modalCapacityFilter) filtered = filtered.filter(i => i.capacity === modalCapacityFilter);
        if (modalColorFilter) filtered = filtered.filter(i => i.color === modalColorFilter);
        return filtered;
    }, [currentPartType, allItems, modalSearch, modalOriginFilter, modalCapacityFilter, modalColorFilter, selectedParts]);

    const groupedItems = useMemo(() => {
        const groups = {};
        modalFilteredItems.forEach(item => {
            const typeId = item.item_type?._id || item.item_type;
            const signature = `${typeId}-${item.baseCost}-${item.origin}-${item.color || ''}-${item.capacity || ''}`;
            if (!groups[signature]) groups[signature] = { ...item, stockQuantity: 1, itemsList: [item] };
            else { groups[signature].stockQuantity += 1; groups[signature].itemsList.push(item); }
        });
        return Object.values(groups).sort((a, b) => {
            if (a.origin === 'disassembled' && b.origin !== 'disassembled') return -1;
            if (a.origin !== 'disassembled' && b.origin === 'disassembled') return 1;
            return 0;
        });
    }, [modalFilteredItems]);

    const modalTotalPages = Math.ceil(groupedItems.length / itemsPerPage);
    const modalCurrentItems = groupedItems.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

    const activeRecipe = recipes.find(r => r._id === selectedRecipe);
    const totalBaseCost = Object.values(selectedParts).reduce((sum, item) => sum + (item.baseCost || 0), 0);
    const isReadyToBuild = activeRecipe?.requiredParts?.every(part => !part.isRequired || !!selectedParts[part.name]);


    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (assemblyImages.length + files.length > 5) {
            toast.warning("Bạn chỉ được tải lên tối đa 5 hình ảnh!");
            e.target.value = null; 
            return;
        }
        
        setAssemblyImages(prev => [...prev, ...files]);
        e.target.value = null; 
    };
    
    const removeImage = (index) => {
        setAssemblyImages(prev => prev.filter((_, i) => i !== index));
    };


    const handleAssemblePhone = async () => {
        if (!isReadyToBuild) return toast.warning("Vui lòng chọn đầy đủ linh kiện bắt buộc!");
        if (assemblyImages.length === 0) return toast.warning("Bạn chưa tải lên hình ảnh của điện thoại sau khi ráp xong!");

        const result = await Swal.fire({
            title: 'Xác nhận Ráp Máy?',
            html: "Hệ thống sẽ tiến hành:<br/><br/> 1. <b>Xuất kho</b> các linh kiện bạn đã chọn<br/>2. <b>Nhập kho</b> máy tự ráp này",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý, Lưu vào kho',
            cancelButtonText: 'Hủy bỏ',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md ml-3',
                cancelButton: 'bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition shadow-md'
            }
        });

        if (result.isConfirmed) {
            const selectedPartIds = Object.values(selectedParts).map(item => item._id);
            
            const formData = new FormData();
            formData.append('phone_model', activeRecipe.phoneModelId._id);
            formData.append('items', JSON.stringify(selectedPartIds));
            formData.append('storeId', techStoreId);
            formData.append('status', 'in_stock');
            formData.append('assembled_by', user._id || user.id);
            
            assemblyImages.forEach(file => {
                formData.append('images', file); 
            });

            const res = await submitAssemblePhoneApi(formData);
            if (res) {
              
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Máy đã được dựng và đưa vào kho thành công.',
                    icon: 'success',
                    confirmButtonText: 'Oke',
                    buttonsStyling: false,
                    allowOutsideClick: false, 
                    customClass: { confirmButton: 'bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md' }
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.reload(); 
                    }
                });
            }
        }
    };

    if (loading) return <div className="py-20 text-center flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>;
    if (!techStoreId) return <div className="py-20 text-center text-red-500 font-bold">Lỗi: Tài khoản kỹ thuật viên chưa được gán cửa hàng!</div>;

    return (
        <div className="flex flex-col h-full space-y-6 p-2 md:p-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Wrench className="text-blue-700" size={28} /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Dựng Máy Lắp Ráp</h1>
                        <p className="text-sm text-gray-500">Kho cửa hàng đang có <strong className="text-blue-600">{buildableRecipesData.length}</strong> dòng máy đủ linh kiện để ráp.</p>
                    </div>
                </div>
            </div>
            {viewMode === 'LIST' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center border border-gray-100">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" placeholder="Tìm kiếm tên dòng máy (Phone model)..." 
                                value={listSearch} onChange={e => setListSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm transition"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-center w-[10%]">STT</th>
                                        <th className="px-6 py-4 font-bold w-[50%]">Dòng máy </th>
                                        <th className="px-6 py-4 font-bold text-center w-[25%]">Số lượng máy có thể ráp</th>
                                        <th className="px-6 py-4 font-bold text-center w-[15%]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {buildableRecipesData.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-gray-500 font-medium">Kho hiện tại không đủ đồ cũ để ráp bất kỳ máy nào.</td></tr>
                                    ) : (
                                        buildableRecipesData.map((recipe, index) => (
                                            <tr key={recipe._id} className="hover:bg-blue-50/50 transition">
                                                <td className="px-6 py-4 text-center font-semibold text-gray-500">{index + 1}</td>
                                                <td className="px-6 py-4 font-bold text-gray-800 text-base">{recipe.phoneModelId?.name || "Máy tự ráp"}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold text-sm">
                                                        {recipe.possibleQuantity} máy
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewRecipe(recipe)} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm">
                                                        <Eye size={16}/> Ráp ngay
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}


            {viewMode === 'DETAIL' && activeRecipe && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button onClick={handleBackToList} className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">
                                <ArrowLeft size={18}/> Quay lại
                            </button>
                            <h2 className="font-bold text-xl text-gray-800 border-l-2 border-gray-300 pl-4">Đang ráp: {activeRecipe.phoneModelId?.name}</h2>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-4 font-bold text-center w-[8%]">STT</th>
                                        <th className="px-4 py-4 font-bold w-[25%]">Vị trí </th>
                                        <th className="px-4 py-4 font-bold w-[35%]">Linh kiện đang chọn </th>
                                        <th className="px-4 py-4 font-bold text-center w-[17%]">Khả dụng </th>
                                        <th className="px-4 py-4 font-bold text-center w-[15%]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeRecipe.requiredParts.map((part, index) => {
                                        const partKey = part.name; 
                                        const selectedItem = selectedParts[partKey];
                                        
                                        const acceptedIds = part.acceptedItemTypes.map(t => String(t._id || t));
                                        const availableCount = allItems.filter(i => acceptedIds.includes(String(i.item_type?._id || i.item_type))).length;

                                        return (
                                            <tr key={index} className="hover:bg-blue-50/20 transition">
                                                <td className="px-4 py-4 text-center font-bold text-gray-400">{index + 1}</td>
                                                <td className="px-4 py-4 font-bold text-gray-700 text-base">
                                                    {part.name} {part.isRequired && <span className="text-red-500">*</span>}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {selectedItem ? (
                                                        <div className="truncate">
                                                            <div className="font-bold text-blue-700 truncate" title={selectedItem.name}>{selectedItem.name}</div>
                                                            <div className="text-xs mt-1 text-gray-500 font-mono">SN: {selectedItem.serialCode} - {selectedItem.origin === 'new' ? 'Mới' : 'Bóc máy'}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Chưa chọn linh kiện...</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{availableCount} món</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button 
                                                        onClick={() => openSelectionModal(partKey, part.name, part.acceptedItemTypes)} 
                                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-blue-600 border border-blue-300 hover:bg-blue-50 font-semibold rounded-lg transition"
                                                    >
                                                        {selectedItem ? <><RefreshCw size={14}/> Đổi đồ khác</> : <><Plus size={16}/> Chọn đồ</>}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-white p-6 border-t border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Camera className="text-blue-600" size={20}/> 
                                Ảnh chụp điện thoại sau khi lắp ráp <span className="text-red-500">*</span>
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                {assemblyImages.map((file, idx) => (
                                    <div key={idx} className="relative w-28 h-28 border rounded-lg overflow-hidden group shadow-sm">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg">
                                            <X size={14}/>
                                        </button>
                                    </div>
                                ))}
                                <label className="w-28 h-28 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition">
                                    <UploadCloud size={28} className="mb-2"/>
                                    <span className="text-xs font-semibold">Tải ảnh lên</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 italic">** Yêu cầu tải lên hình ngoại quan rõ ràng của chiếc máy đã dựng xong.</p>
                        </div>

            
                        <div className="bg-gray-50 p-5 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-lg">
                                <span className="text-gray-600">Tổng giá vốn linh kiện: </span>
                                <span className="text-2xl font-black text-red-600">{totalBaseCost.toLocaleString()} ₫</span>
                            </div>
                            <button 
                                onClick={handleAssemblePhone} 
                                disabled={!isReadyToBuild || assemblyImages.length === 0} 
                                className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isReadyToBuild && assemblyImages.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                <Wrench size={20} /> XÁC NHẬN DỰNG MÁY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gray-800 text-white p-4 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold uppercase tracking-wide flex items-center gap-2"><Package size={20}/> Chọn {currentPartType?.name}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={24}/></button>
                        </div>
                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-64 bg-gray-50 border-r border-gray-200 p-5 overflow-y-auto hidden md:block flex-shrink-0 custom-scrollbar">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={18}/> Bộ lọc nhanh</h3>
                                
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Nguồn gốc hàng</h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                                            <input type="radio" name="origin" checked={modalOriginFilter === ''} onChange={() => setModalOriginFilter('')} className="accent-blue-600"/> Tất cả
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                                            <input type="radio" name="origin" checked={modalOriginFilter === 'disassembled'} onChange={() => setModalOriginFilter('disassembled')} className="accent-blue-600"/> Bóc máy zin
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                                            <input type="radio" name="origin" checked={modalOriginFilter === 'new'} onChange={() => setModalOriginFilter('new')} className="accent-blue-600"/> Mới 100%
                                        </label>
                                    </div>
                                </div>

                                {[
                                    { label: 'Dung lượng (ROM)', list: availableFilters.capacities, state: modalCapacityFilter, setter: setModalCapacityFilter },
                                    { label: 'Màu sắc', list: availableFilters.colors, state: modalColorFilter, setter: setModalColorFilter }
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
                                        <input type="text" placeholder={`Tìm theo tên, mã Serial...`} value={modalSearch} onChange={e => {setModalSearch(e.target.value); setModalPage(1);}} className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg outline-none text-sm focus:border-blue-400 border border-transparent" />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="text-gray-500">Kho có sẵn <strong>{groupedItems.length}</strong> loại</span>
                                        {modalTotalPages > 1 && (
                                            <div className="flex items-center gap-2">
                                                <button disabled={modalPage === 1} onClick={() => setModalPage(p => p - 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded transition">&lt;</button>
                                                <span className="font-bold">{modalPage} / {modalTotalPages}</span>
                                                <button disabled={modalPage === modalTotalPages} onClick={() => setModalPage(p => p + 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded transition">&gt;</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {modalCurrentItems.length === 0 ? (
                                        <div className="text-center py-20 text-gray-500 font-semibold border-2 border-dashed border-gray-200 rounded-xl mx-4 mt-4">Kho hiện tại không có sẵn loại linh kiện này!</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {modalCurrentItems.map((group, index) => {
                                                const typeId = group.item_type?._id || group.item_type;
                                                const typeImage = itemTypesMap[typeId]?.image;
                                                const isNew = group.origin === 'new';

                                                return (
                                                    <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition bg-white gap-4 ${isNew ? 'border-blue-100 hover:border-blue-400' : 'border-blue-50 hover:border-blue-400'}`}>
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0">
                                                                {getImageUrl(typeImage) ? <img src={getImageUrl(typeImage)} alt="" className="max-w-full max-h-full object-contain p-1" /> : <Package className="text-gray-300"/>}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 text-sm">{group.name}</h4>
                                                                <div className="text-xs mt-1 flex flex-wrap gap-2">
                                                                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${isNew ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                        {isNew ? 'Mới 100%' : 'Bóc máy zin'}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded"><CheckCircle size={14}/> Tồn: {group.stockQuantity}</span>
                                                                </div>
                                                                <div className="font-black text-gray-700 mt-1.5 text-sm">Vốn: {(group.baseCost || 0).toLocaleString()} đ</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleSelectItem(group)} className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 text-white font-bold rounded-lg transition ${isNew ? 'bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}>
                                                            <Plus size={18}/> Chọn
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
        </div>
    );
}