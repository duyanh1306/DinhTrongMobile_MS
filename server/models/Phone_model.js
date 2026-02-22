const mongoose = require("mongoose");
const { Schema } = mongoose;

const phone_modelSchema = new Schema(
    {
        name:{
            type: String,
            required: true,
            minLength: [2,"Name must have at least 2 characters"],
            maxLength: 100
        },
        brand: {
            type: String,
            required: true,
            minLength: [2,"Brand must have at least 2 characters"],
            maxLength: 100
        },
    },
    {
        timestamps: true,
    }
);

phone_modelSchema.index({name: 1}, {unique: true})

module.exports = mongoose.model("Phone_model", phone_modelSchema);
