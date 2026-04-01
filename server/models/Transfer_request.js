const mongoose = require("mongoose");
const {Schema} = mongoose;

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
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'DELIVERING', 'COMPLETED'],
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
        itemType: [{
            itemTypes: {
                type: Schema.Types.ObjectId,
                ref: "Item_type"
            },
            quantity: Number,
        }],
        phoneModel: [{
           phoneModels: {
               type: Schema.Types.ObjectId,
               ref: "Phone_model"
           },
           quantity: Number
        }]
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Transfer_request", transferRequestSchema);