import axiosClient from "../axiosClient";
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

export const fetchItemsPaginatedApi = async (params) => {
    try {
        const { data } = await axiosClient.get(`/items?${params}`);
        return data; 
    } catch (error) {
        toast.error("Lỗi tải danh sách linh kiện");
        return null;
    }
};

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