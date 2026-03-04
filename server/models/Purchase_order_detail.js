// models/Purchase_order_detail.js
const mongoose = require("mongoose");

const purchaseOrderDetailSchema = new mongoose.Schema({
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase_order", required: true },
    

    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    

    phoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Phone" }, 
    
    warranty: { type: Boolean, default: false },
    note: { type: String, default: "" },
    warrantyExpireDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Purchase_order_detail", purchaseOrderDetailSchema);