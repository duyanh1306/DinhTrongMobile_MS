const mongoose = require("mongoose");
const { Schema } = mongoose;

const phoneSchema = new Schema(
    {
        imei: { type: String, required: true, unique: true }, 
        phoneModelId: { type: Schema.Types.ObjectId, ref: 'Phone_model', required: true }, 
        colorName: { type: String, required: true }, 
        capacity: { type: String, required: true },  
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true }, 
        status: { 
            type: String, 
            enum: ['in_stock', 'sold', 'repairing', 'defective'], 
            default: 'in_stock' 
        },
        importPrice: { type: Number, required: true }, 
        sellingPrice: { type: Number, required: true }, 
        source: { 
            type: String, 
            enum: ['supplier', 'customer_trade_in', 'assembled'], 
            default: 'supplier' 
        }, 
        notes: { type: String },
        items: [{
            type: Schema.Types.ObjectId,
            ref: "Item",
        }],
        specificImages: [{ type: String }] 
    },
    { timestamps: true }
);

phoneSchema.index({ imei: 1 });
module.exports = mongoose.models.Phone || mongoose.model("Phone", phoneSchema);