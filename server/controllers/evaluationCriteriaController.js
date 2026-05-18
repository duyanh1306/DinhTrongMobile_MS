const EvaluationCriteria = require("../models/EvaluationCriteria");

const getAllCriteria = async (req, res) => {
  try {
    const criteria = await EvaluationCriteria.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: criteria });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCriteria = async (req, res) => {
  try {
    const { partCode, partName, order, conditions } = req.body;
    const newCriteria = new EvaluationCriteria({
      partCode,
      partName,
      order,
      conditions
    });
    await newCriteria.save();
    res.status(201).json({ success: true, data: newCriteria });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { partName, order, conditions } = req.body;

    const updatedCriteria = await EvaluationCriteria.findByIdAndUpdate(
      id,
      { partName, order, conditions },
      { new: true, runValidators: true }
    );

    if (!updatedCriteria) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tiêu chí!" });
    }

    res.status(200).json({ success: true, data: updatedCriteria });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCriteria = await EvaluationCriteria.findByIdAndDelete(id);

    if (!deletedCriteria) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tiêu chí!" });
    }

    res.status(200).json({ success: true, message: "Xóa thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCriteria,
  createCriteria,
  updateCriteria,
  deleteCriteria
};