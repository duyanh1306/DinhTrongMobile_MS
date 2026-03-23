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
      enum: ['Pending_Tech', 'Pending', 'Completed', 'Cancelled'], 
      default: 'Pending_Tech'
    },
    orderType: {
      type: String,
      enum: ["SALE", "PURCHASE"], 
      required: true,
    },
    note: { type: String },
    tempPhoneData: {
      type: {
        phoneModelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Phone_model' },
        imei: { type: String }
      },
      default: null 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Purchase_order || mongoose.model("Purchase_order", purchaseOrderSchema);