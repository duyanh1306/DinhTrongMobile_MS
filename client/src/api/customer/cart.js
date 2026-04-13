import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchCartDataApi = async (userId, activeStore) => {
    try {
        const [cartRes, phonesRes, storesRes] = await Promise.all([
            axiosClient.get(`/cart/${userId}`),
            axiosClient.get(`/phones/all`),
            axiosClient.get('/stores/all')
        ]);

        const storeData = storesRes.data?.data || storesRes.data || [];
        
        let finalActiveStore = activeStore;
        if (!finalActiveStore && storeData.length > 0) {
            finalActiveStore = storeData[0]._id;
        }

        const fetchedCart = cartRes.data?.data || { items: [], totalPrice: 0 };
        
        const storeSpecificItems = fetchedCart.items.filter(item => {
            const iStoreId = item.storeId?._id || item.storeId;
            if (!iStoreId) {
              
                return storeData.length > 0 && String(finalActiveStore) === String(storeData[0]._id);
            }
            return String(iStoreId) === String(finalActiveStore);
        });

     
        const allPhones = phonesRes.data?.data || [];
        const newStockMap = {};
        
        allPhones.forEach(p => {
            const pStoreId = p.storeId?._id || p.storeId;
            if (p.status === 'in_stock' && String(pStoreId) === String(finalActiveStore)) {
                const modelId = typeof p.phoneModelId === 'object' ? p.phoneModelId._id : p.phoneModelId;
                const grade = p.grade || 'Mới'; // 🌟 Yếu tố quan trọng nhất
                const key = `${modelId}-${p.capacity}-${p.colorName}-${grade}`;
                newStockMap[key] = (newStockMap[key] || 0) + 1;
            }
        });

        return {
            stores: storeData,
            activeStore: finalActiveStore,
            cart: { ...fetchedCart, items: storeSpecificItems },
            stockMap: newStockMap
        };

    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        toast.error("Không thể tải dữ liệu giỏ hàng.");
        return null;
    }
};


export const updateCartQuantityApi = async (payload) => {
    try {
        await axiosClient.put('/cart/update-quantity', payload);
        return true;
    } catch (error) {
        toast.error("Lỗi cập nhật số lượng");
        return false;
    }
};


export const removeCartItemApi = async (userId, itemId) => {
    try {
        await axiosClient.delete(`/cart/remove/${userId}/${itemId}`);
        toast.success("Đã xóa sản phẩm");
        return true;
    } catch (error) {
        toast.error("Lỗi khi xóa sản phẩm");
        return false;
    }
};