const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
        },
        password: {
            type: String,
            required: false, 
        },
        googleId: { 
            type: String,
            unique: true,
            sparse: true // Cho phép null và vẫn unique
        },
        authType: { // <-- (Tùy chọn) Để biết user dùng local hay google
            type: String,
            enum: ['local', 'google'],
            default: 'local'
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
        },
        number: {
            type: String,
            required: false,
        },
        birthday: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    if (!value) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const birthday = new Date(value);
                    birthday.setHours(0, 0, 0, 0);
                    return birthday < today;
                },
                message: "birthday must be a real date"
            }
        },
        address: {
            type: String,
            required: false,
            default: ""
        },
        image: {
            type: String,
        },
        imagePublicId: {
            type: String,
            default: null,
        },
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            required: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: false,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive', 'pending'],
            default: 'pending'
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);