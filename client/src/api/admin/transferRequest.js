import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy tất cả Yêu cầu chuyển kho
export const fetchTransferRequestsApi = async () => {
    try {
        const { data } = await axiosClient.get("/transfer-requests");
        return data || [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách yêu cầu chuyển kho: " + error.message);
        return [];
    }
};

// Hàm lấy chi tiết của 1 Yêu cầu chuyển kho
export const fetchTransferRequestDetailsApi = async (requestId) => {
    if (!requestId) return [];
    try {
        const { data } = await axiosClient.get(`/transfer-requests/${requestId}/details`);
        return data || [];
    } catch (error) {
        toast.error("Không thể tải chi tiết yêu cầu: " + error.message);
        return [];
    }
};