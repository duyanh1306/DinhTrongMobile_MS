import axiosClient from "../axiosClient"; // Sửa đường dẫn nếu mày để file axiosClient ở chỗ khác
import { toast } from "react-toastify";

export const fetchItemTypesApi = async () => {
    try {
        const { data } = await axiosClient.get("/item_types/all");
        return data.data || [];
    } catch (error) {
        console.error("Lỗi lấy danh sách phân loại linh kiện:", error);
        return [];
    }
};

export const fetchStoresApi = async () => {
    try {
        const res = await axiosClient.get("/stores/all");
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
    } catch (error) {
        console.error("Lỗi lấy danh sách cửa hàng:", error);
        return [];
    }
};

export const fetchItemsPaginatedApi = async (params) => {
    try {
        const { data } = await axiosClient.get(`/items?${params}`);
        return data; // Trả về cả data.data (list) và data.pagination
    } catch (error) {
        toast.error("Lỗi tải danh sách linh kiện");
        return null;
    }
};

export const deleteItemApi = async (id) => {
    try {
        await axiosClient.delete(`/items/${id}`);
        return true;
    } catch (error) {
        toast.error("Xóa linh kiện thất bại");
        return false;
    }
};

export const createItemApi = async (formData) => {
    try {
        await axiosClient.post("/items/create", formData);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi thêm linh kiện");
        return false;
    }
};

export const updateItemApi = async (id, formData) => {
    try {
        await axiosClient.put(`/items/update/${id}`, formData);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi cập nhật linh kiện");
        return false;
    }
};

// Hàm lấy QR Code trả về dạng Blob để in
export const fetchItemQrCodeApi = async (itemId) => {
    try {
        const response = await axiosClient.get(`/items/${itemId}/qr`, {
            responseType: "blob"
        });
        return response.data;
    } catch (error) {
        console.error("Item QR generation error:", error);
        return null;
    }
};