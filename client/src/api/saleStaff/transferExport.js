import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Lấy danh sách cửa hàng
export const fetchStoresApi = async () => {
    try {
        const { data } = await axiosClient.get("/stores");
        return Array.isArray(data) ? data : (data.data || data.stores || []);
    } catch (error) {
        toast.error("Lỗi tải danh sách cửa hàng");
        return [];
    }
};

// Lấy danh sách tất cả các phiếu luân chuyển
export const fetchTransferRequestsApi = async () => {
    try {
        const { data } = await axiosClient.get("/transfer-requests");
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        toast.error("Lỗi khi tải danh sách lệnh xuất kho");
        return [];
    }
};

// Lấy chi tiết 1 phiếu luân chuyển
export const fetchTransferRequestDetailApi = async (id) => {
    try {
        const { data } = await axiosClient.get(`/transfer-requests/${id}`);
        return data.data || data;
    } catch (error) {
        toast.error("Lỗi khi tải thông tin phiếu xuất");
        return null;
    }
};

// Lấy toàn bộ tồn kho (Linh kiện & Điện thoại) của cửa hàng nguồn để đối chiếu quét mã
export const fetchInventoryForExportApi = async (storeId) => {
    try {
        const [itemsRes, phonesRes] = await Promise.all([
            axiosClient.get(`/items?storeId=${storeId}&limit=9999`),
            axiosClient.get(`/phones?storeId=${storeId}&limit=9999`)
        ]);
        
        return {
            itemsData: itemsRes.data?.data || itemsRes.data || [],
            phonesData: phonesRes.data?.data || phonesRes.data || []
        };
    } catch (error) {
        toast.error("Lỗi khi tải dữ liệu kho hàng");
        return { itemsData: [], phonesData: [] };
    }
};

// Xác nhận xuất kho (Gửi list mã đã quét)
export const confirmShipmentApi = async (id, payload) => {
    try {
        // Gọi API PUT /transfer-requests/:id/shipment (Chỉnh lại route nếu Backend bạn đặt tên khác)
        const { data } = await axiosClient.put(`/transfer-requests/${id}/shipment`, payload);
        return data;
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi xác nhận xuất kho");
        return null;
    }
};