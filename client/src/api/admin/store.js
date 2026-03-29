import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Lấy danh sách tất cả cửa hàng
export const fetchStoresApi = async () => {
    try {
        const { data } = await axiosClient.get("/stores");
        // An toàn: Lấy mảng data hoặc data.data
        return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách cửa hàng");
        return [];
    }
};

// Tạo cửa hàng mới
export const createStoreApi = async (payload) => {
    try {
        const { data } = await axiosClient.post("/stores", payload);
        return { success: true, data }; // Trả về data để UI update state
    } catch (error) {
        toast.error(error.response?.data?.message || "Thêm cửa hàng thất bại");
        return { success: false };
    }
};

// Cập nhật cửa hàng
export const updateStoreApi = async (id, payload) => {
    try {
        const { data } = await axiosClient.put(`/stores/${id}`, payload);
        return { success: true, data }; // Trả về data mới
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật cửa hàng thất bại");
        return { success: false };
    }
};

// Xóa cửa hàng
export const deleteStoreApi = async (id) => {
    try {
        await axiosClient.delete(`/stores/${id}`);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi xóa cửa hàng");
        return false;
    }
};