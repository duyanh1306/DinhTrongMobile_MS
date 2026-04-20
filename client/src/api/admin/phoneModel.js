import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchPhoneBrandsApi = async () => {
    try {
        const { data } = await axiosClient.get("/phone_brands/all");
        return data.data || [];
    } catch (error) {
        console.error("Lỗi tải danh sách hãng", error);
        return [];
    }
};


export const fetchPhoneModelsApi = async () => {
    try {
        const { data } = await axiosClient.get("/phone_models/all");
        return data.data || [];
    } catch (error) {
        toast.error("Lỗi lấy dữ liệu dòng máy");
        return [];
    }
};


export const createPhoneModelApi = async (submitData) => {
    try {
        await axiosClient.post("/phone_models/create", submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Thêm mới thất bại!" };
    }
};

export const updatePhoneModelApi = async (id, submitData) => {
    try {
        await axiosClient.put(`/phone_models/update/${id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Cập nhật thất bại!" };
    }
};
export const deletePhoneModelApi = async (id) => {
    try {
        await axiosClient.delete(`/phone_models/delete/${id}`);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Xóa thất bại!");
        return false;
    }
};