const mongoose = require("mongoose");
const { Schema } = mongoose;

const phone_modelSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            minLength: [2, "Name must have at least 2 characters"],
            maxLength: 100,
            validate: {
                // Đã sửa Regex để cho phép tiếng Việt, dấu ngoặc, dấu %,...
                validator: function(v) {
                    return /^[\p{L}0-9\s\-_().%,]+$/u.test(v);
                },
                message: 'Name contains invalid characters'
            }
        },
        brand: {
            type: String,
            required: true,
            minLength: [2, "Brand must have at least 2 characters"],
            maxLength: 100,
            validate: {
                validator: function(v) {
                    return /^[\p{L}0-9\s\-_]+$/u.test(v);
                },
                message: 'Brand contains invalid characters'
            }
        },
        // Khai báo thêm các trường để API GET nhả ra dữ liệu cho trang Home
        price: {
            type: Number,
            default: 0
        },
        image: {
            type: String,
            default: ""
        },
        condition: {
            type: Number,
            default: 1
        },
        specifications: {
            screenSize: { type: String },
            screenTechnology: { type: String },
            rearCamera: { type: String },
            frontCamera: { type: String },
            chipset: { type: String },
            nfc: { type: String },
            internalStorage: { type: String },
            sim: { type: String },
            os: { type: String },
            screenResolution: { type: String },
            screenFeatures: { type: String },
            cpu: { type: String }
        }
    },
    {
        timestamps: true,
    }
);

phone_modelSchema.index({name: 1}, {unique: true});

module.exports = mongoose.model("Phone_model", phone_modelSchema);