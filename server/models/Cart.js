const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    productType: { type: String, enum: ['PHONE', 'CUSTOM_BUILD'], required: true },
    phoneModelId: { type: Schema.Types.ObjectId, ref: 'Phone_model' },
    colorName: { type: String },
    capacity: { type: String },
    grade: { type: String }, 
    
    selectedParts: [{ type: Schema.Types.ObjectId, ref: 'Item' }], 
    name: { type: String, required: true }, 
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true } 
});

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);