import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy tất cả Hãng sản xuất
export const fetchPhoneBrandsApi = async () => {
    try {
        const { data } = await axiosClient.get("/phone_brands/all");
        return data.data || [];
    } catch (error) {
        console.error("Lỗi tải danh sách hãng", error);
        return [];
    }
};

// Hàm lấy tất cả Dòng máy
export const fetchPhoneModelsApi = async () => {
    try {
        const { data } = await axiosClient.get("/phone_models/all");
        return data.data || [];
    } catch (error) {
        toast.error("Lỗi lấy dữ liệu dòng máy");
        return [];
    }
};

// Hàm Tạo mới Dòng máy
export const createPhoneModelApi = async (submitData) => {
    try {
        await axiosClient.post("/phone_models/create", submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Thêm mới thất bại!");
        return false;
    }
};

// Hàm Cập nhật Dòng máy
export const updatePhoneModelApi = async (id, submitData) => {
    try {
        await axiosClient.put(`/phone_models/update/${id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật thất bại!");
        return false;
    }
};