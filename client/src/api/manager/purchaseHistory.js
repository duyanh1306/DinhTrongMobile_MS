import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// 1. Lấy danh sách lịch sử thu mua và tự động tính lại tổng tiền
export const fetchPurchaseOrdersApi = async () => {
    try {
        const res = await axiosClient.get('/purchase-orders/manager/store-purchases');
        const data = res.data;

        if (!Array.isArray(data)) {
            toast.error("Phản hồi từ máy chủ không hợp lệ.");
            return [];
        }

        // Lặp qua từng đơn để gọi thêm chi tiết và tính tổng tiền
        const updatedOrders = await Promise.all(
            data.map(async (order) => {
                try {
                    const detailRes = await axiosClient.get(`/purchase-orders/${order._id}/details`);
                    const details = detailRes.data;

                    if (details && details.length > 0) {
                        const total = details.reduce((sum, d) => {
                            const pPrice = d.phoneId?.importPrice || d.purchasePrice || 0;
                            const iPrice = d.itemId?.baseCost || d.itemId?.price || 0;
                            const subItemsTotal = d.items?.reduce((s, item) => s + (item.purchasePrice || 0), 0) || 0;
                            return sum + pPrice + iPrice + subItemsTotal;
                        }, 0);
                        return { ...order, totalPrice: total };
                    }
                    return order;
                } catch (err) {
                    return order; // Nếu lỗi 1 đơn thì vẫn giữ nguyên đơn gốc
                }
            })
        );
        return updatedOrders;

    } catch (error) {
        if (error.response && error.response.status === 403) {
            toast.error("Bạn không có quyền xem lịch sử thu mua.");
        } else {
            toast.error("Không tải được danh sách đơn thu mua.");
        }
        return [];
    }
};

// 2. Lấy chi tiết của một đơn hàng cụ thể
export const fetchOrderDetailsApi = async (orderId) => {
    try {
        const res = await axiosClient.get(`/purchase-orders/${orderId}/details`);
        return res.data || [];
    } catch (error) {
        toast.error("Lỗi tải chi tiết đơn hàng");
        return [];
    }
};