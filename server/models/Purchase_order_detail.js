const mongoose = require("mongoose");

const purchaseOrderDetailSchema = new mongoose.Schema({
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase_order", required: true },
    phoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Phone" }, 
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" }, 
    

    purchasePrice: { type: Number }, 
    type: { type: String }, 
    sourceDevice: { type: String }, 
    items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        name: { type: String },
        purchasePrice: { type: Number }
    }],
    
    warranty: { type: Boolean, default: false },
    warrantyExpireDate: { type: Date },
    note: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Purchase_order_detail", purchaseOrderDetailSchema);