import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// 1. Lấy danh sách lịch sử đơn hàng của user
export const fetchOrdersApi = async (userId) => {
    try {
        const res = await axiosClient.get(`/orders/user/${userId}`);
        return res.data?.data || [];
    } catch (error) {
        console.error("Lỗi lấy lịch sử đơn hàng:", error);
        return [];
    }
};

// 2. Xác nhận đã nhận được hàng
export const confirmOrderApi = async (orderId) => {
    try {
        await axiosClient.put(`/orders/${orderId}/customer-confirm`);
        toast.success("Cảm ơn bạn đã xác nhận nhận hàng!");
        return true;
    } catch (error) {
        console.error("Lỗi xác nhận đơn hàng:", error);
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
        return false;
    }
};

// 3. Báo cáo lỗi chưa nhận được hàng
export const reportOrderIssueApi = async (orderId) => {
    try {
        await axiosClient.put(`/orders/${orderId}/customer-report-issue`);
        toast.success("Đã gửi báo cáo! Cửa hàng sẽ liên hệ với bạn sớm nhất.");
        return true;
    } catch (error) {
        console.error("Lỗi báo cáo đơn hàng:", error);
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
        return false;
    }
};