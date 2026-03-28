const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderItemSchema = new Schema({
    productType: { type: String, enum: ['PHONE', 'CUSTOM_BUILD'], required: true },
    phoneModelId: { type: Schema.Types.ObjectId, ref: 'Phone_model' },
    name: { type: String, required: true },
    colorName: { type: String },
    capacity: { type: String },
    grade: { type: String }, 
    selectedParts: [{ type: Schema.Types.ObjectId, ref: 'Item' }],
    image: { type: String },
    price: { type: Number, required: true },
    phoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Phone' },
    quantity: { type: Number, required: true, default: 1 },
    warrantyPeriod: { type: Number, default: 0 } 
});

const orderSchema = new Schema({
    orderCode: { type: String, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    
    shippingInfo: {
        deliveryMethod: { type: String, enum: ['home', 'store'], default: 'home' },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        province: { type: String },
        district: { type: String },
        ward: { type: String },
        address: { type: String }, 
        note: { type: String }
    },
    
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    
    paymentMethod: { type: String, enum: ['PAYOS', 'VNPAY'], default: 'VNPAY' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    
    orderStatus: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Delivering', 'Waiting_Confirm', 'Completed', 'Cancelled', 'Issue_Reported'],
        default: 'Pending' 
    }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
    if (!this.orderCode) {
        this.orderCode = 'DTM-' + Math.floor(100000 + Math.random() * 900000);
    }
    next();
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);