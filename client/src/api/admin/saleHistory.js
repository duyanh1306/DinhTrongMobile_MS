import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy tất cả đơn Bán hàng (SALE) và tự động tính lại tổng tiền
export const fetchSalesOrdersApi = async () => {
    try {
        const { data } = await axiosClient.get("/purchase-orders");
        
        // Tính lại tiền cho từng đơn dựa vào details
        const updatedOrders = await Promise.all(
            data.map(async (order) => {
                try {
                    const detailRes = await axiosClient.get(`/purchase-orders/${order._id}/details`);
                    const details = detailRes.data || [];
                    
                    if (details.length > 0) {
                        const total = details.reduce((sum, d) => {
                            const pPrice = d.phoneId?.sellingPrice || 0;
                            const iPrice = d.itemId?.price || 0;
                            const subItemsTotal = d.items?.reduce((s, item) => s + (item.purchasePrice || 0), 0) || 0;
                            return sum + pPrice + iPrice + subItemsTotal;
                        }, 0);
                        return { ...order, totalPrice: total };
                    }
                } catch (err) {
                    // Bỏ qua lỗi nếu đơn này không lấy được chi tiết
                }
                return order;
            })
        );
        
        // Lọc ra đúng các đơn SALE
        return updatedOrders.filter((o) => o.orderType === "SALE");
    } catch (error) {
        toast.error("Lỗi đồng bộ giá bán: " + error.message);
        return [];
    }
};

// Hàm lấy chi tiết của 1 đơn hàng cụ thể
export const fetchSalesOrderDetailsApi = async (orderId) => {
    if (!orderId) return [];
    try {
        const { data } = await axiosClient.get(`/purchase-orders/${orderId}/details`);
        return data || [];
    } catch (error) {
        toast.error("Lỗi tải chi tiết đơn hàng");
        return [];
    }
};