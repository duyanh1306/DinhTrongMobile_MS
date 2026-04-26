const mongoose = require("mongoose");

const repairOrderSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    customerName: { type: String, required: true },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerPhone: { type: String },
    phoneModelId: { type: mongoose.Schema.Types.ObjectId, ref: "Phone_model" },
    totalPrice: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    repairOrderDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Repair_order", repairOrderSchema);