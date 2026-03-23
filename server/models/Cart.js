const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    // Phân loại: Điện thoại nguyên bản hay Máy ráp linh kiện
    productType: { type: String, enum: ['PHONE', 'CUSTOM_BUILD'], required: true },
    
    // 1. Nếu là PHONE (Mua nguyên chiếc)
    phoneModelId: { type: Schema.Types.ObjectId, ref: 'Phone_model' },
    colorName: { type: String },
    capacity: { type: String },
    
    // 2. Nếu là CUSTOM_BUILD (Máy tự ráp)
    // Lưu lại danh sách ID của các linh kiện thực tế (bảng Item) khách đã chọn
    selectedParts: [{ type: Schema.Types.ObjectId, ref: 'Item' }], 
    
    // Thông tin hiển thị chung
    name: { type: String, required: true }, // VD: "iPhone 14 Pro" hoặc "iPhone 14 Pro (Tự dựng)"
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 }
});

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);