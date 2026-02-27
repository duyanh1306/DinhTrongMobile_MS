import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Package, Search, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function AdminItemType() {
    const [itemTypes, setItemTypes] = useState([]);
    const [loading, setLoading] = useState(true);
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
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        price: '',
        baseCost: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchItemType(true);
    }, []); // Only run on initial mount

    useEffect(() => {
        if (!loading && pagination.currentPage) { // Only fetch if not initial load and pagination exists
            fetchItemType(false);
        }
    }, [pagination.currentPage, filters.search, filters.sortBy, filters.sortOrder]);


    const fetchItemType = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            }
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination?.currentPage || 1,
                limit: pagination?.limit || 10,
                search: filters.search,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            });
            
            const { data } = await axios.get(`http://localhost:9999/api/item_types?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setItemTypes(data.data || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Fetch item types failed", error);
            toast.error(error.response?.data?.message || "Failed to fetch item types");
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item type?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`http://localhost:9999/api/item_types/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Item type deleted successfully");
                fetchItemType(false);
            } catch (error) {
                console.error("Delete failed", error);
                toast.error(error.response?.data?.message || "Failed to delete item type");
            }
        }
    };

    const handleSearchChange = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
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

    const handleAddItemType = () => {
        setIsEditing(false);
        setFormData({ 
            name: '', 
            code: '', 
            price: '', 
            baseCost: ''
        });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEditItemType = (itemType) => {
        setIsEditing(true);
        setFormData({ 
            name: itemType.name, 
            code: itemType.code, 
            price: itemType.price,
            baseCost: itemType.baseCost
        });
        setEditingId(itemType._id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ 
            name: '', 
            code: '', 
            price: '', 
            baseCost: ''
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
            
            const submitData = {
                ...formData,
                price: parseFloat(formData.price),
                baseCost: parseFloat(formData.baseCost)
            };
            
            if (isEditing) {
                await axios.put(`http://localhost:9999/api/item_types/update/${editingId}`, submitData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Item type updated successfully");
            } else {
                await axios.post("http://localhost:9999/api/item_types/create", submitData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Item type created successfully");
            }
            
            handleCloseModal();
            fetchItemType(false);
        } catch (error) {
            console.error("Save failed", error);
            toast.error(error.response?.data?.message || "Failed to save item type");
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
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý loại đồ</h1>
                </div>
                <button 
                    onClick={handleAddItemType}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    <span>Thêm loại đồ</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên loại đồ hoặc mã ..."
                                value={filters.search}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Tổng: {pagination.totalCount} loại đồ</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Tên</span>
                                        {filters.sortBy === 'name' && (
                                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('code')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Mã</span>
                                        {filters.sortBy === 'code' && (
                                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('price')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Giá</span>
                                        {filters.sortBy === 'price' && (
                                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('baseCost')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Giá nhập</span>
                                        {filters.sortBy === 'baseCost' && (
                                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {itemTypes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Package size={48} className="text-gray-300" />
                                            <span>Không tìm thấy loại đồ</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                itemTypes.map((itemType) => (
                                    <tr key={itemType._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {itemType.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {itemType.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                ${itemType.price?.toFixed(2) || '0.00'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                ${itemType.baseCost?.toFixed(2) || '0.00'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditItemType(itemType)}
                                                    className="text-blue-600 hover:text-blue-900 transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {/*<button*/}
                                                {/*    onClick={() => handleDelete(itemType._id)}*/}
                                                {/*    className="text-red-600 hover:text-red-900 transition"*/}
                                                {/*    title="Delete"*/}
                                                {/*>*/}
                                                {/*    <Trash2 size={16} />*/}
                                                {/*</button>*/}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Thông tin {((pagination.currentPage - 1) * pagination.limit) + 1} đến {' '}
                                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} trong{' '}
                                    {pagination.totalCount} kết quả
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} />
                                        <span>Previous</span>
                                    </button>
                                    
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = pagination.currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-2 text-sm border rounded-md ${
                                                        pagination.currentPage === pageNum
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={!pagination.hasNextPage}
                                        className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>Next</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {isEditing ? 'Chỉnh sửa loại đồ' : 'Thêm loại đồ'}
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
                                    Tên
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập tên"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mã
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập mã"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập giá"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá nhập
                                </label>
                                <input
                                    type="number"
                                    name="baseCost"
                                    value={formData.baseCost}
                                    onChange={handleInputChange}
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập giá nhập"
                                />
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
