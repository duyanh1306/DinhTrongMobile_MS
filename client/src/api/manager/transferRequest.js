import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchStoresApi = async () => {
    try {
        const { data } = await axiosClient.get("/stores");
        return Array.isArray(data) ? data : (data.data || data.stores || []);
    } catch (error) {
        toast.error("Lỗi tải danh sách cửa hàng");
        return [];
    }
};


export const fetchItemsByStoreApi = async (storeId) => {
    const { data } = await axiosClient.get(`/items?storeId=${storeId}&limit=9999`);
    return data;
};


export const fetchPhonesByStoreApi = async (storeId) => {
    const { data } = await axiosClient.get(`/phones?storeId=${storeId}&limit=9999`);
    return data;
};


export const fetchInventoryForTransferApi = async (storeId) => {
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


export const createTransferRequestApi = async (requestData) => {
    try {
        const { data } = await axiosClient.post("/transfer-requests", requestData);
        return data;
    } catch (error) {
        toast.error(error.response?.data?.message || "Không thể tạo yêu cầu chuyển kho");
        return null; 
    }
};


export const fetchTransferRequestsApi = async () => {
    try {
        const { data } = await axiosClient.get("/transfer-requests");
        return data || [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách yêu cầu: " + (error.response?.data?.message || error.message));
        return [];
    }
};


export const getTransferRequestByIdApi = async (id) => {
    const { data } = await axiosClient.get(`/transfer-requests/${id}`);
    return data;
};


export const getTransferRequestDetailsApi = async (id) => {
    const { data } = await axiosClient.get(`/transfer-requests/${id}/details`);
    return data;
};


export const approveTransferRequestApi = async (requestId, userId) => {
    const { data } = await axiosClient.put(`/transfer-requests/${requestId}/approve`, { approvedBy: userId });
    return data;
};


export const rejectTransferRequestApi = async (requestId, userId) => {
    const { data } = await axiosClient.put(`/transfer-requests/${requestId}/reject`, { approvedBy: userId });
    return data;
};


export const confirmReceiptApi = async (requestId) => {
    const { data } = await axiosClient.put(`/transfer-requests/${requestId}/receipt`);
    return data;
};


export const searchItemsApi = async (searchQuery, limit = null) => {
    const url = limit ? `/items?search=${encodeURIComponent(searchQuery)}&limit=${limit}` : `/items?search=${encodeURIComponent(searchQuery)}`;
    const { data } = await axiosClient.get(url);
    return data;
};


export const confirmShipmentApi = async (id, payload) => {
    const { data } = await axiosClient.put(`/transfer-requests/${id}/shipment`, payload);
    return data;
};


export const confirmReceiptDetailApi = async (id, payload) => {
    const { data } = await axiosClient.put(`/transfer-requests/${id}/receipt`, payload);
    return data;
};