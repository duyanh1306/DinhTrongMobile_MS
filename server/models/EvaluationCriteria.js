const mongoose = require("mongoose");
const { Schema } = mongoose;

const conditionOptionSchema = new Schema({
  label: { type: String, required: true }, 
  value: { type: String, required: true },
  deductionPercent: { type: Number, default: 0 }, 
  deductionAmount: { type: Number, default: 0 }, 
  isFaulty: { type: Boolean, default: false } 
});

const evaluationCriteriaSchema = new Schema({
  partCode: { type: String, required: true, unique: true }, 
  partName: { type: String, required: true }, 
  order: { type: Number, default: 0 },
  conditions: [conditionOptionSchema]
}, { timestamps: true });

module.exports = mongoose.models.EvaluationCriteria || mongoose.model("EvaluationCriteria", evaluationCriteriaSchema);