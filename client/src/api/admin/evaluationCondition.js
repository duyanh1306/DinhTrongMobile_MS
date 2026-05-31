// api/admin/evaluationCondition.js
import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const getAllConditionsApi = async () => {
    try {
        const response = await axiosClient.get("/evaluation-conditions");
        return response.data?.data || [];
    } catch (error) {
        toast.error("Lỗi lấy danh sách tiêu chí");
        return [];
    }
};

export const createConditionApi = async (payload) => {
    try {
        await axiosClient.post("/evaluation-conditions", payload);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Tạo thất bại!");
        return false;
    }
};

export const updateConditionApi = async (id, payload) => {
    try {
        await axiosClient.put(`/evaluation-conditions/${id}`, payload);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật thất bại!");
        return false;
    }
};

export const deleteConditionApi = async (id) => {
    try {
        await axiosClient.delete(`/evaluation-conditions/${id}`);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Xóa thất bại!");
        return false;
    }
};