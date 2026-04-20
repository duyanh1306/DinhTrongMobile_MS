import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Search, X, Smartphone } from "lucide-react";

import { 
    fetchPhoneBrandsApi, 
    createPhoneBrandApi, 
    updatePhoneBrandApi, 
    deletePhoneBrandApi 
} from "../../api/admin/phoneBrand";

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

export default function AdminPhoneBrand() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [pagination, setPagination] = useState({ 
        currentPage: 1, totalPages: 1, totalCount: 0, limit: 10, hasNextPage: false, hasPrevPage: false 
    });
    const [search, setSearch] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => {
        loadBrands();
    }, [pagination.currentPage]);

    useEffect(() => {
        const timeout = setTimeout(() => { 
            setPagination(prev => ({...prev, currentPage: 1}));
            loadBrands(); 
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const loadBrands = async () => {
        setLoading(true);
        const timestamp = new Date().getTime();
        const params = new URLSearchParams({
            page: pagination.currentPage, 
            limit: pagination.limit, 
            search: search,
            t: timestamp
        });

        const data = await fetchPhoneBrandsApi(params);
        if (data) {
            setBrands(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 });
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?',
            text: "Bạn có chắc chắn muốn xóa hãng này? Sẽ không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 transition mx-2 shadow-md',
                cancelButton: 'bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition mx-2 shadow-md'
            }
        });

        if (result.isConfirmed) {
            const isSuccess = await deletePhoneBrandApi(id);
            if (isSuccess) {
                Swal.fire({ title: 'Thành công!', text: 'Đã xóa hãng sản xuất.', icon: 'success', timer: 1500, showConfirmButton: false });
                loadBrands();
            } else {
                Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi xóa hãng.', buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }});
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = formData.name.trim();

        if (!trimmedName) {
            return Swal.fire({
                icon: 'warning',
                title: 'Thiếu thông tin!',
                text: 'Vui lòng nhập tên hãng!',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }

        const isDuplicate = brands.some(b => 
            b.name.toLowerCase() === trimmedName.toLowerCase() && b._id !== editingId
        );

        if (isDuplicate) {
            return Swal.fire({
                icon: 'error',
                title: 'Trùng lặp dữ liệu!',
                text: `Hãng "${trimmedName}" đã tồn tại trên hệ thống. Vui lòng nhập tên khác!`,
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }

        let isSuccess = false;
        if (isEditing) {
            isSuccess = await updatePhoneBrandApi(editingId, { name: trimmedName });
        } else {
            isSuccess = await createPhoneBrandApi({ name: trimmedName });
        }

        if (isSuccess) {
            setShowModal(false);
            Swal.fire({
                title: 'Thành công!',
                text: isEditing ? 'Cập nhật hãng thành công!' : 'Thêm hãng mới thành công!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            loadBrands();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra, tên hãng có thể đã bị trùng. Vui lòng kiểm tra lại!',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }
    };

    const handlePageChange = (newPage) => { 
        setPagination(prev => ({ ...prev, currentPage: newPage })); 
    };

    const handleOpenModal = (brand = null) => {
        if (brand) {
            setIsEditing(true);
            setEditingId(brand._id);
            setFormData({ name: brand.name });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({ name: '' });
        }
        setShowModal(true);
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Smartphone className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Hãng sản xuất</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /> <span>Thêm Hãng mới</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-center border border-gray-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm kiếm theo tên hãng..." 
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col border border-gray-200">
                {loading ? (
                    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold tracking-wider w-24">STT</th>
                                    <th className="px-6 py-4 font-semibold tracking-wider">Tên hãng sản xuất</th>
                                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {brands.length === 0 ? (
                                    <tr><td colSpan="3" className="py-12 text-center text-gray-500 text-base border-dashed border border-gray-200 mx-4 my-4 rounded-xl">Chưa có dữ liệu hãng sản xuất</td></tr>
                                ) : (
                                    brands.map((brand, index) => (
                                        <tr key={brand._id} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4 text-gray-500 font-medium">
                                                {(pagination.currentPage - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-800 text-base">{brand.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleOpenModal(brand)} className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition mr-2 shadow-sm border border-blue-100" title="Sửa"><Edit size={18}/></button>
                                                <button onClick={() => handleDelete(brand._id)} className="text-red-500 bg-red-50 hover:bg-red-600 hover:text-white p-2 rounded-lg transition shadow-sm border border-red-100" title="Xóa"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {!loading && pagination.totalCount > 0 && (
                    <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto">
                        <span className="text-sm text-gray-600">Trang <span className="font-bold text-blue-600">{pagination.currentPage}</span> / <span className="font-bold">{pagination.totalPages || 1}</span> | Tổng: <span className="font-bold text-gray-800">{pagination.totalCount}</span> hãng</span>
                        <CustomPagination 
                            currentPage={pagination.currentPage} 
                            totalPages={pagination.totalPages} 
                            onPageChange={handlePageChange} 
                        />
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Sửa thông tin Hãng' : 'Thêm Hãng mới'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition bg-white p-1 rounded-full"><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Tên Hãng sản xuất <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        autoFocus
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-800" 
                                        placeholder="VD: Apple, Samsung, Xiaomi..." 
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition shadow-sm">Hủy bỏ</button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition">
                                    {isEditing ? 'Lưu thay đổi' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}