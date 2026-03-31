import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// 1. Lấy thông tin Model và Danh sách điện thoại vật lý tương ứng
export const fetchPhoneDetailApi = async (modelId) => {
    try {
        const [modelsRes, phonesRes] = await Promise.all([
            axiosClient.get('/phone_models/all'),
            axiosClient.get('/phones/all')
        ]);

        const allModels = modelsRes.data?.data || [];
        const allPhones = phonesRes.data?.data || [];

        const currentModel = allModels.find(m => m._id === modelId);
        if (!currentModel) return null;

        const inStockPhones = allPhones.filter(p => 
            (p.phoneModelId?._id === modelId || p.phoneModelId === modelId) && p.status === 'in_stock'
        );

        return { model: currentModel, availablePhones: inStockPhones };
    } catch (error) {
        console.error("Lỗi lấy thông tin chi tiết điện thoại:", error);
        toast.error("Lỗi khi tải dữ liệu sản phẩm.");
        return null;
    }
};

// 2. Tính toán danh sách các phiên bản (Dung lượng + Mới/Cũ)
export const calculateVersions = (availablePhones) => {
    const vMap = {};
    availablePhones.forEach(p => {
        const grade = p.grade || "Mới";
        const key = `${p.capacity}|${grade}`;
        const price = p.sellingPrice || (p.importPrice * 1.15);
        
        if (!vMap[key]) {
            vMap[key] = {
                key: key, capacity: p.capacity, grade: grade,
                label: grade === 'Mới' ? p.capacity : `${p.capacity} - ${grade}`,
                sortPrice: price
            };
        } else if (price < vMap[key].sortPrice) {
            vMap[key].sortPrice = price; 
        }
    });
    return Object.values(vMap).sort((a, b) => a.sortPrice - b.sortPrice);
};

// 3. Lấy danh sách màu sắc của 1 phiên bản cụ thể
export const calculateColorsForVersion = (availablePhones, selectedVersionKey) => {
    if (!selectedVersionKey) return [];
    const [selCap, selGrade] = selectedVersionKey.split('|');
    const cMap = {};
    
    availablePhones.filter(p => p.capacity === selCap && (p.grade || "Mới") === selGrade).forEach(p => {
        const price = p.sellingPrice || (p.importPrice * 1.15);
        if (!cMap[p.colorName] || price < cMap[p.colorName].price) {
            cMap[p.colorName] = { name: p.colorName, price: price, image: p.specificImages?.[0] || null };
        }
    });
    return Object.values(cMap).sort((a, b) => a.price - b.price);
};

// 4. Gọi API thêm vào giỏ hàng
export const addToCartApi = async (userId, cartItem) => {
    try {
        await axiosClient.post('/cart/add', { userId: userId, item: cartItem });
        return true;
    } catch (error) {
        console.error("Lỗi thêm vào giỏ hàng:", error);
        toast.error("Lỗi khi thêm vào giỏ hàng.");
        return false;
    }
};