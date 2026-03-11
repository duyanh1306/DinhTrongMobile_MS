const Recipe = require('../models/Recipe'); // Nhớ sửa đường dẫn trỏ đúng file model Recipe của mày

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
    getRecipeByModelId
};