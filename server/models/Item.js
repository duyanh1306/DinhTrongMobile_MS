const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemSchema = new Schema(
    {
        name: { type: String, required: true },
        serialCode: { type: String, required: true, unique: true },
        item_type: { type: Schema.Types.ObjectId, ref: "Item_type", required: true },
        status: { type: String, default: "in_stock" },
        origin: { type: String, enum: ['new', 'disassembled'] }, 
        sourceDevice: { type: String }, 
        quality: { type: String }, 
        baseCost: { type: Number }, 
        price: { type: Number },    
        repairOrderId: { type: Schema.Types.ObjectId, ref: "Repair_order" },
        storeId: { type: Schema.Types.ObjectId, ref: "Store" },
        warrantyPeriod: { type: Number },

        // THÊM 3 TRƯỜNG THUỘC TÍNH NÀY VÀO
        ram: { type: String },
        capacity: { type: String },
        color: { type: String }
    },
    { timestamps: true }
);

itemSchema.pre('save', function(next) {
    if (this.origin === 'disassembled' && this.warrantyPeriod == null) {
        this.warrantyPeriod = 3;
    }
    next();
});

itemSchema.index({name: 1, serialCode: 1}, {unique: true});
module.exports = mongoose.model("Item", itemSchema);