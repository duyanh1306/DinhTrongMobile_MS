const mongoose = require("mongoose");
const { Schema } = mongoose;

const phone_modelSchema = new Schema(
    {
        name:{
            type: String,
            required: true,
            minLength: 2,
            maxLength: 100
        },
        brand: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 100
        },
    },
    {
        timestamps: true,
    }
);

phone_modelSchema.index({name: 1}, {unique: true})

module.exports = mongoose.model("Phone_model", phone_modelSchema);
