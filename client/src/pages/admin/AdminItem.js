import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Package, Search, X, Settings } from "lucide-react";

export default function AdminItem() {
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [pagination, setPagination] = useState({ 
        currentPage: 1, totalPages: 1, totalCount: 0, limit: 10, hasNextPage: false, hasPrevPage: false 
    });
    // Đổi store thành storeId
    const [filters, setFilters] = useState({ search: '', status: '', item_type: '', storeId: '' }); 
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const initialFormState = {
        name: '', serialCode: '', item_type: '', status: 'in_stock', storeId: '',
        origin: 'new', sourceDevice: '', quality: '', warrantyPeriod: 12, baseCost: '', price: '',
        ram: '', capacity: '', color: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchItemTypes();
        fetchStores();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [pagination.currentPage, filters.status, filters.item_type, filters.storeId]);

    useEffect(() => {
        const timeout = setTimeout(() => { 
            setPagination(prev => ({...prev, currentPage: 1}));
            fetchItems(); 
        }, 500);
        return () => clearTimeout(timeout);
    }, [filters.search]);

    const fetchItemTypes = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`http://localhost:9999/api/item_types/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItemTypes(data.data || []);
        } catch (error) { console.error("Lỗi tải loại linh kiện", error); }
    };

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem("token");
            
            // Gọi API lấy danh sách cửa hàng
            const response = await axios.get(`http://localhost:9999/api/stores`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // LƯU Ý Ở ĐÂY: Xử lý thông minh mọi cấu trúc API trả về
            let storesData = [];
            if (Array.isArray(response.data)) {
                storesData = response.data; // Trường hợp API trả thẳng ra mảng
            } else if (response.data && Array.isArray(response.data.data)) {
                storesData = response.data.data; // Trường hợp API bọc trong object { data: [...] }
            }
            
            setStores(storesData);
            
        } catch (error) { 
            console.error("Lỗi tải cửa hàng:", error);
            // Thử gọi đường dẫn dự phòng nếu đường dẫn trên bị lỗi 404
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`http://localhost:9999/api/stores/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const storesData = Array.isArray(response.data) ? response.data : (response.data.data || []);
                setStores(storesData);
            } catch (err) {
                toast.error("Không thể tải danh sách kho/cửa hàng!");
            }
        }
    };
    const fetchItems = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination.currentPage, limit: pagination.limit,
                search: filters.search, status: filters.status, item_type: filters.item_type, 
                storeId: filters.storeId // Truyền storeId chuẩn xác
            });

            const { data } = await axios.get(`http://localhost:9999/api/items?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems(data.data || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 });
        } catch (error) {
            toast.error("Lỗi tải danh sách linh kiện");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa linh kiện này?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`http://localhost:9999/api/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Xóa thành công");
                fetchItems();
            } catch (error) { toast.error("Xóa thất bại"); }
        }
    };

    const handlePageChange = (newPage) => { setPagination(prev => ({ ...prev, currentPage: newPage })); };

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setEditingId(item._id);
            setFormData({
                name: item.name || '', 
                serialCode: item.serialCode || '', 
                item_type: item.item_type?._id || '',
                status: item.status || 'in_stock', 
                storeId: item.storeId?._id || item.storeId || '', 
                origin: item.origin || 'new',
                sourceDevice: item.sourceDevice || '', 
                quality: item.quality || '', 
                warrantyPeriod: item.warrantyPeriod || (item.origin === 'new' ? 12 : 3),
                baseCost: item.baseCost || '', 
                price: item.price || '',
                ram: item.ram || '', 
                capacity: item.capacity || '', 
                color: item.color || ''
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData(initialFormState);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (isEditing) {
                await axios.put(`http://localhost:9999/api/items/update/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Cập nhật linh kiện thành công");
            } else {
                await axios.post("http://localhost:9999/api/items/create", formData, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("Thêm linh kiện thành công");
            }
            setShowModal(false);
            fetchItems();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi lưu linh kiện");
        }
    };

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const selectedItemTypeObj = itemTypes.find(t => t._id === formData.item_type);
    const selectedItemTypeName = selectedItemTypeObj ? selectedItemTypeObj.name.toLowerCase() : '';
    const isMainboard = selectedItemTypeName.includes('main');
    const isColorPart = selectedItemTypeName.includes('vỏ') || selectedItemTypeName.includes('kính') || selectedItemTypeName.includes('màn') || selectedItemTypeName.includes('camera') || selectedItemTypeName.includes('khay sim');

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Settings className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Kho Linh Kiện</h1>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                    <Plus size={20} /> <span>Nhập linh kiện mới</span>
                </button>
            </div>

            {/* BỘ LỌC */}
            <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm theo tên, mã Serial..." 
                        value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <select value={filters.item_type} onChange={e => setFilters({...filters, item_type: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả phân loại</option>
                    {itemTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                {/* LỌC THEO KHO CHUẨN XÁC */}
                <select value={filters.storeId} onChange={e => setFilters({...filters, storeId: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả kho / cửa hàng</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả trạng thái</option>
                    <option value="in_stock">Đang tồn kho</option>
                    <option value="sold">Đã bán</option>
                    <option value="repairing">Đang lắp ráp</option>
                </select>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                {loading ? (
                    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-5 py-4 font-medium uppercase tracking-wider">Linh kiện / Serial</th>
                                    <th className="px-5 py-4 font-medium uppercase tracking-wider">Phân loại & Thuộc tính</th>
                                    <th className="px-5 py-4 font-medium uppercase tracking-wider">Giá vốn / Bán</th>
                                    <th className="px-5 py-4 font-medium uppercase tracking-wider">Vị trí kho</th>
                                    <th className="px-5 py-4 font-medium uppercase tracking-wider text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr><td colSpan="5" className="py-12 text-center text-gray-500 text-base">Chưa có linh kiện nào trong kho</td></tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">{item.serialCode}</div>
                                                <div className="mt-1.5">
                                                    {item.origin === 'disassembled' ? <span className="inline-block bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Bóc máy</span> : <span className="inline-block bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Hàng mới</span>}
                                                </div>
                                            </td>
                                            
                                            <td className="px-5 py-4">
                                                <span className="block font-medium text-blue-700 mb-1">{item.item_type?.name}</span>
                                                <div className="text-xs text-gray-600 flex flex-col gap-0.5">
                                                    {item.ram && <span>RAM: <strong className="text-gray-800">{item.ram}</strong></span>}
                                                    {item.capacity && <span>ROM: <strong className="text-gray-800">{item.capacity}</strong></span>}
                                                    {item.color && <span>Màu: <strong className="text-gray-800">{item.color}</strong></span>}
                                                    {(!item.ram && !item.capacity && !item.color) && <span className="text-gray-400 italic">Bản tiêu chuẩn</span>}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="text-xs text-gray-400 line-through mb-0.5">{formatMoney(item.baseCost)}</div>
                                                <div className="font-bold text-red-600">{formatMoney(item.price)}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {/* ĐỌC THẲNG TỪ STOREID DO MONGOOSE TRẢ VỀ */}
                                                {item.storeId?.name ? (
                                                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">{item.storeId.name}</span>
                                                ) : (
                                                    <span className="italic text-gray-400">Chưa phân bổ kho</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition mr-1"><Edit size={18}/></button>
                                                <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:bg-red-50 p-2 rounded transition"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4 mt-auto">
                    <span className="text-sm text-gray-600">Trang <span className="font-bold">{pagination.currentPage}</span> / <span className="font-bold">{pagination.totalPages || 1}</span> | Tổng: <span className="font-bold">{pagination.totalCount}</span></span>
                    <div className="flex gap-2">
                        <button disabled={!pagination.hasPrevPage} onClick={() => handlePageChange(pagination.currentPage - 1)} className="px-4 py-2 border bg-white disabled:opacity-40 transition text-sm">Trước</button>
                        <button disabled={!pagination.hasNextPage} onClick={() => handlePageChange(pagination.currentPage + 1)} className="px-4 py-2 border bg-white disabled:opacity-40 transition text-sm">Sau</button>
                    </div>
                </div>
            </div>

            {/* MODAL NHẬP LIỆU */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Sửa thông tin linh kiện' : 'Nhập linh kiện vào kho'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cột 1 */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-blue-800 border-b pb-2 uppercase text-sm">1. Thông tin cơ bản</h3>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Tên linh kiện *</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Mã Serial *</label>
                                        <input required type="text" value={formData.serialCode} onChange={e => setFormData({...formData, serialCode: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Loại linh kiện *</label>
                                        <select required value={formData.item_type} onChange={e => setFormData({...formData, item_type: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">-- Chọn phân loại --</option>
                                            {itemTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
                                        </select>
                                    </div>

                                    {(isMainboard || isColorPart) && (
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-inner mt-2">
                                            <h4 className="text-xs font-bold text-blue-800 mb-3 uppercase">Thông số kỹ thuật</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {isMainboard && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">RAM</label>
                                                            <input type="text" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: 6GB" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">ROM (Bộ nhớ)</label>
                                                            <input type="text" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: 128GB" />
                                                        </div>
                                                    </>
                                                )}
                                                {isColorPart && (
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-semibold mb-1">Màu sắc</label>
                                                        <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 text-sm" placeholder="VD: Đen Midnight..." />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* MỞ LẠI CHỌN KHO ĐỂ BẠN TEST */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Cửa hàng / Kho chứa</label>
                                        <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">-- Chưa phân bổ kho --</option>
                                            {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Trạng thái</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="in_stock">Trong kho (Sẵn sàng)</option>
                                            <option value="sold">Đã bán / Đã ráp máy</option>
                                            <option value="defective">Hàng lỗi</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Cột 2 */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-blue-800 border-b pb-2 uppercase text-sm">2. Nguồn gốc & Giá cả</h3>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Nguồn gốc hàng</label>
                                        <div className="flex gap-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="origin" value="new" checked={formData.origin === 'new'} onChange={e => setFormData({...formData, origin: e.target.value, warrantyPeriod: 12})} /> Mới (New)</label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="origin" value="disassembled" checked={formData.origin === 'disassembled'} onChange={e => setFormData({...formData, origin: e.target.value, warrantyPeriod: 3})} /> Bóc Máy (Zin)</label>
                                        </div>
                                    </div>

                                    {formData.origin === 'disassembled' && (
                                        <div className="bg-purple-50/50 p-4 rounded-xl space-y-4 border border-purple-100 shadow-inner">
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1">Bóc từ thiết bị nào?</label>
                                                <input type="text" value={formData.sourceDevice} onChange={e => setFormData({...formData, sourceDevice: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" placeholder="VD: iPhone 14 Pro vỡ màn" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-purple-900 mb-1">Chất lượng (Ngoại hình)</label>
                                                <input type="text" value={formData.quality} onChange={e => setFormData({...formData, quality: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" placeholder="VD: 98% - Zin nguyên bản" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Giá nhập (VNĐ)</label>
                                            <input type="number" value={formData.baseCost} onChange={e => setFormData({...formData, baseCost: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-red-600">Giá bán ra (VNĐ)</label>
                                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-red-300 bg-red-50/30 p-2.5 rounded-lg outline-none font-bold" />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        <label className="block text-sm font-semibold mb-1">Bảo hành (Tháng)</label>
                                        <input type="number" value={formData.warrantyPeriod} onChange={e => setFormData({...formData, warrantyPeriod: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 font-bold rounded-xl hover:bg-gray-200">Hủy</button>
                                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30">Lưu Dữ Liệu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}