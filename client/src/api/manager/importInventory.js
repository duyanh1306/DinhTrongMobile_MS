import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// 1. Lấy danh sách Loại Linh kiện và Cửa hàng
export const fetchImportInitDataApi = async () => {
    try {
        const [typeRes, storeRes] = await Promise.all([
            axiosClient.get("/item_types/all"),
            axiosClient.get("/stores/all")
        ]);
        
        return {
            itemTypes: typeRes.data?.data || [],
            stores: storeRes.data?.data || []
        };
    } catch (error) {
        console.error("Lỗi lấy dữ liệu nhập kho khởi tạo:", error);
        toast.error("Lỗi tải dữ liệu.");
        return null;
    }
};

// 2. Submit toàn bộ Lô hàng vào kho
export const submitBatchImportApi = async (pendingBatches) => {
    try {
        await axiosClient.post("/items/import-batch", { batches: pendingBatches });
        toast.success(`Đã nhập thành công toàn bộ lô hàng vào kho!`);
        return true;
    } catch (error) {
        console.error("Lỗi submit nhập kho:", error);
        toast.error(error.response?.data?.message || "Lỗi nhập kho");
        return false;
    }
};