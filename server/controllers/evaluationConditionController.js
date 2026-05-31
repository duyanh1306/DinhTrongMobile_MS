const EvaluationCondition = require('../models/EvaluationCondition');

const getAllConditions = async (req, res) => {
    try {
        const conditions = await EvaluationCondition.find().sort({ partCode: 1, isFaulty: 1 });
        res.status(200).json({ success: true, data: conditions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createCondition = async (req, res) => {
    try {
        if (Array.isArray(req.body)) {
            const newConditions = await EvaluationCondition.insertMany(req.body);
            return res.status(201).json({ success: true, data: newConditions });
        }
        
        const newCondition = new EvaluationCondition(req.body);
        await newCondition.save();
        res.status(201).json({ success: true, data: newCondition });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCondition = async (req, res) => {
    try {
        const updated = await EvaluationCondition.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Không tìm thấy" });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCondition = async (req, res) => {
    try {
        await EvaluationCondition.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllConditions, createCondition, updateCondition, deleteCondition };