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
<<<<<<< HEAD

module.exports = {
    getAllRecipes,
    createRecipe
=======
// Hàm lấy Recipe dựa trên ID của dòng máy (Phone Model)
const getRecipeByModelId = async (req, res) => {
    try {
        const { modelId } = req.params;

        // Tìm Recipe theo phoneModelId và populate để lấy field 'name' của bảng Item_type
        const recipe = await Recipe.findOne({ phoneModelId: modelId })
            .populate({
                path: 'requiredParts.itemTypeId',
                select: 'name' // Chỉ lấy tên linh kiện cho nhẹ
            });

        if (!recipe) {
            return res.status(404).json({ message: "Không tìm thấy Recipe cho dòng máy này" });
        }

        res.status(200).json(recipe);
    } catch (error) {
        console.error("Lỗi lấy Recipe:", error);
        res.status(500).json({ message: "Lỗi Server: " + error.message });
    }
};
module.exports = {
    getAllRecipes,
    createRecipe,
    getRecipeByModelId
>>>>>>> aed3065ecfa13016089a9f327d13e8b8ebb409b8
};