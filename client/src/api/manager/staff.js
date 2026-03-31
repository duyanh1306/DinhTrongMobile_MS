import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// 1. Lấy danh sách Users
export const fetchUsersApi = async () => {
    try {
        const { data } = await axiosClient.get("/users");
        return data || [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách người dùng: " + error.message);
        return [];
    }
};

// 2. Lấy danh sách Roles
export const fetchRolesApi = async () => {
    try {
        const { data } = await axiosClient.get("/roles");
        return data || [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách vai trò: " + error.message);
        return [];
    }
};

// 3. Lấy danh sách Stores
export const fetchStoresApi = async () => {
    try {
        const { data } = await axiosClient.get("/stores");
        return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
        console.log("Lỗi tải cửa hàng", error);
        return [];
    }
};

// 4. Update thông tin User
export const updateUserApi = async (userId, submitData) => {
    try {
        await axiosClient.put(`/users/${userId}`, submitData);
        toast.success("Cập nhật thông tin thành công!");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật thất bại");
        return false;
    }
};

// 5. Tạo mới User
export const createUserApi = async (submitData) => {
    try {
        await axiosClient.post(`/users`, submitData);
        toast.success("Tạo tài khoản nhân viên thành công!");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Tạo tài khoản thất bại");
        return false;
    }
};

// 6. Ban User
export const banUserApi = async (userId) => {
    try {
        await axiosClient.put(`/users/${userId}`, { status: "inactive" });
        toast.success("Đã khóa tài khoản thành công!");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Khóa tài khoản thất bại.");
        return false;
    }
};

// 7. Reset Password
export const resetPasswordApi = async (userId, newPassword) => {
    try {
        await axiosClient.put(`/users/${userId}/reset-password`, { password: newPassword });
        toast.success("Đặt lại mật khẩu thành công!");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Đặt lại mật khẩu thất bại.");
        return false;
    }
};