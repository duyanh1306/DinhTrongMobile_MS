import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy danh sách dịch vụ sửa chữa (có phân trang, search, sort)
export const fetchRepairServicesApi = async (params) => {
    try {
        const { data } = await axiosClient.get(`/repair_services?${params}`);
        return data; // Trả về cả { data: [...], pagination: {...} }
    } catch (error) {
        console.error("Error fetching repair services:", error);
        toast.error("Lấy danh sách dịch vụ sửa chữa thất bại");
        return null;
    }
};

// Hàm Tạo mới Dịch vụ Sửa chữa
export const createRepairServiceApi = async (payload) => {
    try {
        await axiosClient.post("/repair_services/create", payload);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Tạo dịch vụ sửa chữa thất bại");
        return false;
    }
};

// Hàm Cập nhật Dịch vụ Sửa chữa
export const updateRepairServiceApi = async (id, payload) => {
    try {
        await axiosClient.put(`/repair_services/update/${id}`, payload);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật dịch vụ sửa chữa thất bại");
        return false;
    }
};