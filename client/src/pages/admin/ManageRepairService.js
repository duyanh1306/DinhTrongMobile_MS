import React, {useEffect, useState} from "react";
import Swal from 'sweetalert2';
import {Plus, Edit, Search, ChevronLeft, ChevronRight, X, Wrench, ArrowUpDown, Trash2} from "lucide-react";

import {
    fetchRepairServicesApi,
    createRepairServiceApi,
    updateRepairServiceApi,
    deleteRepairServiceApi
} from "../../api/admin/repairService";
import { PART_CODES, getPartLabel } from "../../constants/partCodes";

const formatPriceInput = (val) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parsePriceInput = (str) => {
    if (!str) return '';
    return str.toString().replace(/\./g, '');
};

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
    const [editingDots, setEditingDots] = useState(null); 
    const [jumpPage, setJumpPage] = useState('');

    if (totalPages <= 1) return null;

    const handleJumpSubmit = () => {
        let page = parseInt(jumpPage, 10);
        if (!isNaN(page)) {
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            onPageChange(page);
        }
        setEditingDots(null);
        setJumpPage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleJumpSubmit();
        } else if (e.key === 'Escape') {
            setEditingDots(null);
            setJumpPage('');
        }
    };

    const renderInteractiveDots = (position) => {
        if (editingDots === position) {
            return (
                <input
                    key={`input-${position}`}
                    type="number"
                    autoFocus
                    min={1}
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    onBlur={handleJumpSubmit}
                    onKeyDown={handleKeyDown}
                    className="w-14 px-1 py-1.5 border-2 border-blue-500 rounded-lg text-center text-sm font-bold text-blue-700 outline-none hide-arrows shadow-sm"
                    placeholder="..."
                />
            );
        }
        return (
            <button
                key={`dots-${position}`}
                onClick={() => setEditingDots(position)}
                className="px-2 text-gray-400 font-bold tracking-widest hover:text-blue-600 transition cursor-pointer"
                title="Nhấn để nhập số trang"
            >
                ...
            </button>
        );
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = startPage + maxVisible - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button key="first" onClick={() => onPageChange(1)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">1</button>
            );
            if (startPage > 2) {
                pages.push(renderInteractiveDots('start'));
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm ${
                        i === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(renderInteractiveDots('end'));
            }
            pages.push(
                <button key="last" onClick={() => onPageChange(totalPages)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">{totalPages}</button>
            );
        }

        return pages;
    };

    return (
        <div className="flex gap-1.5 items-center">
            <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm"
            >
                Trước
            </button>
            
            {renderPageNumbers()}
            
            <button
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm"
            >
                Sau
            </button>
            
            <style dangerouslySetInnerHTML={{__html: `
                .hide-arrows::-webkit-outer-spin-button,
                .hide-arrows::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .hide-arrows {
                    -moz-appearance: textfield;
                }
            `}} />
        </div>
    );
};

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
    const [formData, setFormData] = useState({ name: '', price: '', partCode: '' });
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
        const timestamp = new Date().getTime();
        const params = new URLSearchParams({
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            ...(search && {search}),
            sortBy,
            sortOrder,
            t: timestamp
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
        setFormData({ name: '', price: '', partCode: '' });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = (service) => {
        setIsEditing(true);
        setFormData({
            name: service.name,
            price: service.price ? service.price.toString() : '',
            partCode: service.partCode || '',
        });
        setEditingId(service._id);
        setShowModal(true);
    };

    const handleDelete = async (service) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?',
            text: `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}" không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition mx-2',
                cancelButton: 'bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition mx-2'
            }
        });

        if (result.isConfirmed) {
            const isSuccess = await deleteRepairServiceApi(service._id);
            if (isSuccess) {
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Xóa dịch vụ sửa chữa thành công',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                loadRepairServices();
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Tên dịch vụ là bắt buộc',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700' }
            });
            return;
        }

        if (!formData.partCode) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Vui lòng chọn nhóm linh kiện (Pin, Màn hình...)',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700' }
            });
            return;
        }

        const payload = {
            name: formData.name.trim(),
            partCode: formData.partCode,
            ...(formData.price && { price: parseFloat(parsePriceInput(formData.price)) }),
        };

        let isSuccess = false;
        if (isEditing) {
            isSuccess = await updateRepairServiceApi(editingId, payload);
            if (isSuccess) {
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Cập nhật dịch vụ sửa chữa thành công',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } else {
            isSuccess = await createRepairServiceApi(payload);
            if (isSuccess) {
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Tạo dịch vụ sửa chữa thành công',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nhóm LK
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
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : repairServices.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {service.partCode
                                                ? `${getPartLabel(service.partCode)} (${service.partCode})`
                                                : <span className="text-red-500 italic">Chưa gán</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {service.price ? formatPrice(service.price) : ''}
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

                    {!loading && pagination.totalItems > 0 && (
                        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto">
                            <span className="text-sm text-gray-600">
                                Trang <span className="font-bold text-blue-600">{pagination.currentPage}</span> / <span className="font-bold">{pagination.totalPages || 1}</span> | Tổng cộng: <span className="font-bold text-gray-800">{pagination.totalItems}</span> mục
                            </span>
                            <CustomPagination 
                                currentPage={pagination.currentPage} 
                                totalPages={pagination.totalPages} 
                                onPageChange={handlePageChange} 
                            />
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
                                        Nhóm linh kiện (khớp Recipe)
                                    </label>
                                    <select
                                        value={formData.partCode}
                                        onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">-- Chọn nhóm --</option>
                                        {PART_CODES.map((p) => (
                                            <option key={p.code} value={p.code}>{p.label} ({p.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giá
                                    </label>
                                    <input
                                        type="text"
                                        value={formatPriceInput(formData.price)}
                                        onChange={(e) => setFormData({...formData, price: parsePriceInput(e.target.value)})}
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