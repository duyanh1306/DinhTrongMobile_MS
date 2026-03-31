const mongoose = require("mongoose");

const warrantySchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    phoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Phone", required: true },
    phoneModel: { type: String, required: true },
    serialCode: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    issueDescription: { type: String, required: true },
    isNewDevice: { type: Boolean, required: true },
    warrantyType: { 
      type: String, 
      enum: ["REPLACEMENT", "REPAIR"], 
      required: true 
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Rejected"],
      default: "Pending",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String, default: "" },
    replacementPhoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Phone" },
    repairOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Repair_order" },
  },
  { timestamps: true }
);

warrantySchema.index({ storeId: 1, status: 1 });
warrantySchema.index({ serialCode: 1 });
warrantySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Warranty", warrantySchema);
