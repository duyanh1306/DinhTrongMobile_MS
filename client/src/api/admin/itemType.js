import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchItemTypesPaginatedApi = async (params) => {
    try {
        const { data } = await axiosClient.get(`/item_types?${params}`);
        return data; 
    } catch (error) {
        toast.error("Lỗi tải dữ liệu Phân loại linh kiện");
        return null;
    }
};

export const fetchAllRecipesApi = async () => {
    try {
        const res = await axiosClient.get("/recipes/all");
        return res.data?.data || [];
    } catch (error) {
        console.error("Lỗi tải công thức máy ráp:", error);
        return [];
    }
};

export const deleteItemTypeApi = async (id) => {
    try {
        await axiosClient.delete(`/item_types/delete/${id}`);
        return true;
    } catch (error) {
        toast.error("Lỗi khi xóa danh mục");
        return false;
    }
};

export const createItemTypeApi = async (submitData) => {
    try {
        // AxiosClient đã được setup nhận FormData bình thường
        await axiosClient.post(`/item_types/create`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi thêm mới");
        return false;
    }
};

export const updateItemTypeApi = async (id, submitData) => {
    try {
        await axiosClient.put(`/item_types/update/${id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
        return false;
    }
};