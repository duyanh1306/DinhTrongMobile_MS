const mongoose = require("mongoose");
const { Schema } = mongoose;

const phoneSchema = new Schema(
    {
        serialCode: { type: String, required: true, unique: true }, 
        
        phoneModelId: { type: Schema.Types.ObjectId, ref: 'Phone_model', required: true }, 
        colorName: { type: String, required: true }, 
        capacity: { type: String, required: true },  
        grade: {
            type: String,
            default: 'Mới'
        },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true }, 
        
        status: { 
            type: String, 
            enum: ['in_stock', 'sold', 'repairing', 'defective', 'waiting_for_tech_decision'], 
            default: 'in_stock' 
        },
        checklistData: { type: String },
        importPrice: { type: Number, required: true }, 
        sellingPrice: { type: Number, required: true }, 
        warrantyPeriod: { type: Number, default: 0 }, 
        
        source: {
            type: String,
            default: 'supplier'
        },
        notes: { type: String },
        specificImages: [{ type: String }],
        
        items: [{ type: Schema.Types.ObjectId, ref: 'Item' }], 
        assembled_by: { type: Schema.Types.ObjectId, ref: 'User' } 
    },
    { timestamps: true }
);

module.exports = mongoose.models.Phone || mongoose.model("Phone", phoneSchema);