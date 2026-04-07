const Recipe = require("../models/Recipe");

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

module.exports = { getAllRecipes, createRecipe, updateRecipe, deleteRecipe };