const mongoose = require("mongoose");
const { Schema } = mongoose;

const item_typeSchema = new Schema(
    {
        name:{ type: String, required: true },
        code: { type: String, required: true, unique: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Item_type", item_typeSchema);