import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchStoresAndModelsApi = async () => {
    try {
        const [storesRes, modelsRes] = await Promise.all([
            axiosClient.get("/stores/all"),
            axiosClient.get("/phone_models/all")
        ]);
        
        return {
            stores: Array.isArray(storesRes.data) ? storesRes.data : storesRes.data.data || [],
            models: Array.isArray(modelsRes.data) ? modelsRes.data : modelsRes.data.data || []
        };
    } catch (error) {
        toast.error("Lỗi lấy dữ liệu Cửa hàng / Dòng máy");
        return { stores: [], models: [] };
    }
};

export const fetchPhonesApi = async (storeId) => {
    try {
        const url = storeId ? `/phones?storeId=${storeId}` : `/phones`;
        
        const { data } = await axiosClient.get(url);
        return data.data || [];
    } catch (error) {
        toast.error("Lỗi tải danh sách máy");
        return [];
    }
};

export const deletePhoneApi = async (id) => {
    try {
        await axiosClient.delete(`/phones/${id}`); 
        return true;
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Lỗi khi xóa máy");
        return false;
    }
};


export const fetchPhoneQrCodeApi = async (phoneId) => {
    try {
        const response = await axiosClient.get(`/phones/qrcode/${phoneId}`, {
            responseType: "blob"
        });
        return response.data;
    } catch (error) {
        console.error("QR Code generation error:", error);
        return null;
    }
};


export const createPhoneApi = async (submitData) => {
    try {
        await axiosClient.post("/phones/create", submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Thêm máy thất bại!");
        return false;
    }
};


export const updatePhoneApi = async (id, submitData) => {
    try {
        await axiosClient.put(`/phones/update/${id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật máy thất bại!");
        return false;
    }
};