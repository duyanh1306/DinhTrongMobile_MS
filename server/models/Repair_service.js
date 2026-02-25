const mongoose = require("mongoose");
const { Schema } = mongoose;

const repair_serviceSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: [2,"Name must have at least 2 characters"],
            maxlength: [100,"Max 100 character"],
            validate: {
                validator: function(v) {
                    return /^[a-zA-Z0-9\s\-_]+$/.test(v);
                },
                message: 'Name can only contain letters, numbers, spaces, hyphens, and underscores'
            }
        },
        price: {
            type: Number,
            // min: [1,"Price must be 1 or higher"],
        }
    }
);

repair_serviceSchema.index({name: 1}, {unique: true})

module.exports = mongoose.model("Repair_service", repair_serviceSchema);
