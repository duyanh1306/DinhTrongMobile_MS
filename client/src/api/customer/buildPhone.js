import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy tất cả dữ liệu cần thiết cho trang Build Phone (Dựng máy)
export const fetchBuildPhoneDataApi = async () => {
    try {
        const [recipesRes, itemsRes, itemTypesRes, storesRes] = await Promise.all([
            axiosClient.get('/recipes/all'),
            axiosClient.get('/items/all'),
            axiosClient.get('/item_types/all').catch(() => ({ data: { data: [] } })),
            axiosClient.get('/stores/all') 
        ]);
        
        return {
            recipes: recipesRes.data?.data || [],
            items: itemsRes.data?.data || [],
            itemTypes: itemTypesRes.data?.data || [],
            stores: storesRes.data?.data || storesRes.data || []
        };
    } catch (error) {
        toast.error("Không thể tải dữ liệu.");
        return { recipes: [], items: [], itemTypes: [], stores: [] };
    }
};

// Hàm thêm máy tự ráp vào giỏ hàng
export const addToCartApi = async (payload) => {
    try {
        await axiosClient.post('/cart/add', payload);
        toast.success("Đã thêm máy tự ráp vào giỏ hàng!");
        return true;
    } catch (error) {
        toast.error("Lỗi khi thêm vào giỏ hàng.");
        return false;
    }
};