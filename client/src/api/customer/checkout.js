import axiosClient from "../axiosClient";
import axios from "axios"; 
import { toast } from "react-toastify";

// 1. Lấy danh sách Tỉnh/Thành từ GitHub
export const fetchLocationsApi = async () => {
    try {
        const res = await axiosClient.get('/locations');
        return res.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách tỉnh thành từ DB:", error);
        toast.error("Lỗi tải danh sách địa chỉ!");
        return [];
    }
};

// 2. Lấy danh sách Cửa hàng
export const fetchStoresApi = async () => {
    try {
        const res = await axiosClient.get('/stores/all');
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
    } catch (error) {
        console.error("Lỗi lấy cửa hàng:", error);
        return [];
    }
};

// 3. Khởi tạo Đơn hàng (Order)
export const submitOrderApi = async (orderPayload) => {
    try {
        const res = await axiosClient.post('/orders/create', orderPayload);
        return res.data;
    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        toast.error(error.response?.data?.message || "Lỗi khi tạo đơn hàng!");
        return null;
    }
};

// 4. Tạo link thanh toán VNPAY
export const createVnpayPaymentApi = async (totalAmount, orderId) => {
    try {
        const res = await axiosClient.post('/vnpay/create', {
            amountVnd: totalAmount,
            orderId: orderId,
            orderInfo: `Thanh toan don hang DTM mua tai DinhTrongMobile`,
            locale: 'vn'
        });
        return res.data;
    } catch (error) {
        console.error("Lỗi tạo link VNPAY:", error);
        toast.error("Không thể tạo link thanh toán VNPay");
        return null;
    }
};

// 5. Xóa giỏ hàng sau khi đặt thành công (Dùng cho PayOS)
export const clearCartApi = async (userId) => {
    try {
        await axiosClient.delete(`/cart/clear/${userId}`);
        return true;
    } catch (error) {
        console.error("Lỗi xóa giỏ hàng:", error);
        return false;
    }
};