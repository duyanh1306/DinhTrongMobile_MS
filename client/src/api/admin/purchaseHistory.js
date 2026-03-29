import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy tất cả đơn Thu mua (PURCHASE) và tự động tính lại tổng tiền
export const fetchOrdersApi = async () => {
    try {
        const { data } = await axiosClient.get("/purchase-orders");
        
        // Cần tính lại tiền cho từng đơn dựa vào details
        const updatedOrders = await Promise.all(
            data.map(async (order) => {
                try {
                    const detailRes = await axiosClient.get(`/purchase-orders/${order._id}/details`);
                    const details = detailRes.data || [];
                    
                    if (details.length > 0) {
                        const total = details.reduce((sum, d) => {
                            const pPrice = d.phoneId?.importPrice || d.purchasePrice || 0;
                            const iPrice = d.itemId?.baseCost || d.itemId?.price || 0;
                            const subItemsTotal = d.items?.reduce((s, item) => s + (item.purchasePrice || 0), 0) || 0;
                            return sum + pPrice + iPrice + subItemsTotal;
                        }, 0);
                        return { ...order, totalPrice: total };
                    }
                } catch (err) {
                    // Nếu lỗi lấy detail thì cứ trả về order gốc
                }
                return order;
            })
        );
        
        // Chỉ lấy những đơn có type là PURCHASE
        return updatedOrders.filter((o) => o.orderType === "PURCHASE");
    } catch (error) {
        toast.error("Lỗi đồng bộ giá: " + error.message);
        return [];
    }
};

// Hàm lấy chi tiết của 1 đơn hàng cụ thể
export const fetchOrderDetailsApi = async (orderId) => {
    if (!orderId) return [];
    try {
        const { data } = await axiosClient.get(`/purchase-orders/${orderId}/details`);
        return data || [];
    } catch (error) {
        toast.error("Lỗi tải chi tiết đơn hàng");
        return [];
    }
};