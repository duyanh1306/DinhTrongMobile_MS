const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  targetModel: { type: String, required: true }, 
  description: { type: String },
  requiredParts: [{
    itemTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item_type' },
    name: { type: String },
    quantity: { type: Number, default: 1 },
    isRequired: { type: Boolean, default: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Recipe", recipeSchema);