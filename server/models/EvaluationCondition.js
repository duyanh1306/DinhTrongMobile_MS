// models/EvaluationCondition.js
const mongoose = require('mongoose');

const evaluationConditionSchema = new mongoose.Schema({
    partCode: { type: String, required: true },
    label: { type: String, required: true },
    isFaulty: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.EvaluationCondition || mongoose.model('EvaluationCondition', evaluationConditionSchema);