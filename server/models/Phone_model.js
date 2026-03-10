const mongoose = require("mongoose");
const { Schema } = mongoose;

const phone_modelSchema = new Schema(
    {
        name: { type: String, required: true, minLength: 2, maxLength: 100 },
        brand: { type: Schema.Types.ObjectId, ref: "Phone_brand", required: true },
        image: { type: String, default: "" }, 
        condition: { type: Number, default: 1, min: 0, max: 1 },
        price: { type: Number, default: 0 }, // Mới: Thêm giá mặc định theo DB
        specifications: {
            screenSize: { type: String }, screenTechnology: { type: String },
            rearCamera: { type: String }, frontCamera: { type: String },
            chipset: { type: String }, nfc: { type: String },
            internalStorage: { type: String }, sim: { type: String },
            os: { type: String }, screenResolution: { type: String },
            screenFeatures: { type: String }, cpu: { type: String }
        },
        compatibleItemTypes: [{ type: Schema.Types.ObjectId, ref: 'Item_type' }]
    },
    { timestamps: true }
);

phone_modelSchema.index({name: 1}, {unique: true});
module.exports = mongoose.model("Phone_model", phone_modelSchema);