const mongoose = require("mongoose");
const { Schema } = mongoose;

const item_typeSchema = new Schema(
    {
        name:{
            type: String,
            required: true,
            minlength: [2,"Name must have at least 2 characters"],
            maxlength: [100,"Max 100 character"]
        },
        code: {
            type: String,
            required: true,
            minlength: [2,"Code must have at least 2 characters"],
            maxlength: 100
        },
        price: {
            type: Number,
            required: true,
            min: [1,"Price must be 1 or higher"],
        },
        baseCost: {
            type: Number,
            required: true,
            min: [1,"Base cost must be 1 or higher"],
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

item_typeSchema.index({name: 1, code: 1}, {unique: true})

module.exports = mongoose.model("Item_type", item_typeSchema);
