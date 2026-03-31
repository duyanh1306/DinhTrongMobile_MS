import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';
import {Plus, Trash2, Save} from 'lucide-react';

const TechRequest = () => {
    const [stores, setStores] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [userStore, setUserStore] = useState(null);
    const [fromStoreId, setFromStoreId] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [tableRows, setTableRows] = useState([
        {itemTypeId: '', quantity: 1}
    ]);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        // Clear cache to ensure fresh data
        clearUserStoreCache();
        fetchStores();
        fetchItemTypes();
        fetchUserStore();
    }, []);

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching stores with token:', token);

            // Try without /all first (like in ManagerTransferRequestDetail.js)
            const response = await axios.get(`${process.env.REACT_APP_IP_ADDRESS || 'http://localhost:9999'}/api/stores`, {
                headers: {Authorization: `Bearer ${token}`}
            });

            console.log('Stores API response:', response);
            console.log('Stores response data:', response.data);

            // Handle different response structures
            let storesArray = [];
            if (Array.isArray(response.data)) {
                storesArray = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                storesArray = response.data.data;
            }

            setStores(storesArray);
        } catch (error) {
            console.error('Error fetching stores:', error.response || error);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            setStores([]); // Ensure stores remains an array on error
            toast.error('Failed to fetch stores');
        }
    };

    const fetchItemTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching item types with token:', token);

            // Try without /all first (similar to stores) and add pagination to get all
            const response = await axios.get(`${process.env.REACT_APP_IP_ADDRESS || 'http://localhost:9999'}/api/item_types?limit=100`, {
                headers: {Authorization: `Bearer ${token}`}
            });

            console.log('Item types API response:', response);
            console.log('Item types response data:', response.data);
            console.log('Pagination info:', response.data.pagination);

            // Handle different response structures
            let itemTypesArray = [];
            if (Array.isArray(response.data)) {
                itemTypesArray = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                itemTypesArray = response.data.data;
            }

            console.log('Final item types array:', itemTypesArray);
            console.log('Item types count:', itemTypesArray.length);
            setItemTypes(itemTypesArray);
        } catch (error) {
            console.error('Error fetching item types:', error.response || error);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            setItemTypes([]); // Ensure itemTypes remains an array on error
            toast.error('Failed to fetch item types');
        }
    };

    const clearUserStoreCache = () => {
        localStorage.removeItem('userStore');
        setUserStore(null);
    };

    const fetchUserStore = async () => {
        try {
            // First, check if user store is already cached in localStorage
            const cachedUserStore = localStorage.getItem('userStore');
            if (cachedUserStore) {
                const parsedStore = JSON.parse(cachedUserStore);
                setUserStore(parsedStore);
                return;
            }

            const token = localStorage.getItem('token');
            // Get fresh user data
            const freshUser = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Fetching user store with token:', token);
            console.log('Fresh user data:', freshUser);

            // Use the same endpoint as fetchStores
            const response = await axios.get(`${process.env.REACT_APP_IP_ADDRESS || 'http://localhost:9999'}/api/stores`, {
                headers: {Authorization: `Bearer ${token}`}
            });

            console.log('User store API response:', response);
            console.log('User store response data:', response.data);

            // Handle different response structures
            let storesData = [];
            if (Array.isArray(response.data)) {
                storesData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                storesData = response.data.data;
            }

            console.log('Final stores data:', storesData);
            console.log('User ID:', freshUser._id, freshUser.id);

            // Find the store where the current user is a staff member (same approach as ManagerTransferRequestDetail.js)
            const userStoreData = storesData.find((store) =>
                store.staff && store.staff.includes(freshUser._id || freshUser.id)
            );

            console.log('Found user store:', userStoreData);

            if (userStoreData) {
                setUserStore(userStoreData);
                // Cache the user store in localStorage for future use
                localStorage.setItem('userStore', JSON.stringify(userStoreData));
            } else {
                console.error('User store not found in stores data');
                toast.error('You are not assigned to any store');
            }
        } catch (error) {
            console.error('Error fetching user store:', error.response || error);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            toast.error('Failed to fetch user store information');
        }
    };

    const addRow = () => {
        setTableRows([...tableRows, {itemTypeId: '', quantity: 1}]);
    };

    const removeRow = (index) => {
        if (tableRows.length > 1) {
            const newRows = tableRows.filter((_, i) => i !== index);
            setTableRows(newRows);
        }
    };

    const updateRow = (index, field, value) => {
        const newRows = [...tableRows];
        
        // Validate quantity max limit of 50
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fromStoreId) {
            toast.error('Vui lòng chọn cửa hàng nguồn');
            return;
        }

        if (!userStore) {
            toast.error('Thông tin cửa hàng của bạn không khả dụng');
            return;
        }

        if (fromStoreId === userStore._id) {
            toast.error('Cửa hàng nguồn và đích không thể giống nhau');
            return;
        }

        // Validate table rows
        const validRows = tableRows.filter(row => row.itemTypeId && row.quantity > 0);
        if (validRows.length === 0) {
            toast.error('Vui lòng thêm ít nhất một linh kiện với số lượng hợp lệ');
            return;
        }

        // Check for quantity exceeding maximum limit
        const invalidQuantities = validRows.filter(row => row.quantity > 50);
        if (invalidQuantities.length > 0) {
            toast.error('Số lượng tối đa cho mỗi linh kiện là 50');
            return;
        }

        // Check for duplicate item types
        const itemTypes = validRows.map(row => row.itemTypeId);
        const uniqueItemTypes = [...new Set(itemTypes)];
        if (itemTypes.length !== uniqueItemTypes.length) {
            toast.error('Không cho phép các loại linh kiện trùng lặp');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            // Prepare items array for the backend
            const items = validRows.map(row => ({
                itemTypeId: row.itemTypeId,
                quantity: parseInt(row.quantity)
            }));

            const transferRequestData = {
                fromStoreId,
                toStoreId: userStore._id,
                requestedBy: user._id,
                items,
                note,
                itemType: validRows.map(row => (
                    {
                        itemTypes: row.itemTypeId,
                        quantity: parseInt(row.quantity)
                    }
                    ))
            };

            const response = await axios.post(
                `${process.env.REACT_APP_IP_ADDRESS || 'http://localhost:9999'}/api/transfer-requests`,
                transferRequestData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            toast.success('Yêu cầu chuyển kho đã được tạo thành công!');

            // Reset form
            setFromStoreId('');
            setNote('');
            setTableRows([{itemTypeId: '', quantity: 1}]);

        } catch (error) {
            console.error('Error creating transfer request:', error);
            toast.error(error.response?.data?.message || 'Failed to create transfer request');
        } finally {
            setLoading(false);
        }
    };

    const availableStores = Array.isArray(stores) ? stores.filter(store => store._id !== userStore?._id) : [];

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Tạo Yêu Cầu Linh Kiện</h1>

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
                                                <option value="">Chọn loại linh kiện</option>
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

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save size={16}/>
                            {loading ? 'Đang tạo...' : 'Tạo Yêu Cầu Linh Kiện'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TechRequest;