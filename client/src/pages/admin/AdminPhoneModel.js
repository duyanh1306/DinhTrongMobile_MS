import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Smartphone, Search, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function AdminPhoneModel() {
    const [phoneModels, setPhoneModels] = useState([]);
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
        brand: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchPhoneModel(true);
    }, []); // Only run on initial mount

    useEffect(() => {
        if (!loading && pagination.currentPage) { // Only fetch if not initial load and pagination exists
            fetchPhoneModel(false);
        }
    }, [pagination.currentPage, filters.search, filters.sortBy, filters.sortOrder]);

    const fetchPhoneModel = async (isInitialLoad = false) => {
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
            
            const { data } = await axios.get(`http://localhost:9999/api/phone_models?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setPhoneModels(data.data || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Fetch phone models failed", error);
            toast.error(error.response?.data?.message || "Failed to fetch phone models");
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this phone model?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`http://localhost:9999/api/phone_models/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Phone model deleted successfully");
                fetchPhoneModel(false);
            } catch (error) {
                console.error("Delete failed", error);
                toast.error(error.response?.data?.message || "Failed to delete phone model");
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

    const handleAddPhoneModel = () => {
        setIsEditing(false);
        setFormData({ name: '', brand: '' });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEditPhoneModel = (model) => {
        setIsEditing(true);
        setFormData({ 
            name: model.name, 
            brand: model.brand 
        });
        setEditingId(model._id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ name: '', brand: '' });
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
                // Update existing phone model
                await axios.put(`http://localhost:9999/api/phone_models/update/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Phone model updated successfully");
            } else {
                // Create new phone model
                await axios.post("http://localhost:9999/api/phone_models/create", formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Phone model created successfully");
            }
            
            handleCloseModal();
            fetchPhoneModel(false);
        } catch (error) {
            console.error("Save failed", error);
            toast.error(error.response?.data?.message || "Failed to save phone model");
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
                    <Smartphone className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Manage Phone Models</h1>
                </div>
                <button 
                    onClick={handleAddPhoneModel}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    <span>Add Phone Model</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search phone models or brands ..."
                                value={filters.search}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Total: {pagination.totalCount} items</span>
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
                                        <span>Model Name</span>
                                        {filters.sortBy === 'name' && (
                                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('brand')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Brand</span>
                                        {filters.sortBy === 'brand' && (
                                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {phoneModels.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Smartphone size={48} className="text-gray-300" />
                                            <span>No phone models found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                phoneModels.map((model) => (
                                    <tr key={model._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {model.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {model.brand}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditPhoneModel(model)}
                                                    className="text-blue-600 hover:text-blue-900 transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {/*<button*/}
                                                {/*    onClick={() => handleDelete(model._id)}*/}
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
                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                                    {pagination.totalCount} results
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {isEditing ? 'Edit Phone Model' : 'Add Phone Model'}
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
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter model name"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter brand name"
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {isEditing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
