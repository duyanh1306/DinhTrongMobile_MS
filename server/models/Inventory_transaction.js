const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventoryTransactionSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["INBOUND", "OUTBOUND", "REPAIR_CONSUMPTION"],
      required: true,
    },
    referenceType: {
      type: String,
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    phoneId: {
      type: Schema.Types.ObjectId,
      ref: "Phone",
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Inventory_transaction || mongoose.model("Inventory_transaction", inventoryTransactionSchema);