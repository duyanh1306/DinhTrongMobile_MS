import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchCategoryDataApi = async (type, activeStore) => {
    try {
        const [modelsRes, phonesRes, brandsRes, storesRes] = await Promise.all([
            axiosClient.get('/phone_models/all'),
            axiosClient.get('/phones/all'),
            axiosClient.get('/phone_brands/all'),
            axiosClient.get('/stores/all')
        ]);

        const storeData = storesRes.data?.data || storesRes.data || [];
        
        let finalActiveStore = activeStore;
        if (!finalActiveStore && storeData.length > 0) {
            finalActiveStore = storeData[0]._id;
        }

        const phoneModels = modelsRes.data?.data || [];
        const phones = phonesRes.data?.data || [];
        const brands = brandsRes.data?.data || [];

        let combinedData = [];

        phoneModels.forEach(model => {
            // Lọc điện thoại theo Model và Cửa hàng đang chọn
            const allModelPhones = phones.filter(p => {
                const pStoreId = p.storeId?._id || p.storeId;
                const pModelId = p.phoneModelId?._id || p.phoneModelId;
                return (String(pModelId) === String(model._id)) && (String(pStoreId) === String(finalActiveStore));
            });
  
            if (allModelPhones.length === 0) return;
  
            const newPhonesPhysical = allModelPhones.filter(p => p.grade === 'Mới');
            const usedPhonesPhysical = allModelPhones.filter(p => p.grade && p.grade !== 'Mới');
  
            const getStartingPrice = (physicalList) => {
                const validPrices = physicalList.map(p => p.sellingPrice || (p.importPrice * 1.15)).filter(price => !isNaN(price) && price > 0);
                return validPrices.length > 0 ? Math.min(...validPrices) : (model.price || 0);
            };
  
            const getDisplayImage = (physicalList) => {
                const phoneWithImg = physicalList.find(p => p.specificImages && p.specificImages.length > 0);
                return phoneWithImg ? phoneWithImg.specificImages[0] : model.image;
            };
  
            // Nếu type là 'new' hoặc Tất cả -> Lấy máy mới
            if ((type === 'new' || !type) && newPhonesPhysical.length > 0) {
                combinedData.push({
                    ...model,
                    image: getDisplayImage(newPhonesPhysical),
                    price: getStartingPrice(newPhonesPhysical),
                    stockCount: newPhonesPhysical.filter(p => p.status === 'in_stock').length,
                    isUsedCard: false,
                    brandId: model.brand?._id || model.brand 
                });
            }
  
            // Nếu type là 'used' hoặc Tất cả -> Lấy máy cũ
            if ((type === 'used' || !type) && usedPhonesPhysical.length > 0) {
                combinedData.push({
                    ...model,
                    image: getDisplayImage(usedPhonesPhysical),
                    price: getStartingPrice(usedPhonesPhysical),
                    stockCount: usedPhonesPhysical.filter(p => p.status === 'in_stock').length,
                    isUsedCard: true,
                    brandId: model.brand?._id || model.brand 
                });
            }
        });

        return {
            stores: storeData,
            activeStore: finalActiveStore,
            brands: brands,
            allProducts: combinedData
        };

    } catch (error) {
        console.error("Error fetching category data:", error);
        toast.error("Không thể tải dữ liệu danh mục.");
        return null;
    }
};