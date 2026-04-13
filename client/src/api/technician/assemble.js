import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchAssembleDataApi = async () => {
    try {
        const [recipesRes, itemsRes, itemTypesRes, storesRes] = await Promise.all([
            axiosClient.get('/recipes/all'),
            axiosClient.get('/items/all'),
            axiosClient.get('/item_types/all').catch(() => ({ data: { data: [] } })),
            axiosClient.get('/stores/all')
        ]);
        
        return {
            recipes: recipesRes.data.data || [],
            items: itemsRes.data.data || [],
            itemTypes: itemTypesRes.data.data || [],
            stores: storesRes.data.data || storesRes.data || []
        };
    } catch (error) {
        toast.error("Lỗi khi tải dữ liệu dựng máy.");
        return null;
    }
};

export const submitAssemblePhoneApi = async (formData) => {
    try {
        const res = await axiosClient.post("/phones/assemble", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    } catch (error) {
        toast.error(error.response?.data?.message || "Dựng máy thất bại.");
        return null;
    }
};