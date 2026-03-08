const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemSchema = new Schema(
    {
        name: { type: String, required: true },
        serialCode: { type: String, required: true, unique: true },
        item_type: { type: Schema.Types.ObjectId, ref: "Item_type", required: true },
        status: { type: String, default: "in_stock" },
        origin: { type: String, enum: ['new', 'disassembled'] }, // Hàng mới hay bóc máy
        sourceDevice: { type: String }, // Tên máy nguồn nếu là bóc máy (VD: iPhone 14 Pro Bể màn)
        quality: { type: String }, // Chất lượng (VD: 85% - 90%)
        baseCost: { type: Number }, // Giá vốn
        price: { type: Number },    // Giá bán linh kiện
        repairOrderId: { type: Schema.Types.ObjectId, ref: "Repair_order" },
        storeId: { type: Schema.Types.ObjectId, ref: "Store" }
    },
    { timestamps: true }
);

itemSchema.index({name: 1, serialCode: 1}, {unique: true});
module.exports = mongoose.model("Item", itemSchema);