import axiosClient from "../axiosClient";

export const fetchOrderDetailApi = async (orderId) => {
    try {
        const res = await axiosClient.get(`/orders/${orderId}`);
        return res.data?.data || res.data;
    } catch (error) {
        console.error("Lỗi lấy chi tiết đơn hàng:", error);
        return null;
    }
};