const mongoose = require("mongoose");
const { Schema } = mongoose;

const repair_serviceSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            match: [/^[\p{L}0-9_ -]+$/u, 'Name can only contain letters, numbers, spaces, hyphens, and underscores']
        },
        price: {
            type: Number,
            // min: [1,"Price must be 1 or higher"],
        },
        partCode: {
            type: String,
            trim: true,
            default: "",
        },
    }
);

repair_serviceSchema.index({name: 1}, {unique: true})

module.exports = mongoose.model("Repair_service", repair_serviceSchema);
