import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Edit, Trash2, Search, X, Smartphone } from "lucide-react";

import { 
    fetchPhoneBrandsApi, 
    createPhoneBrandApi, 
    updatePhoneBrandApi, 
    deletePhoneBrandApi 
} from "../../api/admin/phoneBrand";

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }

    return (
        <div className="flex gap-1.5 items-center">
            <button 
                disabled={currentPage <= 1} 
                onClick={() => onPageChange(currentPage - 1)} 
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm"
            >
                Trước
            </button>
            {pages.map((p, i) => (
                <button
                    key={i}
                    disabled={p === '...'}
                    onClick={() => p !== '...' && onPageChange(p)}
                    className={`px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm ${
                        p === currentPage 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : p === '...' 
                                ? 'bg-transparent text-gray-500 border-transparent shadow-none cursor-default px-1' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {p}
                </button>
            ))}
            <button 
                disabled={currentPage >= totalPages} 
                onClick={() => onPageChange(currentPage + 1)} 
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition text-sm rounded-lg shadow-sm"
            >
                Sau
            </button>
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
        const params = new URLSearchParams({
            page: pagination.currentPage, 
            limit: pagination.limit, 
            search: search
        });

        const data = await fetchPhoneBrandsApi(params);
        if (data) {
            setBrands(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 });
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa hãng này? Sẽ không thể hoàn tác!")) {
            const isSuccess = await deletePhoneBrandApi(id);
            if (isSuccess) {
                toast.success("Xóa hãng thành công");
                loadBrands();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            return toast.warning("Vui lòng nhập tên hãng!");
        }

        let isSuccess = false;
        if (isEditing) {
            isSuccess = await updatePhoneBrandApi(editingId, formData);
            if (isSuccess) toast.success("Cập nhật hãng thành công");
        } else {
            isSuccess = await createPhoneBrandApi(formData);
            if (isSuccess) toast.success("Thêm hãng mới thành công");
        }

        if (isSuccess) {
            setShowModal(false);
            loadBrands();
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
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Smartphone className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Hãng sản xuất</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /> <span>Thêm Hãng mới</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm kiếm theo tên hãng..." 
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
                    />
                </div>
            </div>

            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                {loading ? (
                    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider w-24">STT</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Tên hãng sản xuất</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {brands.length === 0 ? (
                                    <tr><td colSpan="3" className="py-12 text-center text-gray-500 text-base">Chưa có dữ liệu hãng sản xuất</td></tr>
                                ) : (
                                    brands.map((brand, index) => (
                                        <tr key={brand._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-gray-500">
                                                {(pagination.currentPage - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-800 text-base">{brand.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleOpenModal(brand)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition mr-2" title="Sửa"><Edit size={18}/></button>
                                                <button onClick={() => handleDelete(brand._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Xóa"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
              
                <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4 mt-auto">
                    <span className="text-sm text-gray-600">Trang <span className="font-bold text-blue-600">{pagination.currentPage}</span> / <span className="font-bold">{pagination.totalPages || 1}</span> | Tổng: <span className="font-bold text-gray-800">{pagination.totalCount}</span></span>
                    <CustomPagination 
                        currentPage={pagination.currentPage} 
                        totalPages={pagination.totalPages} 
                        onPageChange={handlePageChange} 
                    />
                </div>
            </div>

          
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Sửa thông tin Hãng' : 'Thêm Hãng mới'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">Tên Hãng sản xuất <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        autoFocus
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                                        placeholder="VD: Apple, Samsung, Xiaomi..." 
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition">Hủy</button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/30 transition">
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