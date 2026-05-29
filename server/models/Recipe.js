const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  label: { type: String, required: true }, 
  value: { type: String, required: true }, 
  deductionPercent: { type: Number, default: 0 }, 
  isFaulty: { type: Boolean, default: false } 
}, { _id: false }); 

const recipeSchema = new mongoose.Schema({
    phoneModelId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Phone_model',
        required: true
    },
    description: { type: String },
    requiredParts: [{
        partCode: { type: String }, 
        name: { type: String, required: true }, 
        acceptedItemTypes: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Item_type' 
        }],
        quantity: { type: Number, default: 1 },
        isRequired: { type: Boolean, default: true },
        conditions: [conditionSchema] 
    }]
}, { timestamps: true });

module.exports = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);