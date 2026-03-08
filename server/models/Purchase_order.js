const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    totalPrice: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    purchaseOrderDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Completed",
    },
    orderType: {
      type: String,
      enum: ["SALE", "PURCHASE"], 
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase_order", purchaseOrderSchema);