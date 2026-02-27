const mongoose = require("mongoose");
const { Schema } = mongoose;

const phone_modelSchema = new Schema(
    {
        name:{
            type: String,
            required: true,
            minLength: [2,"Name must have at least 2 characters"],
            maxLength: 100,
            validate: {
                validator: function(v) {
                    return /^[a-zA-Z0-9\s\-_]+$/.test(v);
                },
                message: 'Name can only contain letters, numbers, spaces, hyphens, and underscores'
            }
        },
        brand: {
            type: String,
            required: true,
            minLength: [2,"Brand must have at least 2 characters"],
            maxLength: 100,
            validate: {
                validator: function(v) {
                    return /^[a-zA-Z0-9\s\-_]+$/.test(v);
                },
                message: 'Brand can only contain letters, numbers, spaces, hyphens, and underscores'
            }
        },
        compatibleItemTypes: [{
            type: Schema.Types.ObjectId,
            ref: "Item_type",
        }]
    },
    {
        timestamps: true,
    }
);

phone_modelSchema.index({name: 1}, {unique: true})

module.exports = mongoose.model("Phone_model", phone_modelSchema);
