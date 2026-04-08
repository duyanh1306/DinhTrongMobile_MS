import React, {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {Plus, Edit, Search, ChevronLeft, ChevronRight, X, Wrench, ArrowUpDown, Trash2} from "lucide-react";

import {
    fetchRepairServicesApi,
    createRepairServiceApi,
    updateRepairServiceApi,
    deleteRepairServiceApi
} from "../../api/admin/repairService";

export default function ManageRepairService() {
    const [repairServices, setRepairServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({name: '', price: ''});
    const [editingId, setEditingId] = useState(null);


    useEffect(() => {
        loadRepairServices();
    }, []);

    useEffect(() => {
        if (!loading) {
            loadRepairServices();
        }
    }, [pagination.currentPage, search, sortBy, sortOrder]);

    const loadRepairServices = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            ...(search && {search}),
            sortBy,
            sortOrder
        });

        const data = await fetchRepairServicesApi(params);
        if (data) {
            setRepairServices(data.data || []);
            if (data.pagination) setPagination(data.pagination);
        }
        setLoading(false);
    };

    const handleCreate = () => {
        setIsEditing(false);
        setFormData({name: '', price: ''});
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = (service) => {
        setIsEditing(true);
        setFormData({
            name: service.name,
            price: service.price.toString()
        });
        setEditingId(service._id);
        setShowModal(true);
    };

    const handleDelete = async (service) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${service.name}" không?`)) {
            const isSuccess = await deleteRepairServiceApi(service._id);
            if (isSuccess) {
                toast.success("Xóa dịch vụ sửa chữa thành công");
                loadRepairServices();
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Tên dịch vụ là bắt buộc");
            return;
        }

        const payload = {
            name: formData.name.trim(),
            ...(formData.price && {price: parseFloat(formData.price)})
        };

        let isSuccess = false;
        if (isEditing) {
            isSuccess = await updateRepairServiceApi(editingId, payload);
            if (isSuccess) toast.success("Cập nhật dịch vụ sửa chữa thành công");
        } else {
            isSuccess = await createRepairServiceApi(payload);
            if (isSuccess) toast.success("Tạo dịch vụ sửa chữa thành công");
        }

        if (isSuccess) {
            setShowModal(false);
            loadRepairServices();
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPagination(prev => ({...prev, currentPage: 1}));
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setPagination(prev => ({...prev, currentPage: 1}));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({...prev, currentPage: page}));
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <Wrench className="text-blue-600" size={28}/>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Dịch vụ Sửa chữa</h1>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20}/>
                    <span>Thêm Dịch vụ</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={20}/>
                            <input
                                type="text"
                                placeholder="Tìm kiếm dịch vụ sửa chữa..."
                                value={search}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Tổng cộng: {pagination.totalItems} mục</span>
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
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Tên</span>
                                        {sortBy === 'name' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('price')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Giá</span>
                                        {sortBy === 'price' && (
                                            <ArrowUpDown
                                                className={`w-4 h-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`}/>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : repairServices.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                        Không tìm thấy dịch vụ sửa chữa nào
                                    </td>
                                </tr>
                            ) : (
                                repairServices.map((service) => (
                                    <tr key={service._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {service.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatPrice(service.price)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                            <button
                                                onClick={() => handleEdit(service)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit className="w-4 h-4"/>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div
                            className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Hiển thị{' '}
                                        <span className="font-medium">
                                            {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)}
                                        </span>{' '}
                                        đến{' '}
                                        <span className="font-medium">
                                            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                                        </span>{' '}
                                        của{' '}
                                        <span className="font-medium">{pagination.totalItems}</span> kết quả
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                         aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-5 h-5"/>
                                        </button>
                                        {Array.from({length: pagination.totalPages}, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    page === pagination.currentPage
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-5 h-5"/>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isEditing ? 'Chỉnh sửa Dịch vụ Sửa chữa' : 'Thêm Dịch vụ Sửa chữa'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-500 outline-none"
                                >
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên Dịch vụ
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập tên dịch vụ"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giá
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập giá (tùy chọn)"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        {isEditing ? 'Cập nhật' : 'Tạo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}