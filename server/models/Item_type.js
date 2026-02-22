const mongoose = require("mongoose");
const { Schema } = mongoose;

const item_typeSchema = new Schema(
    {
        name:{
            type: String,
            required: true,
            minlength: 3,
            maxlength: 100
        },
        code: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 100
        },
        price: {
            type: Number,
            required: true,
        },
        baseCost: {
            type: Number,
            required: true,
        },
        compatiblePhoneModels: [{
            type: Schema.Types.ObjectId,
            ref: 'Phone_model'
        }]
    },
    {
        timestamps: true,
    }
);

// item_typeSchema.index({name: 1, code: 1}, {unique: true})

module.exports = mongoose.model("Item_type", item_typeSchema);
