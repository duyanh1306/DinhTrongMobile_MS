const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    name: String, 
    code: Number, 
    codename: String,
    division_type: String,
    phone_code: Number,
    districts: [{
        name: String,
        code: Number,
        codename: String,
        division_type: String,
        wards: [{
            name: String, 
            code: Number,
            codename: String,
            division_type: String
        }]
    }]
});

module.exports = mongoose.model("VietnamLocation", locationSchema);