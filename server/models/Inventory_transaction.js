const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventoryTransactionSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    fromStoreId: {
      type: Schema.Types.ObjectId,
      ref: "Store", // Có thể null nếu là nhập kho mới từ nhà cung cấp
    },
    toStoreId: {
      type: Schema.Types.ObjectId,
      ref: "Store", // Có thể null nếu là xuất bán cho khách
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ['IMPORT', 'EXPORT', 'TRANSFER'], 
      required: true,
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

module.exports = mongoose.model("Inventory_transaction", inventoryTransactionSchema);