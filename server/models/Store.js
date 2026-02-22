// models/Store.js
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Store", storeSchema);