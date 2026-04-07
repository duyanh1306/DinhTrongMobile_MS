import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// 1. Lấy danh sách hóa đơn theo Tab
export const fetchOrdersApi = async (activeTab) => {
    try {
        let url = "";
        if (activeTab === "SALE" || activeTab === "PURCHASE") {
            url = `/purchase-orders?orderType=${activeTab}`;
        } else if (activeTab === "REPAIR") {
            url = `/repair-orders`;
        }
        const { data } = await axiosClient.get(url);
        return data?.data || data || [];
    } catch (error) {
        toast.error("Lỗi tải danh sách hóa đơn");
        return [];
    }
};

// 2. Lấy chi tiết hóa đơn
export const fetchOrderDetailsApi = async (activeTab, orderId) => {
    try {
        let url = activeTab === "REPAIR" 
            ? `/repair-orders/${orderId}/details` 
            : `/purchase-orders/${orderId}/details`;
        
        const { data } = await axiosClient.get(url);
        return data?.data || data || [];
    } catch (error) {
        toast.error("Không thể tải chi tiết");
        return [];
    }
};

// 3. Xác nhận thanh toán / Hoàn tất đơn
export const confirmPaymentApi = async (activeTab, orderId) => {
    try {
        let url = activeTab === "REPAIR" 
            ? `/repair-orders/${orderId}/complete` 
            : `/purchase-orders/${orderId}/confirm-payment`;
        
        // REPAIR dùng PUT, SALE/PURCHASE dùng PATCH
        const method = activeTab === "REPAIR" ? "put" : "patch";
        
        await axiosClient[method](url);
        toast.success("Xác nhận thành công!");
        return true;
    } catch (error) {
        toast.error("Thao tác thất bại");
        return false;
    }
};

// 4. Hủy đơn hàng
export const cancelOrderApi = async (activeTab, order) => {
    try {
        let url = activeTab === "REPAIR" 
            ? `/repair-orders/${order._id}/cancel` 
            : `/purchase-orders/${order._id}`;
        
        // Đơn Sale/Purchase cần truyền thêm status để update
        const body = activeTab !== "REPAIR" 
            ? { status: "Cancelled", totalPrice: order.totalPrice, note: order.note } 
            : undefined;

        await axiosClient.put(url, body);
        toast.success("Đã hủy đơn hàng thành công!");
        return true;
    } catch (error) {
        toast.error("Lỗi kết nối khi hủy đơn.");
        return false;
    }
};