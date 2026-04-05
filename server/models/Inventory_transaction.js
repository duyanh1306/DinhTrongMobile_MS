const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventoryTransactionSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    transactionType: { 
      type: String, 
      enum: ["INBOUND", "OUTBOUND", "REPAIR_CONSUMPTION"], 
      required: true 
    },
    referenceType: { type: String, required: true }, // VD: "IMPORT_BATCH", "ORDER_SALE"
    referenceId: { type: Schema.Types.ObjectId }, // ID của đợt nhập hoặc ID của Order
    totalItems: { type: Number, default: 0 }, // Tổng số lượng món trong phiếu này
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Inventory_transaction || mongoose.model("Inventory_transaction", inventoryTransactionSchema);