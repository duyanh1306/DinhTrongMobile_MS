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
   
        const storeGroups = {};

        if (pendingItemBatches) {
            pendingItemBatches.forEach(batch => {
                if (!storeGroups[batch.storeId]) storeGroups[batch.storeId] = { items: [], phones: [] };
                storeGroups[batch.storeId].items.push(batch);
            });
        }

        if (pendingPhoneBatches) {
            pendingPhoneBatches.forEach(batch => {
                if (!storeGroups[batch.storeId]) storeGroups[batch.storeId] = { items: [], phones: [] };
                storeGroups[batch.storeId].phones.push(batch);
            });
        }

       
        for (const storeId of Object.keys(storeGroups)) {
            const group = storeGroups[storeId];
            let currentTransactionId = null;

            const totalItemsInGroup = 
                group.items.reduce((sum, b) => sum + Number(b.quantity), 0) + 
                group.phones.reduce((sum, b) => sum + Number(b.quantity), 0);

            if (group.items.length > 0) {
                const formattedItems = group.items.map(batch => ({
                    ...batch,
                    quantity: Number(batch.quantity),
                    baseCost: Number(batch.baseCost),
                    price: Number(batch.price)
                }));

                const itemRes = await axiosClient.post("/items/import-batch", { 
                    batches: formattedItems,
                    isFirst: true, 
                    totalCombinedItems: totalItemsInGroup
                });
                
               
                currentTransactionId = itemRes.data?.transactionId || itemRes.transactionId;
            }

            if (group.phones.length > 0) {
                for (let i = 0; i < group.phones.length; i++) {
                    const batch = group.phones[i];
                    const formData = new FormData();
                    
                    formData.append("phoneModelId", batch.phoneModelId);
                    formData.append("storeId", batch.storeId);
                    formData.append("quantity", batch.quantity);
                    formData.append("colorName", batch.colorName);
                    formData.append("capacity", batch.capacity);
                    formData.append("importPrice", batch.baseCost); 
                    formData.append("sellingPrice", batch.price);   
                    formData.append("batchSuffix", batch.batchSuffix || "");
                    formData.append("grade", batch.grade || "Mới");
                    formData.append("warrantyPeriod", batch.warrantyPeriod || 12);

              
                    if (currentTransactionId) {
                        formData.append("transactionId", currentTransactionId);
                    } else if (i === 0) {
                     
                        formData.append("isFirst", "true");
                        formData.append("totalCombinedItems", totalItemsInGroup);
                    }

                    if (batch.imageFiles && batch.imageFiles.length > 0) {
                        batch.imageFiles.forEach(file => {
                            formData.append("images", file); 
                        });
                    }

                    const phoneRes = await axiosClient.post("/phones/import-batch", formData, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });

                    if (!currentTransactionId && (phoneRes.data?.transactionId || phoneRes.transactionId)) {
                        currentTransactionId = phoneRes.data?.transactionId || phoneRes.transactionId;
                    }
                }
            }
        }

        toast.success("Đã nhập kho thành công!");
        return true;
    } catch (error) {
        console.error("Lỗi:", error);
        toast.error(error.response?.data?.message || "Lỗi server");
        return false;
    }
};