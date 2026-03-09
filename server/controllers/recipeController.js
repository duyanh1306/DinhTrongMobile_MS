const Recipe = require("../models/Recipe");

// Lấy tất cả công thức dựng máy (dùng cho trang Build Phone của khách)
const getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            // Lấy thông tin Tên và Ảnh của dòng máy mục tiêu
            .populate('phoneModelId', 'name image price')
            // Lấy thông tin Tên và Mã của từng loại linh kiện yêu cầu
            .populate('requiredParts.itemTypeId', 'name code');

        res.status(200).json({ success: true, data: recipes });
    } catch (error) {
        console.error("Lỗi get recipes:", error);
        res.status(500).json({ success: false, message: "Lỗi server khi tải công thức." });
    }
};

// (Tùy chọn) Thêm công thức mới - Dùng cho Admin
const createRecipe = async (req, res) => {
    try {
        const newRecipe = new Recipe(req.body);
        const savedRecipe = await newRecipe.save();
        res.status(201).json({ success: true, data: savedRecipe });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllRecipes,
    createRecipe
};