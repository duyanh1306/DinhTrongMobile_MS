const Recipe = require("../models/Recipe");
const Item = require("../models/Item");
const { validateRepairItemForModel } = require("../utils/repairPartValidation");
const { PART_CODES } = require("../constants/partCodes");

const getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate('phoneModelId', 'name image brand') 
            .populate('requiredParts.acceptedItemTypes', 'name code image'); 
            
        res.status(200).json({ success: true, data: recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createRecipe = async (req, res) => {
    try {
        const newRecipe = new Recipe(req.body);
        const savedRecipe = await newRecipe.save();
        res.status(201).json({ success: true, data: savedRecipe });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateRecipe = async (req, res) => {
    try {
        const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Không tìm thấy công thức" });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteRecipe = async (req, res) => {
    try {
        await Recipe.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa công thức" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPartCodes = async (req, res) => {
    res.status(200).json({ success: true, data: PART_CODES });
};

const validateRepairItem = async (req, res) => {
    try {
        const { phoneModelId, partCodes, serialCode } = req.body;

        if (!phoneModelId || !serialCode) {
            return res.status(400).json({
                success: false,
                ok: false,
                message: "Thiếu mẫu máy hoặc mã serial",
            });
        }

        const codes = Array.isArray(partCodes) ? partCodes.filter(Boolean) : [];
        if (codes.length === 0) {
            return res.status(400).json({
                success: false,
                ok: false,
                message: 'Dịch vụ chưa gán nhóm linh kiện (partCode)',
            });
        }

        const item = await Item.findOne({
            serialCode: { $regex: new RegExp(`^${String(serialCode).trim()}$`, "i") },
        }).populate("item_type", "name code");

        if (!item) {
            return res.status(404).json({
                success: false,
                ok: false,
                message: `Không tìm thấy linh kiện: ${serialCode}`,
            });
        }

        const result = await validateRepairItemForModel(item, phoneModelId, codes);

        if (!result.ok) {
            return res.status(200).json({
                success: true,
                ok: false,
                message: result.reason,
            });
        }

        res.status(200).json({
            success: true,
            ok: true,
            item: {
                _id: item._id,
                name: item.name,
                serialCode: item.serialCode,
                price: item.price,
                item_type: item.item_type,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, ok: false, message: error.message });
    }
};

const getRecipeByPhoneModelId = async (req, res) => {
    try {
        const { phoneModelId } = req.params;
        
        if (!phoneModelId) {
            return res.status(400).json({ 
                success: false, 
                message: "phoneModelId là bắt buộc" 
            });
        }

        const recipe = await Recipe.findOne({ phoneModelId })
            .populate('phoneModelId', 'name image brand') 
            .populate('requiredParts.acceptedItemTypes', 'name code image');
            
        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                message: `Không tìm thấy Recipe cho model ID: ${phoneModelId}`,
                data: null
            });
        }

        res.status(200).json({ 
            success: true, 
            data: recipe 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getPartCodes,
    validateRepairItem,
    getRecipeByPhoneModelId,
};