import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Package, Search, ChevronDown, ChevronRight, X } from "lucide-react";

export default function AdminItem() {
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [stores, setStores] = useState([]);
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
        sortOrder: 'asc'
    });
    const [searchInput, setSearchInput] = useState(''); // Separate state for input field
    const [typeFilters, setTypeFilters] = useState({}); // Store filters for each item type
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        serialCode: '',
        status: 'available',
        item_type: '',
        store: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchItemTypes();
        fetchStores();
        fetchItems(true);
        
        // Cleanup timeout on unmount
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, []);

    // Sync searchInput with filters.search when filters change (for programmatic changes)
    useEffect(() => {
        if (searchInput !== filters.search) {
            setSearchInput(filters.search);
        }
    }, [filters.search]);

    useEffect(() => {
        if (!loading && pagination.currentPage) {
            fetchItems(false);
        }
    }, [pagination.currentPage, filters.sortBy, filters.sortOrder]);

    // Memoized grouped items for better performance
    const groupedItems = useMemo(() => {
        if (items.length === 0) return {};
        
        // Group items by item type and filter by search
        return items.reduce((acc, item) => {
            const typeId = item.item_type?._id || 'uncategorized';
            const typeName = item.item_type?.name || 'Uncategorized';
            
            // Filter by item type name if search is active
            if (filters.search && !typeName.toLowerCase().includes(filters.search.toLowerCase())) {
                return acc;
            }
            
            if (!acc[typeId]) {
                acc[typeId] = {
                    typeName,
                    items: []
                };
            }
            acc[typeId].items.push(item);
            return acc;
        }, {});
    }, [items, filters.search]);

    const fetchItemTypes = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`http://localhost:9999/api/item_types/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItemTypes(data.data || []);
        } catch (error) {
            console.error("Fetch item types failed", error);
            toast.error("Failed to fetch item types");
        }
    };

    const fetchStores = async () => {
        try {
            const { data } = await axios.get(`http://localhost:9999/api/stores`);
            setStores(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error("Fetch stores failed", error);
            toast.error("Failed to fetch stores");
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
                sortOrder: filters.sortOrder
            });
            
            const { data } = await axios.get(`http://localhost:9999/api/items?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setItems(data.data || []);
            setPagination(data.pagination);
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
                    headers: { Authorization: `Bearer ${token}` },
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
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFilterChange = (field, value) => {
        if (field === 'search') {
            setSearchInput(value); // Update input immediately
            
            // Clear existing timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Set new timeout for debounced search
            const timeout = setTimeout(() => {
                setFilters(prev => ({ ...prev, [field]: value }));
                setPagination(prev => ({ ...prev, currentPage: 1 }));
            }, 150); // 150ms debounce - more responsive
            
            setSearchTimeout(timeout);
        } else {
            setFilters(prev => ({ ...prev, [field]: value }));
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchInput(value); // Update input immediately for smooth typing
        
        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout for debounced search
        const timeout = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: value }));
            setPagination(prev => ({ ...prev, currentPage: 1 }));
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
        setPagination(prev => ({ ...prev, currentPage: page }));
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

    const getFilteredItems = useCallback((typeId, items) => {
        const filters = typeFilters[typeId] || {};
        return items.filter(item => {
            if (filters.store && item.store?._id !== filters.store) {
                return false;
            }
            if (filters.status && item.status !== filters.status) {
                return false;
            }
            return true;
        });
    }, [typeFilters]);

    const handleAddItem = () => {
        setIsEditing(false);
        setFormData({ 
            serialCode: '', 
            status: 'available',
            item_type: '',
            store: ''
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
            store: item.store?._id || item.store
        });
        setEditingId(item._id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ 
            serialCode: '', 
            status: 'available',
            item_type: '',
            store: ''
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            
            if (isEditing) {
                await axios.put(`http://localhost:9999/api/items/update/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Item updated successfully");
            } else {
                await axios.post("http://localhost:9999/api/items/create", formData, {
                    headers: { Authorization: `Bearer ${token}` },
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
                    <Package className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý đồ vật</h1>
                </div>
                <button 
                    onClick={handleAddItem}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    <span>Thêm đồ vật</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 flex-shrink-0">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm loại đồ vật..."
                                value={searchInput}
                                onChange={handleSearchInputChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Tổng: {pagination.totalCount} đồ vật</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        {Object.keys(groupedItems).length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center space-y-2">
                                    <Package size={48} className="text-gray-300" />
                                    <span>Không tìm thấy đồ vật</span>
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
                                                    <ChevronDown size={20} className="text-gray-400" />
                                                ) : (
                                                    <ChevronRight size={20} className="text-gray-400" />
                                                )}
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {typeData.typeName}
                                                </h3>
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                    {typeData.items.length} items
                                                </span>
                                            </div>
                                        </button>
                                        
                                        {expandedTypes.has(typeId) && (
                                            <div className="border-t border-gray-200">
                                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                                    <div className="flex gap-2">
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
                                                                <option key={store._id} value={store._id}>{store.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Mã serial
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Cửa hàng
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Trạng thái
                                                                </th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Hành động
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {getFilteredItems(typeId, typeData.items).map((item) => (
                                                                <tr key={item._id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {item.serialCode}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">
                                                                            {item.store?.name || 'N/A'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                            item.status === 'available' 
                                                                                ? 'bg-green-100 text-green-800' 
                                                                                : item.status === 'in_stock'
                                                                                ? 'bg-blue-100 text-blue-800'
                                                                                : item.status === 'sold'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : item.status === 'installed'
                                                                                ? 'bg-purple-100 text-purple-800'
                                                                                : 'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                            {item.status === 'available' ? 'Có sẵn' : 
                                                                             item.status === 'in_stock' ? 'Trong kho' :
                                                                             item.status === 'sold' ? 'Đã bán' :
                                                                             item.status === 'installed' ? 'Đã lắp' : item.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        <div className="flex items-center justify-end space-x-2">
                                                                            <button
                                                                                onClick={() => handleEditItem(item)}
                                                                                className="text-blue-600 hover:text-blue-900 transition"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDelete(item._id)}
                                                                                className="text-red-600 hover:text-red-900 transition"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
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
                            <h2 className="text-xl font-semibold text-gray-800">
                                {isEditing ? 'Chỉnh sửa đồ vật' : 'Thêm đồ vật'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={24} />
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
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cửa hàng
                                </label>
                                <select
                                    name="store"
                                    value={formData.store}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {/*<option value="">Chọn cửa hàng</option>*/}
                                    {stores.map(store => (
                                        <option key={store._id} value={store._id}>{store.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="available">Có sẵn</option>
                                    <option value="unavailable">Không có sẵn</option>
                                </select>
                            </div>
                            
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
