const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemSchema = new Schema(
    {
        name:{
            type: String,
            required: false, // Make optional for existing data
            minlength: [2,"Name must have at least 2 characters"],
            maxlength: [100,"Max 100 character"],
            validate: {
                validator: function(v) {
                    return !v || /^[a-zA-Z0-9\s\-_]+$/.test(v);
                },
                message: 'Name can only contain letters, numbers, spaces, hyphens, and underscores'
            }
        },
        serialCode: {
            type: String,
            required: true,
            minlength: [2,"Code must have at least 2 characters"],
            maxlength: [100,"Max 100 character"],
            validate: {
                validator: function(v) {
                    return /^[a-zA-Z0-9\s\-_]+$/.test(v);
                },
                message: 'Code can only contain letters, numbers, spaces, hyphens, and underscores'
            }
        },
        status: {
            type: String,
            default: "available"
        },
        item_type: {
            type: Schema.Types.ObjectId,
            ref: "Item_type",
        },
        repairOrderId: {
            type: Schema.Types.ObjectId,
            ref: "Repair_order"
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: "Store",
        }
    },
    {
        timestamps: true,
    }
);

itemSchema.pre('save', function(next) {
    if (!this.item_type) {
        const error = new Error('Item must have item_type.');
        return next(error);
    }
    
    next();
});

itemSchema.index({name: 1, serialCode: 1}, {unique: true})

module.exports = mongoose.model("Item", itemSchema);
