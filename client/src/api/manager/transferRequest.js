import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// 1. Hàm lấy danh sách cửa hàng
export const fetchStoresApi = async () => {
    try {
        const { data } = await axiosClient.get("/stores");
        return Array.isArray(data) ? data : (data.data || data.stores || []);
    } catch (error) {
        toast.error("Lỗi tải danh sách cửa hàng");
        return [];
    }
};

// 2. Lấy linh kiện theo Store (Đã thêm lại)
export const fetchItemsByStoreApi = async (storeId) => {
    const { data } = await axiosClient.get(`/items?storeId=${storeId}&limit=9999`);
    return data;
};

// 3. Lấy điện thoại theo Store (Đã thêm lại)
export const fetchPhonesByStoreApi = async (storeId) => {
    const { data } = await axiosClient.get(`/phones?storeId=${storeId}&limit=9999`);
    return data;
};

// 4. Hàm lấy dữ liệu Linh kiện & Điện thoại gộp (Giữ lại phòng trường hợp cần dùng)
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

// 5. Hàm tạo phiếu luân chuyển
export const createTransferRequestApi = async (requestData) => {
    try {
        const { data } = await axiosClient.post("/transfer-requests", requestData);
        return data;
    } catch (error) {
        toast.error(error.response?.data?.message || "Không thể tạo yêu cầu chuyển kho");
        return null; // Trả về null nếu lỗi để giao diện biết đường dừng lại
    }
};

// 6. Lấy danh sách yêu cầu luân chuyển (Dùng cho trang List)
export const fetchTransferRequestsApi = async () => {
    try {
        const { data } = await axiosClient.get("/transfer-requests");
        return data || [];
    } catch (error) {
        toast.error("Lỗi khi tải danh sách yêu cầu: " + (error.response?.data?.message || error.message));
        return [];
    }
};

// 7. Lấy chi tiết một yêu cầu
export const getTransferRequestByIdApi = async (id) => {
    const { data } = await axiosClient.get(`/transfer-requests/${id}`);
    return data;
};

// 8. Lấy danh sách chi tiết sản phẩm của một yêu cầu
export const getTransferRequestDetailsApi = async (id) => {
    const { data } = await axiosClient.get(`/transfer-requests/${id}/details`);
    return data;
};

// 9. Quản lý duyệt yêu cầu
export const approveTransferRequestApi = async (requestId, userId) => {
    const { data } = await axiosClient.put(`/transfer-requests/${requestId}/approve`, { approvedBy: userId });
    return data;
};

// 10. Quản lý từ chối yêu cầu
export const rejectTransferRequestApi = async (requestId, userId) => {
    const { data } = await axiosClient.put(`/transfer-requests/${requestId}/reject`, { approvedBy: userId });
    return data;
};

// 11. Xác nhận nhận hàng (Ở màn List)
export const confirmReceiptApi = async (requestId) => {
    const { data } = await axiosClient.put(`/transfer-requests/${requestId}/receipt`);
    return data;
};

// 12. Tìm kiếm linh kiện (Dùng khi quét QR)
export const searchItemsApi = async (searchQuery, limit = null) => {
    const url = limit ? `/items?search=${encodeURIComponent(searchQuery)}&limit=${limit}` : `/items?search=${encodeURIComponent(searchQuery)}`;
    const { data } = await axiosClient.get(url);
    return data;
};

// 13. Xác nhận xuất kho luân chuyển (Kèm danh sách item)
export const confirmShipmentApi = async (id, payload) => {
    const { data } = await axiosClient.put(`/transfer-requests/${id}/shipment`, payload);
    return data;
};

// 14. Xác nhận nhận hàng chi tiết (Kèm danh sách item đã quét)
export const confirmReceiptDetailApi = async (id, payload) => {
    const { data } = await axiosClient.put(`/transfer-requests/${id}/receipt`, payload);
    return data;
};