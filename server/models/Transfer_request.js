const mongoose = require("mongoose");
const { Schema } = mongoose;

const transferRequestSchema = new Schema(
  {
    fromStoreId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    toStoreId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
    },
    note: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

module.exports = mongoose.model("Transfer_request", transferRequestSchema, "transfer_request");