const mongoose = require("mongoose");

const repairOrderDetailSchema = new mongoose.Schema(
  {
    repairOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Repair_order", required: true },
    serviceId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Repair_service" }],
    itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }], 
    
    type: { type: String, enum: ["REPAIR", "WARRANTY"] }, 
    targetPhoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Phone", default: null }, 
    isInternal: { type: Boolean, default: false }, 
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Repair_order_detail", repairOrderDetailSchema);