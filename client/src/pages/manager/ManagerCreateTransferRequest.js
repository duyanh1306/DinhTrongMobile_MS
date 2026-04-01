import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2, Save } from 'lucide-react';

// IMPORT TỪ FILE API VỪA TẠO
import { 
    fetchStoresApi, 
    fetchItemTypesApi, 
    fetchUserStoreApi, 
    createTransferRequestApi 
} from "../../api/manager/createTransferRequest";

const ManagerCreateTransferRequest = () => {
    const [stores, setStores] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [userStore, setUserStore] = useState(null);
    const [fromStoreId, setFromStoreId] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [tableRows, setTableRows] = useState([
        { itemTypeId: '', quantity: 1 }
    ]);

    const user = JSON.parse(localStorage.getItem('user'));

    // ==============================================================
    // GỌI API KHỞI TẠO DATA
    // ==============================================================
    useEffect(() => {
        const loadInitialData = async () => {
            clearUserStoreCache();
            
            // Chạy song song 3 API cho nhanh
            const [fetchedStores, fetchedItemTypes] = await Promise.all([
                fetchStoresApi(),
                fetchItemTypesApi(),
            ]);
            
            setStores(fetchedStores);
            setItemTypes(fetchedItemTypes);
            
            // Tìm userStore
            await loadUserStore();
        };

        loadInitialData();
    }, []);

    const clearUserStoreCache = () => {
        localStorage.removeItem('userStore');
        setUserStore(null);
    };

    const loadUserStore = async () => {
        const cachedUserStore = localStorage.getItem('userStore');
        if (cachedUserStore) {
            setUserStore(JSON.parse(cachedUserStore));
            return;
        }

        const freshUser = JSON.parse(localStorage.getItem('user') || '{}');
        const fetchedUserStore = await fetchUserStoreApi(freshUser._id || freshUser.id);
        
        if (fetchedUserStore) {
            setUserStore(fetchedUserStore);
            localStorage.setItem('userStore', JSON.stringify(fetchedUserStore));
        }
    };

    // ==============================================================
    // XỬ LÝ TABLE UI
    // ==============================================================
    const addRow = () => {
        setTableRows([...tableRows, { itemTypeId: '', quantity: 1 }]);
    };

    const removeRow = (index) => {
        if (tableRows.length > 1) {
            const newRows = tableRows.filter((_, i) => i !== index);
            setTableRows(newRows);
        }
    };

    const updateRow = (index, field, value) => {
        const newRows = [...tableRows];
        
        if (field === 'quantity') {
            const numValue = parseInt(value) || 1;
            if (numValue > 50) {
                toast.error('Số lượng tối đa là 50');
                return;
            }
            if (numValue < 1) {
                toast.error('Số lượng tối thiểu là 1');
                return;
            }
        }
        
        newRows[index][field] = value;
        setTableRows(newRows);
    };

    // ==============================================================
    // XỬ LÝ SUBMIT YÊU CẦU CHUYỂN KHO
    // ==============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fromStoreId) {
            toast.error('Please select a source store');
            return;
        }

        if (!userStore) {
            toast.error('Your store information is not available');
            return;
        }

        if (fromStoreId === userStore._id) {
            toast.error('Source and destination stores cannot be the same');
            return;
        }

        const validRows = tableRows.filter(row => row.itemTypeId && row.quantity > 0);
        if (validRows.length === 0) {
            toast.error('Please add at least one item with valid quantity');
            return;
        }

        const invalidQuantities = validRows.filter(row => row.quantity > 50);
        if (invalidQuantities.length > 0) {
            toast.error('Số lượng tối đa cho mỗi sản phẩm là 50');
            return;
        }

        const selectedTypesArr = validRows.map(row => row.itemTypeId);
        const uniqueItemTypes = [...new Set(selectedTypesArr)];
        if (selectedTypesArr.length !== uniqueItemTypes.length) {
            toast.error('Duplicate item types are not allowed');
            return;
        }

        setLoading(true);

        const items = validRows.map(row => ({
            itemTypeId: row.itemTypeId,
            quantity: parseInt(row.quantity)
        }));

        const transferRequestData = {
            fromStoreId,
            toStoreId: userStore._id,
            requestedBy: user._id || user.id,
            items,
            note,
            itemType: validRows.map(row => ({
                itemTypes: row.itemTypeId,
                quantity: parseInt(row.quantity)
            }))
        };

        const success = await createTransferRequestApi(transferRequestData);
        if (success) {
            setFromStoreId('');
            setNote('');
            setTableRows([{ itemTypeId: '', quantity: 1 }]);
        }
        
        setLoading(false);
    };

    const availableStores = Array.isArray(stores) ? stores.filter(store => store._id !== userStore?._id) : [];

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Tạo Yêu Cầu Chuyển Kho</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cửa hàng đi *
                            </label>
                            <select
                                value={fromStoreId}
                                onChange={(e) => setFromStoreId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Chọn cửa hàng nguồn</option>
                                {availableStores.map(store => (
                                    <option key={store._id} value={store._id}>
                                        {store.name} ({store.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cửa hàng đến (Cửa hàng của bạn)
                            </label>
                            <input
                                type="text"
                                value={userStore ? `${userStore.name} (${userStore.code})` : 'Đang tải...'}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            />
                        </div>
                    </div>

                    {/* BẢNG CHỌN LINH KIỆN */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Linh kiện cần chuyển *
                        </label>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Loại linh kiện
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số lượng
                                    </th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {tableRows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2">
                                            <select
                                                value={row.itemTypeId}
                                                onChange={(e) => updateRow(index, 'itemTypeId', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Chọn loại sản phẩm</option>
                                                {itemTypes.map(itemType => (
                                                    <option key={itemType._id} value={itemType._id}>
                                                        {itemType.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={row.quantity}
                                                onChange={(e) => updateRow(index, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                required
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(index)}
                                                disabled={tableRows.length === 1}
                                                className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            onClick={addRow}
                            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            <Plus size={16}/>
                            Thêm linh kiện yêu cầu
                        </button>
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Thêm ghi chú..."
                        />
                    </div>

                    {/* Nút Submit */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save size={16}/>
                            {loading ? 'Đang tạo...' : 'Tạo Yêu Cầu Chuyển Kho'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManagerCreateTransferRequest;