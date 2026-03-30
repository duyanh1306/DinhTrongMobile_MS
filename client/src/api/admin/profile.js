import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm cập nhật Thông tin cá nhân (Hỗ trợ upload File)
export const updateProfileApi = async (submitData) => {
    try {
        const { data } = await axiosClient.put("/users/profile", submitData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        
        // Lưu data user mới vào localStorage để UI tự cập nhật
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(data.message || "Cập nhật hồ sơ thành công!");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật hồ sơ thất bại.");
        return false;
    }
};

// Hàm thay đổi Mật khẩu
export const changePasswordApi = async (payload) => {
    try {
        const { data } = await axiosClient.put("/users/change-password", payload);
        toast.success(data.message || "Đổi mật khẩu thành công!");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.");
        return false;
    }
};