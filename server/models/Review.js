const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        phoneModel: { type: Schema.Types.ObjectId, ref: 'Phone_model', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        
        criteria: {
            performance: { type: Number, min: 1, max: 5, default: 5 },
            battery: { type: Number, min: 1, max: 5, default: 5 },
            camera: { type: Number, min: 1, max: 5, default: 5 }
        },
        
        hasPurchased: { type: Boolean, default: false } 
    },
    { timestamps: true }
);

// RÀNG BUỘC: 1 User chỉ có 1 bài đánh giá cho 1 PhoneModel
reviewSchema.index({ user: 1, phoneModel: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);