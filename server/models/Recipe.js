const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    phoneModelId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Phone_model',
        required: true
    },
    description: { type: String },
    requiredParts: [{
        name: { type: String, required: true }, 
        acceptedItemTypes: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Item_type' 
        }],
        quantity: { type: Number, default: 1 },
        isRequired: { type: Boolean, default: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);