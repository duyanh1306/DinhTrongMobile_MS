const mongoose = require("mongoose");
const { Schema } = mongoose;

const transferRequestDetailSchema = new Schema(
  {
    transferRequestId: {
      type: Schema.Types.ObjectId,
      ref: "Transfer_request",
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    status: {
      type: String,
      default: "PENDING", 
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

module.exports = mongoose.model("Transfer_request_detail", transferRequestDetailSchema, "transfer_request_detail");