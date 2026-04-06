const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventoryTransactionDetailSchema = new Schema(
  {
    transactionId: { 
      type: Schema.Types.ObjectId, 
      ref: "Inventory_transaction", 
      required: true 
    },
    phoneId: { type: Schema.Types.ObjectId, ref: "Phone" },
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },
    quantity: { type: Number, default: 1 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Inventory_transaction_detail || mongoose.model("Inventory_transaction_detail", inventoryTransactionDetailSchema);