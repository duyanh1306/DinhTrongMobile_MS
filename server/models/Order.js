const mongoose = require("mongoose");
const { Schema } = mongoose;

// Lưu lại chính xác thông tin sản phẩm lúc mua (tránh việc sau này đổi giá thì lịch sử bị sai)
const orderItemSchema = new Schema({
    productType: { type: String, enum: ['PHONE', 'CUSTOM_BUILD'], required: true },
    phoneModelId: { type: Schema.Types.ObjectId, ref: 'Phone_model' },
    colorName: { type: String },
    capacity: { type: String },
    selectedParts: [{ type: Schema.Types.ObjectId, ref: 'Item' }],
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
});

const orderSchema = new Schema({
    orderCode: { type: String, unique: true }, // Mã đơn dễ nhìn cho khách (VD: DTM-123456)
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Thông tin người nhận hàng
    shippingInfo: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        note: { type: String }
    },
    
    items: [orderItemSchema],
    
    totalAmount: { type: Number, required: true },
    
    paymentMethod: { type: String, enum: ['COD', 'BANK_TRANSFER', 'VNPAY'], default: 'COD' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    
    // Trạng thái vận chuyển của đơn hàng
    orderStatus: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    }
}, { timestamps: true });

// Tự động tạo mã đơn hàng (orderCode) trước khi lưu
orderSchema.pre('save', function(next) {
    if (!this.orderCode) {
        // Tạo mã ngẫu nhiên 6 số: VD: DTM-847291
        this.orderCode = 'DTM-' + Math.floor(100000 + Math.random() * 900000);
    }
    next();
});

module.exports = mongoose.model("Order", orderSchema);