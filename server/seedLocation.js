require('dotenv').config(); 
const mongoose = require('mongoose');
const axios = require('axios'); 
const VietnamLocation = require('./models/VietnamLocation'); 
const PROVINCES_API_URL = process.env.PROVINCES_API_URL
const MONGO_URI = process.env.MONGO_URI; 

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        await VietnamLocation.deleteMany({});
        const response = await axios.get(PROVINCES_API_URL);
        const locations = response.data;
        await VietnamLocation.insertMany(locations);
        process.exit(0);
    } catch (error) {
        console.error("Có lỗi xảy ra:", error.message);
        process.exit(1);
    }
};

seedData();