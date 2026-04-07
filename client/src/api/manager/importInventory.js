import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchImportInitDataApi = async () => {
    try {
        const [typeRes, storeRes, modelRes] = await Promise.all([
            axiosClient.get("/item_types/all").catch(() => ({ data: { data: [] } })),
            axiosClient.get("/stores/all").catch(() => ({ data: { data: [] } })),
            axiosClient.get("/phone_models/all").catch(() => ({ data: { data: [] } })) 
        ]);
        
        return {
            itemTypes: typeRes.data?.data || typeRes.data || [],
            stores: storeRes.data?.data || storeRes.data || [],
            models: modelRes.data?.data || modelRes.data || []
        };
    } catch (error) {
        console.error("Lỗi lấy dữ liệu nhập kho khởi tạo:", error);
        toast.error("Lỗi tải dữ liệu.");
        return null;
    }
};

export const submitBatchImportApi = async (pendingItemBatches, pendingPhoneBatches) => {
    try {

        if (pendingItemBatches && pendingItemBatches.length > 0) {
            await axiosClient.post("/items/import-batch", { batches: pendingItemBatches });
        }
   
        if (pendingPhoneBatches && pendingPhoneBatches.length > 0) {
            for (const batch of pendingPhoneBatches) {
                const formData = new FormData();
                formData.append("phoneModelId", batch.phoneModelId);
                formData.append("storeId", batch.storeId);
                formData.append("quantity", batch.quantity);
                formData.append("batchSuffix", batch.batchSuffix);
                formData.append("colorName", batch.colorName);
                formData.append("capacity", batch.capacity);
                formData.append("grade", batch.grade);
                formData.append("importPrice", batch.baseCost);
                formData.append("sellingPrice", batch.price);
                formData.append("warrantyPeriod", batch.warrantyPeriod);
                formData.append("source", "supplier"); 
      
                if (batch.imageFiles && batch.imageFiles.length > 0) {
                    for (let i = 0; i < batch.imageFiles.length; i++) {
                        formData.append("images", batch.imageFiles[i]);
                    }
                }
        
                await axiosClient.post("/phones/import-batch", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    }
                });
            }
        }

        toast.success(`Đã nhập thành công toàn bộ lô hàng vào kho!`);
        return true;
    } catch (error) {
        console.error("Lỗi submit nhập kho:", error);
        toast.error(error.response?.data?.message || "Lỗi nhập kho");
        return false;
    }
};