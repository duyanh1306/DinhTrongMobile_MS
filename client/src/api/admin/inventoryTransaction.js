import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchTransactionsApi = async () => {
    try {
        const { data } = await axiosClient.get("/inventory-transactions");
        
        // Kiểm tra xem data trả về có nằm trong wrapper không
        const transactionsData = data.data || data; 
        
        if (Array.isArray(transactionsData)) {
            // Sắp xếp mới nhất lên đầu luôn từ lúc lấy data
            return transactionsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            toast.error("Dữ liệu trả về không đúng định dạng mảng.");
            return [];
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi kết nối khi tải lịch sử kho");
        return [];
    }
};