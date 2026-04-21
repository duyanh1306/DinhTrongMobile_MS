import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const getImageProfile = (imagePath) => {
    const defaultAvatar = "https://res-console.cloudinary.com/dtjfxho13/thumbnails/transform/v1/image/upload/Y19maWxsLGhfMjAwLHdfMjAw/v1/ZGVmYXVsdC1hdmF0YXItaWNvbi1vZi1zb2NpYWwtbWVkaWEtdXNlci12ZWN0b3JfaXY1aXB6/template_primary";
    
    if (!imagePath) return defaultAvatar;
    if (imagePath.startsWith('http')) return imagePath;
    
    const currentBaseUrl = axiosClient.defaults.baseURL || 'http://localhost:9999/api';
    const serverUrl = currentBaseUrl.replace(/\/api\/?$/, '');
    
    return `${serverUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};
export const updateProfileApi = async (submitData) => {
    try {
        const { data } = await axiosClient.put("/users/profile", submitData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(data.message || "Cập nhật hồ sơ thành công!");
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật hồ sơ thất bại.");
        return false;
    }
};


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