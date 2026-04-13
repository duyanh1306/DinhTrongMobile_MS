import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchWebOrdersApi = async () => {
  try {
    const res = await axiosClient.get('/orders/all');
    const allOrders = res.data.data || res.data;
    return allOrders.filter(o => ['Pending', 'Processing', 'Delivering'].includes(o.orderStatus));
  } catch (error) {
    toast.error("Không thể tải danh sách đơn hàng!");
    return [];
  }
};

export const fulfillOrderApi = async (orderId, scannedSerials) => {
  try {
    const res = await axiosClient.put(`/orders/${orderId}/fulfill`, {
      assignedSerials: scannedSerials
    });
    if (res.data.success) {
      toast.success("Xuất kho thành công! Đơn hàng đã chuyển sang Đang giao.");
      return true;
    }
    return false;
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi khi xuất kho!");
    return false;
  }
};