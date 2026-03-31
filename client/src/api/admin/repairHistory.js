import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Lấy danh sách tất cả các đơn sửa chữa và tự động tính lại tổng tiền
export const fetchRepairOrdersApi = async () => {
    try {
        const { data } = await axiosClient.get("/repair-orders");
        
        // ĐỒNG BỘ GIÁ: Tính toán lại tổng tiền dựa trên chi tiết của từng đơn sửa chữa
        const updatedOrders = await Promise.all(data.map(async (order) => {
            try {
                const detailRes = await axiosClient.get(`/repair-orders/${order._id}/details`);
                const details = detailRes.data || [];
                
                // Tổng = Giá dịch vụ + Tổng giá của mảng itemIds (linh kiện thay thế)
                const total = details.reduce((sum, d) => {
                    const servicePrice = d.serviceId?.price || 0;
                    const itemsPrice = d.itemIds?.reduce((iSum, item) => iSum + (item.price || item.item_type?.price || 0), 0) || 0;
                    return sum + servicePrice + itemsPrice;
                }, 0);
                
                return { ...order, totalPrice: total };
            } catch (err) {
                // Lỗi lấy chi tiết thì trả về order cũ
                return order;
            }
        }));
        
        return updatedOrders;
    } catch (error) {
        toast.error("Lỗi khi đồng bộ giá sửa chữa: " + error.message);
        return [];
    }
};

// Lấy chi tiết của một đơn sửa chữa cụ thể
export const fetchRepairOrderDetailsApi = async (orderId) => {
    if (!orderId) return [];
    try {
        const { data } = await axiosClient.get(`/repair-orders/${orderId}/details`);
        return data || [];
    } catch (error) {
        toast.error("Lỗi tải chi tiết đơn hàng");
        return [];
    }
};