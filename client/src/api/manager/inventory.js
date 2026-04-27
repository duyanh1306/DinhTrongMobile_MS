import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchItemTypesApi = async () => {
    try {
        const { data } = await axiosClient.get(`/item_types/all`);
        return data.data || [];
    } catch (error) { return []; }
};

export const fetchModelsApi = async () => {
    try {
        const { data } = await axiosClient.get(`/phone_models/all`);
        return data.data || [];
    } catch (error) { return []; }
};

export const fetchItemsApi = async (params) => {
    try {
        const { data } = await axiosClient.get(`/items`, { params });
        return data;
    } catch (error) {
        toast.error("Lỗi tải danh sách linh kiện");
        return null;
    }
};

export const fetchPhonesApi = async (storeId) => {
    try {
        const { data } = await axiosClient.get(`/phones?storeId=${storeId}`);
        return data.data || [];
    } catch (error) {
        toast.error("Lỗi tải danh sách máy");
        return [];
    }
};


export const deleteItemApi = async (id) => {
    try {
        await axiosClient.delete(`/items/${id}`);
        return true;
    } catch (error) {
        return false;
    }
};

export const deletePhoneApi = async (id) => {
    try {
        await axiosClient.delete(`/phones/${id}`); 
        return true;
    } catch (error) {
        return false;
    }
};

export const submitItemApi = async (isEditing, id, formData) => {
    try {
        if (isEditing) {
            await axiosClient.put(`/items/update/${id}`, formData);
        } else {
            await axiosClient.post(`/items/create`, formData);
        }
        return { success: true };
    } catch (error) {

        return { 
            success: false, 
            message: error.response?.data?.message || error.message || "Lỗi không xác định từ máy chủ!" 
        };
    }
};

export const submitPhoneApi = async (isEditing, id, submitData) => {
    try {
        if (isEditing) {
            await axiosClient.put(`/phones/update/${id}`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            await axiosClient.post(`/phones/create`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            message: error.response?.data?.message || error.message || "Lỗi không xác định từ máy chủ!" 
        };
    }
};


export const getQrBlobApi = async (type, id) => {
    try {
        const endpoint = type === 'item' ? `/items/${id}/qr` : `/phones/qrcode/${id}`;
        const response = await axiosClient.get(endpoint, { responseType: 'blob' });
        return new Blob([response.data], { type: "image/png" });
    } catch (error) {
        console.error("QR Code generation error:", error);
        toast.error("Lỗi khi tạo mã QR");
        return null;
    }
};