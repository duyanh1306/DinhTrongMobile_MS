import React, {useEffect, useState, useCallback, useMemo} from "react";
import axios from "axios";
import {toast} from "react-toastify";
import {Plus, Edit, Trash2, Package, Search, ChevronDown, ChevronRight, X} from "lucide-react";
import {useNavigate} from "react-router-dom";

export default function AdminItem() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [stores, setStores] = useState([]);
    const [phoneModels, setPhoneModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTypes, setExpandedTypes] = useState(new Set());
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'name',
        sortOrder: 'asc',
        status: '',
        store: ''
    });
    const [activeTab, setActiveTab] = useState('itemType'); // 'itemType' or 'phoneModel'
    const [searchInput, setSearchInput] = useState('');
    const [typeFilters, setTypeFilters] = useState({});
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        serialCode: '',
        status: 'in_stock',
        ...(activeTab === 'phoneModel' ? {phoneModel: ''} : {item_type: ''}),
        store: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchItemTypes();
        fetchStores();
        fetchPhoneModels();
        fetchItems(true);

        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, []);

    useEffect(() => {
        if (searchInput !== filters.search) {
            setSearchInput(filters.search);
        }
    }, [filters.search]);

    useEffect(() => {
        if (!loading && pagination.currentPage) {
            fetchItems(false);
        }
    }, [pagination.currentPage, filters.sortBy, filters.sortOrder, filters.status, filters.store]);

    const groupedItemsByType = useMemo(() => {
        // Start with all item types
        const allTypes = {};

        // Initialize all item types from the itemTypes array
        itemTypes.forEach(type => {
            allTypes[type._id] = {
                typeName: type.name,
                items: []
            };
        });


        // Group items by type (only items with item_type)
        items.forEach(item => {
            if (!item.item_type) return; // Only include items with item_type

            const typeId = item.item_type._id;
            const typeName = item.item_type.name;

            if (filters.search && !typeName.toLowerCase().includes(filters.search.toLowerCase())) {
                return;
            }

            if (!allTypes[typeId]) {
                allTypes[typeId] = {
                    typeName,
                    items: []
                };
            }
            allTypes[typeId].items.push(item);
        });

        // Filter out types that don't match search if search is active
        if (filters.search) {
            const filtered = {};
            Object.entries(allTypes).forEach(([typeId, typeData]) => {
                if (typeData.typeName.toLowerCase().includes(filters.search.toLowerCase())) {
                    filtered[typeId] = typeData;
                }
            });
            return filtered;
        }

        return allTypes;
    }, [items, itemTypes, filters.search]);

    const groupedItemsByPhoneModel = useMemo(() => {
        // Start with all phone models
        const allModels = {};

        // Initialize all phone models from the phoneModels array
        phoneModels.forEach(model => {
            allModels[model._id.toString()] = {
                typeName: model.name,
                items: []
            };
        });


        // Group items by phone model (only items with phoneModel)
        items.forEach(item => {
            if (!item.phoneModelId) return; // Only include items with phoneModel

            const modelId = item.phoneModelId._id ? item.phoneModelId._id.toString() : item.phoneModelId.toString();
            const modelName = item.phoneModelId.name || item.phoneModelId.brand || `Phone Model ${modelId}`;

            if (filters.search && !modelName.toLowerCase().includes(filters.search.toLowerCase())) {
                return;
            }

            if (!allModels[modelId]) {
                allModels[modelId] = {
                    typeName: modelName,
                    items: []
                };
            }
            allModels[modelId].items.push(item);
        });

        // Filter out models that don't match search if search is active
        if (filters.search) {
            const filtered = {};
            Object.entries(allModels).forEach(([modelId, modelData]) => {
                if (modelData.typeName.toLowerCase().includes(filters.search.toLowerCase())) {
                    filtered[modelId] = modelData;
                }
            });
            return filtered;
        }

        return allModels;
    }, [items, phoneModels, filters.search]);

    const groupedItems = activeTab === 'itemType' ? groupedItemsByType : groupedItemsByPhoneModel;

    const fetchItemTypes = async () => {
        try {
            const token = localStorage.getItem("token");
            const {data} = await axios.get(`http://localhost:9999/api/item_types/all`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            setItemTypes(data.data || []);
            console.log(`Fetched ${data.data?.length || 0} item types`);
        } catch (error) {
            console.error("Fetch item types failed", error);
            toast.error("Failed to fetch item types");
        }
    };

    const fetchStores = async () => {
        try {
            const {data} = await axios.get(`http://localhost:9999/api/stores`);
            setStores(Array.isArray(data) ? data : data.data || []);
            const storesArray = Array.isArray(data) ? data : data.data || [];
            console.log(`Fetched ${storesArray.length} stores`);
        } catch (error) {
            console.error("Fetch stores failed", error);
            toast.error("Failed to fetch stores");
        }
    };

    const fetchPhoneModels = async () => {
        try {
            const {data} = await axios.get(`http://localhost:9999/api/phone_models/all`);
            setPhoneModels(data.data || []);
            console.log(`Fetched ${data.data?.length || 0} phone models`);
        } catch (error) {
            console.error("Fetch phone models failed", error);
            toast.error("Failed to fetch phone models");
        }
    };

    const fetchItems = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            }
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination?.currentPage || 1,
                limit: pagination?.limit || 10,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                ...(filters.status && {status: filters.status}),
                ...(filters.store && {store: filters.store})
            });

            const {data} = await axios.get(`http://localhost:9999/api/items?${params}`, {
                headers: {Authorization: `Bearer ${token}`},
            });

            setItems(data.data || []);
            setPagination(data.pagination);
            console.log(`Fetched ${data.data?.length || 0} items`);
        } catch (error) {
            console.error("Fetch items failed", error);
            toast.error(error.response?.data?.message || "Failed to fetch items");
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`http://localhost:9999/api/items/${id}`, {
                    headers: {Authorization: `Bearer ${token}`},
                });
                toast.success("Item deleted successfully");
                fetchItems(false);
            } catch (error) {
                console.error("Delete failed", error);
                toast.error(error.response?.data?.message || "Failed to delete item");
            }
        }
    };

    const handleSearchChange = (e) => {
        setFilters(prev => ({...prev, search: e.target.value}));
        setPagination(prev => ({...prev, currentPage: 1}));
    };

    const handleFilterChange = (field, value) => {
        if (field === 'search') {
            setSearchInput(value);

            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            const timeout = setTimeout(() => {
                setFilters(prev => ({...prev, [field]: value}));
                setPagination(prev => ({...prev, currentPage: 1}));
            }, 150);

            setSearchTimeout(timeout);
        } else {
            setFilters(prev => ({...prev, [field]: value}));
            setPagination(prev => ({...prev, currentPage: 1}));
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            setFilters(prev => ({...prev, search: value}));
            setPagination(prev => ({...prev, currentPage: 1}));
        }, 150);

        setSearchTimeout(timeout);
    };

    const handleSortChange = (field) => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({...prev, currentPage: page}));
    };

    const toggleTypeExpansion = (typeId) => {
        setExpandedTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(typeId)) {
                newSet.delete(typeId);
            } else {
                newSet.add(typeId);
            }
            return newSet;
        });
    };

    const handleTypeFilterChange = (typeId, field, value) => {
        setTypeFilters(prev => ({
            ...prev,
            [typeId]: {
                ...prev[typeId],
                [field]: value
            }
        }));
    };

    const getStatusCounts = useCallback((items) => {
        const statusCounts = {
            available: 0,
            in_stock: 0,
            sold: 0,
            installed: 0
        };

        items.forEach(item => {
            if (statusCounts.hasOwnProperty(item.status)) {
                statusCounts[item.status]++;
            }
        });

        return [
            {
                status: 'available',
                count: statusCounts.available,
                label: 'Có sẵn',
                color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
            },
            {
                status: 'in_stock',
                count: statusCounts.in_stock,
                label: 'Trong kho',
                color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
            },
            {
                status: 'sold',
                count: statusCounts.sold,
                label: 'Đã bán',
                color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
            },
            {
                status: 'installed',
                count: statusCounts.installed,
                label: 'Đã lắp',
                color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
            }
        ].filter(item => item.count > 0);
    }, []);

    const handleStatusClick = (typeId, status, typeName) => {
        navigate(`/admin/items/filtered?type=${typeId}&status=${status}&typeName=${encodeURIComponent(typeName)}`);
    };

    const handleAddItem = () => {
        setIsEditing(false);
        setFormData({
            serialCode: '',
            status: 'in_stock',
            ...(activeTab === 'phoneModel' ? {phoneModel: ''} : {item_type: ''}),
            storeId: ''
        });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEditItem = (item) => {
        
        setIsEditing(true);
        setFormData({
            serialCode: item.serialCode,
            status: item.status,
            item_type: item.item_type?._id || item.item_type,
            phoneModel: item.phoneModelId?._id || item.phoneModelId,
            storeId: item.store?._id || item.store
        });
        setEditingId(item._id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            serialCode: '',
            status: 'in_stock',
            ...(activeTab === 'phoneModel' ? {phoneModel: ''} : {item_type: ''}),
            storeId: ''
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
                try {
            const token = localStorage.getItem("token");

            if (isEditing) {
                await axios.put(`http://localhost:9999/api/items/update/${editingId}`, formData, {
                    headers: {Authorization: `Bearer ${token}`},
                });
                toast.success("Item updated successfully");
            } else {
                await axios.post("http://localhost:9999/api/items/create", formData, {
                    headers: {Authorization: `Bearer ${token}`},
                });
                toast.success("Item created successfully");
            }

            handleCloseModal();
            fetchItems(false);
        } catch (error) {
            console.error("Save failed", error);
            toast.error(error.response?.data?.message || "Failed to save item");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <Package className="text-blue-600" size={28}/>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý kho</h1>
                </div>
                <button
                    onClick={handleAddItem}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20}/>
                    <span>Thêm vào kho</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm p-6 flex-shrink-0">
                <div className="flex space-x-1 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('itemType')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === 'itemType'
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Loại linh kiện
                    </button>
                    <button
                        onClick={() => setActiveTab('phoneModel')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === 'phoneModel'
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Mẫu Điện thoại
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 flex-shrink-0">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={20}/>
                            <input
                                type="text"
                                placeholder={activeTab === 'itemType' ? 'Tìm kiếm loại đồ vật...' : 'Tìm kiếm mẫu điện thoại...'}
                                value={searchInput}
                                onChange={handleSearchInputChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="available">Có sẵn</option>
                            <option value="in_stock">Trong kho</option>
                            <option value="sold">Đã bán</option>
                            <option value="installed">Đã lắp</option>
                        </select>
                        <select
                            value={filters.store}
                            onChange={(e) => setFilters(prev => ({...prev, store: e.target.value}))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Tất cả cửa hàng</option>
                            {stores.map(store => (
                                <option key={store._id} value={store._id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Tổng: {Object.values(groupedItems).reduce((total, group) => total + group.items.length, 0)} {activeTab === 'itemType' ? 'đồ vật' : 'mẫu điện thoại'}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        {Object.keys(groupedItems).length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center space-y-2">
                                    <Package size={48} className="text-gray-300"/>
                                    <span>Không tìm thấy đồ</span>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {Object.entries(groupedItems).map(([typeId, typeData]) => (
                                    <div key={typeId} className="border-b border-gray-200">
                                        <button
                                            onClick={() => toggleTypeExpansion(typeId)}
                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                {expandedTypes.has(typeId) ? (
                                                    <ChevronDown size={20} className="text-gray-400"/>
                                                ) : (
                                                    <ChevronRight size={20} className="text-gray-400"/>
                                                )}
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {typeData.typeName}
                                                </h3>
                                                <span
                                                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                    {typeData.items.length} items
                                                </span>
                                            </div>
                                        </button>

                                        {expandedTypes.has(typeId) && (
                                            <div className="border-t border-gray-200">
                                                <div className="p-4">
                                                    {/* Filter controls for this specific type */}
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        <select
                                                            value={typeFilters[typeId]?.status || ''}
                                                            onChange={(e) => handleTypeFilterChange(typeId, 'status', e.target.value)}
                                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="">Tất cả trạng thái</option>
                                                            <option value="available">Có sẵn</option>
                                                            <option value="in_stock">Trong kho</option>
                                                            <option value="sold">Đã bán</option>
                                                            <option value="installed">Đã lắp</option>
                                                        </select>
                                                        <select
                                                            value={typeFilters[typeId]?.store || ''}
                                                            onChange={(e) => handleTypeFilterChange(typeId, 'store', e.target.value)}
                                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="">Tất cả cửa hàng</option>
                                                            {stores.map(store => (
                                                                <option key={store._id}
                                                                        value={store._id}>{store.name}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => {
                                                                handleTypeFilterChange(typeId, 'status', '');
                                                                handleTypeFilterChange(typeId, 'store', '');
                                                            }}
                                                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                                        >
                                                            Xóa bộ lọc
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {typeData.items
                                                            .filter(item => {
                                                                const statusFilter = typeFilters[typeId]?.status;
                                                                const storeFilter = typeFilters[typeId]?.store;
                                                                return (!statusFilter || item.status === statusFilter) &&
                                                                    (!storeFilter || item.store?._id === storeFilter);
                                                            })
                                                            .map((item) => (
                                                                <div key={item._id}
                                                                     className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border-b border-gray-100">
                                                                    <div className="flex-1">
                                                                        <div
                                                                            className="text-sm font-medium text-gray-900">{item.serialCode}</div>
                                                                        <div
                                                                            className="text-xs text-gray-500">{item.store?.name || 'No store'}</div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <button
                                                                            onClick={() => handleEditItem(item)}
                                                                            className="text-blue-600 hover:text-blue-900 transition"
                                                                            title="Edit"
                                                                        >
                                                                            <Edit size={16}/>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(item._id)}
                                                                            className="text-red-600 hover:text-red-900 transition"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 size={16}/>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {isEditing ? 'Chỉnh sửa' : 'Thêm'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'itemType' ? 'Loại linh kiện' : 'Mẫu điện thoại'}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={24}/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mã serial
                                </label>
                                <input
                                    type="text"
                                    name="serialCode"
                                    value={formData.serialCode}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập mã serial"
                                />
                            </div>
                            {activeTab !== 'phoneModel' && (

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại đồ
                                    </label>
                                    <select
                                        name="item_type"
                                        value={formData.item_type}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Chọn loại đồ</option>
                                        {itemTypes.map(type => (
                                            <option key={type._id} value={type._id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {activeTab === 'phoneModel' && (

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điện thoại mẫu
                                    </label>
                                    <select
                                        name="phoneModel"
                                        value={formData.phoneModel}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Chọn điện thoại mẫu</option>
                                        {phoneModels.map(model => (
                                            <option key={model._id} value={model._id}>{model.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cửa hàng
                                </label>
                                <select
                                    name="storeId"
                                    value={formData.store}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {stores.map(store => (
                                        <option key={store._id} value={store._id}>{store.name}</option>
                                    ))}
                                </select>
                            </div>

                            <input
                                type="hidden"
                                name="status"
                                value="in_stock"
                            />

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {isEditing ? 'Cập nhật' : 'Tạo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
