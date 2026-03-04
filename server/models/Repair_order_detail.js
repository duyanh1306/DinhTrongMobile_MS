const mongoose = require("mongoose");

const repairOrderDetailSchema = new mongoose.Schema(
  {
    repairOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repair_order",
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item", 
    },
    repairServiceId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repair_service",
    },
    warranty: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: "",
    },
    warrantyExpireDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Repair_order_detail", repairOrderDetailSchema);