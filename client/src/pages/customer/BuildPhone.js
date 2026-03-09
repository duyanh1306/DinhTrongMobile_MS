import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Edit, Wrench, CheckCircle, ShoppingCart, ChevronLeft, Search, Plus, X, Filter, Trash2 } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import CustomerLayout from "../../layouts/CustomerLayout";
import { toast } from "react-toastify";

export default function BuildPhone() {
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // State quản lý việc Build
    const [selectedRecipe, setSelectedRecipe] = useState("");
    const [selectedParts, setSelectedParts] = useState({}); // { itemTypeId: itemObject }

    // State cho Modal Chọn Linh Kiện
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPartType, setCurrentPartType] = useState(null); // { id, name }
    
    // State Bộ lọc trong Modal
    const [modalSearch, setModalSearch] = useState("");
    const [modalPriceFilter, setModalPriceFilter] = useState(""); // "under1", "1to3", "over3"...
    const [modalPage, setModalPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchBuildData = async () => {
            try {
                const [recipesRes, itemsRes] = await Promise.all([
                    axiosClient.get('/recipes/all'),
                    axiosClient.get('/items/all')
                ]);
                setRecipes(recipesRes.data.data || []);
                const availableItems = (itemsRes.data.data || []).filter(i => i.status === 'in_stock');
                setAllItems(availableItems);
            } catch (error) {
                toast.error("Không thể tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchBuildData();
    }, []);

    // Xử lý logic chọn Recipe
    const handleRecipeChange = (e) => {
        setSelectedRecipe(e.target.value);
        setSelectedParts({}); 
    };

    const activeRecipe = recipes.find(r => r._id === selectedRecipe);

    // Mở Modal chọn linh kiện
    const openSelectionModal = (typeId, typeName) => {
        setCurrentPartType({ id: typeId, name: typeName });
        setModalSearch("");
        setModalPriceFilter("");
        setModalPage(1);
        setIsModalOpen(true);
    };

    // Chọn linh kiện từ Modal
    const handleSelectItem = (item) => {
        setSelectedParts(prev => ({
            ...prev,
            [currentPartType.id]: item
        }));
        setIsModalOpen(false);
    };

    // Bỏ chọn linh kiện
    const handleRemoveItem = (typeId) => {
        setSelectedParts(prev => {
            const newState = { ...prev };
            delete newState[typeId];
            return newState;
        });
    };

    // --- LOGIC LỌC DỮ LIỆU TRONG MODAL ---
    const modalFilteredItems = useMemo(() => {
        if (!currentPartType) return [];
        let filtered = allItems.filter(i => (i.item_type?._id || i.item_type) === currentPartType.id);

        if (modalSearch) {
            filtered = filtered.filter(i => i.name.toLowerCase().includes(modalSearch.toLowerCase()) || i.serialCode.toLowerCase().includes(modalSearch.toLowerCase()));
        }

        if (modalPriceFilter) {
            if (modalPriceFilter === 'under1') filtered = filtered.filter(i => i.price < 1000000);
            else if (modalPriceFilter === '1to3') filtered = filtered.filter(i => i.price >= 1000000 && i.price <= 3000000);
            else if (modalPriceFilter === 'over3') filtered = filtered.filter(i => i.price > 3000000);
        }

        return filtered;
    }, [currentPartType, allItems, modalSearch, modalPriceFilter]);

    // Phân trang Modal
    const modalTotalPages = Math.ceil(modalFilteredItems.length / itemsPerPage);
    const modalCurrentItems = modalFilteredItems.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

    // Tính tổng tiền
    const totalPrice = Object.values(selectedParts).reduce((sum, item) => sum + (item.price || 0), 0);

    const isReadyToBuild = activeRecipe?.requiredParts?.every(part => {
        if (!part.isRequired) return true;
        const typeId = part.itemTypeId?._id || part.itemTypeId; 
        return !!selectedParts[typeId];
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
            selectedParts: selectedPartIds
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
                <div className="mb-6 pb-4 border-b border-gray-200">
                    <Link to="/home" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium mb-2 w-max"><ChevronLeft size={16}/> Về trang chủ</Link>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Wrench className="text-blue-600" size={32} /> Xây Dựng Cấu Hình Máy
                    </h1>
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
                        {/* CỘT TRÁI: DANH SÁCH BUILD */}
                        <div className="lg:w-2/3 space-y-3">
                            <h2 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2">2. Chọn linh kiện tương thích</h2>
                            
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {activeRecipe.requiredParts.map((part, index) => {
                                    const typeId = part.itemTypeId?._id || part.itemTypeId;
                                    const partName = part.itemTypeId?.name || part.name;
                                    const selectedItem = selectedParts[typeId];

                                    return (
                                        <div key={index} className="flex flex-col md:flex-row items-center border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 transition">
                                            {/* Tên danh mục */}
                                            <div className="w-full md:w-1/4 font-semibold text-gray-700 flex items-center gap-2 mb-3 md:mb-0">
                                                {index + 1}. {partName} {part.isRequired && <span className="text-red-500">*</span>}
                                            </div>
                                            
                                            {/* Nút Chọn / Hiển thị item đã chọn */}
                                            <div className="w-full md:w-3/4">
                                                {selectedItem ? (
                                                    <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded border flex items-center justify-center overflow-hidden">
                                                                <img src={getImageUrl(selectedItem.item_type?.image)} alt="" className="max-w-full max-h-full object-contain p-1" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">{selectedItem.name}</p>
                                                                <p className="text-xs text-gray-500">Mã: {selectedItem.serialCode} | {selectedItem.origin === 'new' ? 'Hàng mới' : 'Bóc máy'}</p>
                                                                <p className="font-bold text-red-600 text-sm mt-0.5">{selectedItem.price.toLocaleString()} đ</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => openSelectionModal(typeId, partName)} className="text-blue-600 hover:bg-blue-100 p-2 rounded text-sm font-medium transition"><Edit size={18}/></button>
                                                            <button onClick={() => handleRemoveItem(typeId)} className="text-red-500 hover:bg-red-50 p-2 rounded text-sm transition"><Trash2 size={18}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => openSelectionModal(typeId, partName)}
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

                        {/* CỘT PHẢI: TỔNG KẾT & MUA HÀNG */}
                        <div className="lg:w-1/3">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200 sticky top-24">
                                <h2 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100">Chi phí dự tính</h2>
                                
                                <div className="space-y-3 mb-6 min-h-[150px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.keys(selectedParts).length === 0 && (
                                        <p className="text-sm text-gray-400 italic text-center py-10">Chưa chọn linh kiện nào</p>
                                    )}
                                    {Object.values(selectedParts).map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm items-start border-b border-gray-50 pb-2">
                                            <span className="text-gray-600 line-clamp-2 pr-2">{item.item_type?.name}: {item.name}</span>
                                            <span className="font-bold text-gray-800 whitespace-nowrap">{item.price?.toLocaleString()} đ</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center py-4 border-y border-gray-200 mb-6 bg-gray-50 -mx-6 px-6">
                                    <span className="font-bold text-gray-800 text-lg">Tổng cộng:</span>
                                    <span className="text-2xl font-black text-red-600">{totalPrice.toLocaleString()} đ</span>
                                </div>

                                <button 
                                    onClick={handleAddToCart} disabled={!isReadyToBuild}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                        isReadyToBuild ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <ShoppingCart size={20} /> {isReadyToBuild ? 'TIẾN HÀNH ĐẶT HÀNG' : 'CHỌN ĐỦ LINH KIỆN (*)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CHỌN LINH KIỆN GIỐNG PC BUILDER */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        {/* Header Modal */}
                        <div className="bg-[#1e3a8a] text-white p-4 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold uppercase tracking-wide">Chọn {currentPartType?.name}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={24}/></button>
                        </div>

                        {/* Body Modal */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Cột Lọc (Bên trái) */}
                            <div className="w-64 bg-gray-50 border-r border-gray-200 p-5 overflow-y-auto hidden md:block flex-shrink-0">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={18}/> Lọc sản phẩm theo</h3>
                                
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Khoảng giá</h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600"><input type="radio" name="price" checked={modalPriceFilter === ''} onChange={() => setModalPriceFilter('')} className="accent-blue-600"/> Tất cả</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600"><input type="radio" name="price" checked={modalPriceFilter === 'under1'} onChange={() => setModalPriceFilter('under1')} className="accent-blue-600"/> Dưới 1 triệu</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600"><input type="radio" name="price" checked={modalPriceFilter === '1to3'} onChange={() => setModalPriceFilter('1to3')} className="accent-blue-600"/> 1 - 3 triệu</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600"><input type="radio" name="price" checked={modalPriceFilter === 'over3'} onChange={() => setModalPriceFilter('over3')} className="accent-blue-600"/> Trên 3 triệu</label>
                                    </div>
                                </div>
                            </div>

                            {/* Cột Danh sách (Bên phải) */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                {/* Thanh Search & Phân trang */}
                                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                                    <div className="relative w-full sm:w-1/2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text" placeholder={`Tìm kiếm ${currentPartType?.name}...`} 
                                            value={modalSearch} onChange={e => {setModalSearch(e.target.value); setModalPage(1);}}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="text-gray-500">Tìm thấy <strong className="text-gray-800">{modalFilteredItems.length}</strong> sản phẩm</span>
                                        {modalTotalPages > 1 && (
                                            <div className="flex bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                <button disabled={modalPage === 1} onClick={() => setModalPage(p => p - 1)} className="px-3 py-1.5 hover:bg-gray-200 disabled:opacity-50">&lt;</button>
                                                <span className="px-4 py-1.5 bg-white font-bold text-blue-600">{modalPage}</span>
                                                <button disabled={modalPage === modalTotalPages} onClick={() => setModalPage(p => p + 1)} className="px-3 py-1.5 hover:bg-gray-200 disabled:opacity-50">&gt;</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* List Sản phẩm */}
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {modalCurrentItems.length === 0 ? (
                                        <div className="text-center py-20 text-gray-500">Không tìm thấy linh kiện nào phù hợp.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {modalCurrentItems.map(item => (
                                                <div key={item._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition bg-white group">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="w-16 h-16 bg-gray-50 rounded flex items-center justify-center border border-gray-100 flex-shrink-0">
                                                            <img src={getImageUrl(item.item_type?.image)} alt="" className="max-w-full max-h-full object-contain p-1 mix-blend-multiply" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-blue-700 transition">{item.name}</h4>
                                                            <p className="text-xs text-gray-500 mt-1">Mã SP: {item.serialCode} | Tình trạng: <span className="text-green-600 font-semibold">{item.origin === 'new' ? 'Mới' : 'Bóc máy'}</span></p>
                                                            <p className="text-xs text-gray-500 mt-0.5">Bảo hành: {item.warrantyPeriod} Tháng</p>
                                                            <div className="font-bold text-red-600 mt-1 text-sm md:text-base">{item.price.toLocaleString()} đ</div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleSelectItem(item)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition ml-4 flex-shrink-0 whitespace-nowrap"
                                                    >
                                                        <Plus size={16}/> <span className="hidden sm:inline">Thêm</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>
        </CustomerLayout>
    );
}