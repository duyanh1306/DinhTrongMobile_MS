import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchHomeDataApi = async (selectedStore) => {
    try {
        const [modelsRes, phonesRes, storesRes] = await Promise.all([
            axiosClient.get('/phone_models/all'),
            axiosClient.get('/phones/all'),
            axiosClient.get('/stores/all')
        ]);

        const storeData = storesRes.data?.data || storesRes.data || [];
        
        let activeStore = selectedStore;
        if (!activeStore && storeData.length > 0) {
            activeStore = storeData[0]._id;
        }

        const phoneModels = modelsRes.data?.data || [];
        const phones = phonesRes.data?.data || [];

        const newList = [];
        const usedList = [];
        const assembledList = [];

        phoneModels.forEach(model => {
            
            const allModelPhones = phones.filter(p => {
                const pStoreId = p.storeId?._id || p.storeId;
                const pModelId = p.phoneModelId?._id || p.phoneModelId;
                return (
                    (p.status === 'in_stock' || p.status === 'sold') && 
                    String(pModelId) === String(model._id) && 
                    String(pStoreId) === String(activeStore)
                );
            });

            if (allModelPhones.length === 0) return;

           
            const newPhonesPhysical = allModelPhones.filter(p => !p.grade || p.grade === 'Mới');
            const assembledPhonesPhysical = allModelPhones.filter(p => p.grade === 'Máy dựng' || p.grade === 'Máy ráp');
            const usedPhonesPhysical = allModelPhones.filter(p => p.grade && p.grade !== 'Mới' && p.grade !== 'Máy dựng' && p.grade !== 'Máy ráp');

            const getStartingPrice = (physicalList) => {
                const validPrices = physicalList.map(p => p.sellingPrice || (p.importPrice * 1.15)).filter(price => !isNaN(price) && price > 0);
                return validPrices.length > 0 ? Math.min(...validPrices) : (model.price || 0);
            };

            const getDisplayImage = (physicalList) => {
                const phoneWithImg = physicalList.find(p => p.specificImages && p.specificImages.length > 0);
                return phoneWithImg ? phoneWithImg.specificImages[0] : model.image;
            };

            if (newPhonesPhysical.length > 0) {
                newList.push({
                    ...model,
                    image: getDisplayImage(newPhonesPhysical),
                    price: getStartingPrice(newPhonesPhysical),
                    stockCount: newPhonesPhysical.filter(p => p.status === 'in_stock').length, // CHỈ TÍNH MÁY IN_STOCK ĐỂ CHO PHÉP MUA
                    isUsedCard: false,
                    isAssembledCard: false
                });
            }

            if (usedPhonesPhysical.length > 0) {
                usedList.push({
                    ...model,
                    image: getDisplayImage(usedPhonesPhysical),
                    price: getStartingPrice(usedPhonesPhysical),
                    stockCount: usedPhonesPhysical.filter(p => p.status === 'in_stock').length,
                    isUsedCard: true,
                    isAssembledCard: false
                });
            }

            if (assembledPhonesPhysical.length > 0) {
                assembledList.push({
                    ...model,
                    image: getDisplayImage(assembledPhonesPhysical),
                    price: getStartingPrice(assembledPhonesPhysical),
                    stockCount: assembledPhonesPhysical.filter(p => p.status === 'in_stock').length,
                    isUsedCard: false,
                    isAssembledCard: true
                });
            }
        });

        return {
            stores: storeData,
            activeStore,
            newPhones: newList,
            usedPhones: usedList,
            assembledPhones: assembledList 
        };
    } catch (error) {
        console.error("Lỗi lấy dữ liệu Home:", error);
        toast.error("Không thể tải dữ liệu.");
        return null;
    }
};