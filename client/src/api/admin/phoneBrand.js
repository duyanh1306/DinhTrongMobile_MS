import axiosClient from "../axiosClient"; // Nhớ sửa đường dẫn này nếu cần
import { toast } from "react-toastify";

export const fetchPhoneBrandsApi = async (params) => {
    try {
        const { data } = await axiosClient.get(`/phone_brands?${params}`);
        return data;
    } catch (error) {
        toast.error("Lỗi tải danh sách hãng sản xuất");
        return null;
    }
};

export const createPhoneBrandApi = async (formData) => {
    try {
        await axiosClient.post("/phone_brands/create", formData);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi thêm hãng mới");
        return false;
    }
};

export const updatePhoneBrandApi = async (id, formData) => {
    try {
        await axiosClient.put(`/phone_brands/update/${id}`, formData);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi cập nhật hãng");
        return false;
    }
};

export const deletePhoneBrandApi = async (id) => {
    try {
        await axiosClient.delete(`/phone_brands/${id}`);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Xóa thất bại");
        return false;
    }
};