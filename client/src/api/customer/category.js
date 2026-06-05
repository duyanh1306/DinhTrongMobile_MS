import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchCategoryDataApi = async (type, selectedStore) => {
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
        
      
        const brandsRes = await axiosClient.get('/phone_models/brands').catch(() => ({ data: { data: [] } }));
        let brandsData = brandsRes.data?.data || [];
        
       
        const uniqueBrands = [];
        const brandMap = new Map();
        phoneModels.forEach(m => {
            if (m.brand && !brandMap.has(m.brand._id || m.brand)) {
                brandMap.set(m.brand._id || m.brand, true);
                uniqueBrands.push(m.brand);
            }
        });

        const resultList = [];

        phoneModels.forEach(model => {
          
            const allModelPhones = phones.filter(p => {
                const pStoreId = p.storeId?._id || p.storeId;
                const pModelId = p.phoneModelId?._id || p.phoneModelId;
                return (
                    p.status === 'in_stock' && 
                    String(pModelId) === String(model._id) && 
                    String(pStoreId) === String(activeStore)
                );
            });

            if (allModelPhones.length === 0) return;

            const getDisplayImage = (physicalList) => {
                const phoneWithImg = physicalList.find(p => p.specificImages && p.specificImages.length > 0);
                return phoneWithImg ? phoneWithImg.specificImages[0] : model.image;
            };

            const getStartingPrice = (physicalList) => {
                const validPrices = physicalList.map(p => p.sellingPrice).filter(price => !isNaN(price) && price > 0);
                return validPrices.length > 0 ? Math.min(...validPrices) : 0;
            };

            const brandId = model.brand?._id || model.brand;

        
            if (type === 'new') {
                const newPhones = allModelPhones.filter(p => !p.grade || p.grade === 'Mới');
                if (newPhones.length > 0 && getStartingPrice(newPhones) > 0) {
                    resultList.push({
                        ...model,
                        image: getDisplayImage(newPhones),
                        price: getStartingPrice(newPhones),
                        stockCount: newPhones.length,
                        isUsedCard: false,
                        isAssembledCard: false,
                        brandId: brandId
                    });
                }
            } 
     
            else if (type === 'used') {
                const usedPhones = allModelPhones.filter(p => p.grade && p.grade !== 'Mới' && p.grade !== 'Máy dựng' && p.grade !== 'Máy ráp');
                usedPhones.forEach(phone => {
                    if (phone.sellingPrice > 0) {
                        resultList.push({
                            ...model,
                            _id: model._id,
                            uniqueKey: phone._id,
                            name: `${model.name} (${phone.capacity})`,
                            image: (phone.specificImages && phone.specificImages.length > 0) ? phone.specificImages[0] : model.image,
                            price: phone.sellingPrice,
                            stockCount: 1,
                            isUsedCard: true,
                            isAssembledCard: false,
                            customBadge: phone.colorName,
                            capacity: phone.capacity,
                            grade: phone.grade,
                            colorName: phone.colorName,
                            brandId: brandId
                        });
                    }
                });
            } 
            
            else if (type === 'assembled') {
                const assembledPhones = allModelPhones.filter(p => p.grade === 'Máy dựng' || p.grade === 'Máy ráp');
                assembledPhones.forEach(phone => {
                    if (phone.sellingPrice > 0) {
                        resultList.push({
                            ...model,
                            _id: model._id,
                            uniqueKey: phone._id,
                            name: `${model.name} (${phone.capacity})`,
                            image: (phone.specificImages && phone.specificImages.length > 0) ? phone.specificImages[0] : model.image,
                            price: phone.sellingPrice,
                            stockCount: 1,
                            isUsedCard: false,
                            isAssembledCard: true,
                            customBadge: phone.colorName,
                            capacity: phone.capacity,
                            grade: phone.grade,
                            colorName: phone.colorName,
                            brandId: brandId
                        });
                    }
                });
            }
        });

        return {
            stores: storeData,
            activeStore,
            brands: uniqueBrands.length > 0 ? uniqueBrands : brandsData,
            allProducts: resultList
        };
    } catch (error) {
        console.error("Lỗi fetchCategoryDataApi:", error);
        toast.error("Lỗi khi tải dữ liệu.");
        return null;
    }
};