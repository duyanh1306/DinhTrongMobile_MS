import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Hàm lấy tất cả dữ liệu ban đầu cho trang Recipe
export const fetchInitialDataApi = async () => {
    try {
        const [recipeRes, modelRes, typeRes] = await Promise.all([
            axiosClient.get("/recipes/all"),
            axiosClient.get("/phone_models/all"),
            axiosClient.get("/item_types/all")
        ]);
        
        return {
            recipes: recipeRes.data?.data || [],
            phoneModels: modelRes.data?.data || [],
            itemTypes: typeRes.data?.data || []
        };
    } catch (error) {
        toast.error("Lỗi tải dữ liệu ban đầu");
        return { recipes: [], phoneModels: [], itemTypes: [] };
    }
};
export const getAllRecipesApi = async () => {
    try {
        const response = await axiosClient.get("/recipes/all");
        return response.data?.data || response.data || [];
    } catch (error) {
        console.error("Lỗi lấy danh sách Recipe:", error);
        return [];
    }
};
// Hàm tạo mới Công thức
export const createRecipeApi = async (payload) => {
    try {
        await axiosClient.post("/recipes/create", payload);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Tạo công thức thất bại!");
        return false;
    }
};

// Hàm cập nhật Công thức
export const updateRecipeApi = async (id, payload) => {
    try {
        await axiosClient.put(`/recipes/update/${id}`, payload);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Cập nhật công thức thất bại!");
        return false;
    }
};

// Hàm xóa Công thức
export const deleteRecipeApi = async (id) => {
    try {
        await axiosClient.delete(`/recipes/delete/${id}`);
        return true;
    } catch (error) {
        toast.error(error.response?.data?.message || "Xóa thất bại!");
        return false;
    }
};