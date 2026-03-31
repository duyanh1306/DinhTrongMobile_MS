import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy tất cả users
export const fetchUsersApi = async () => {
    try {
        const { data } = await axiosClient.get("/users");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách nhân viên");
        return [];
    }
};

// Hàm lấy tất cả roles
export const fetchRolesApi = async () => {
    try {
        const { data } = await axiosClient.get("/roles");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        toast.error("Lỗi khi tải vai trò");
        return [];
    }
};

// Hàm lấy thông tin 1 cửa hàng cụ thể
export const fetchStoreInfoApi = async (storeId) => {
    if (!storeId) return null;
    try {
        const { data } = await axiosClient.get(`/stores/${storeId}`);
        return data;
    } catch (error) {
        return null;
    }
};

// Hàm lấy danh sách tất cả cửa hàng (dùng để chuyển store)
export const fetchStoresApi = async () => {
    try {
        const res = await axiosClient.get("/stores");
        return Array.isArray(res.data) ? res.data : res.data.data || [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách cửa hàng");
        return [];
    }
};

// Hàm tạo mới nhân viên
export const createStaffApi = async (submitData) => {
    try {
        await axiosClient.post("/users", submitData);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Tạo tài khoản thất bại");
        return false;
    }
};

// Hàm cập nhật thông tin nhân viên
export const updateStaffApi = async (id, submitData) => {
    try {
        await axiosClient.put(`/users/${id}`, submitData);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật thất bại");
        return false;
    }
};

// Hàm Reset Password
export const resetPasswordApi = async (id, password) => {
    try {
        await axiosClient.put(`/users/${id}/reset-password`, { password });
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Đặt lại mật khẩu thất bại");
        return false;
    }
};