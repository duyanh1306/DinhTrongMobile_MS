import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy danh sách cửa hàng và dòng máy (Dùng cho Filters và Form)
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

// Hàm lấy danh sách điện thoại trong kho theo Cửa hàng
export const fetchPhonesApi = async (storeId) => {
    if (!storeId) return [];
    try {
        const { data } = await axiosClient.get(`/phones?storeId=${storeId}`);
        return data.data || [];
    } catch (error) {
        toast.error("Lỗi tải danh sách máy");
        return [];
    }
};

// Hàm xóa điện thoại
export const deletePhoneApi = async (id) => {
    try {
        await axiosClient.delete(`/phones/delete/${id}`);
        return true;
    } catch (error) {
        toast.error("Lỗi khi xóa máy");
        return false;
    }
};

// Hàm lấy QR Code trả về dạng Blob
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

// Hàm Tạo mới Điện thoại
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

// Hàm Cập nhật Điện thoại
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