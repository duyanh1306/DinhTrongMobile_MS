const mongoose = require("mongoose");
const { Schema } = mongoose;

const recipeSchema = new Schema({
    phoneModelId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Phone_model', 
        required: true,
        unique: true 
    },
    description: { 
        type: String 
    },

    requiredParts: [{
        itemTypeId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Item_type',
            required: true 
        },
        quantity: { 
            type: Number, 
            default: 1,
            min: [1, 'Số lượng tối thiểu phải là 1']
        },
        isRequired: { 
            type: Boolean, 
            default: true 
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Recipe", recipeSchema);