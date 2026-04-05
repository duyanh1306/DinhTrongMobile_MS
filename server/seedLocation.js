require('dotenv').config(); 
const mongoose = require('mongoose');
const axios = require('axios'); 
const VietnamLocation = require('./models/VietnamLocation'); 

const MONGO_URI = process.env.MONGO_URI; 

const seedData = async () => {
    try {
        if (!MONGO_URI) {
            console.error("❌ Lỗi: Không tìm thấy MONGO_URI trong file .env");
            process.exit(1);
        }

        console.log("Đang kết nối tới MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("Kết nối thành công!");
        await VietnamLocation.deleteMany({});
        
        console.log("Đang tải dữ liệu từ Provinces Open API...");
        const response = await axios.get('https://provinces.open-api.vn/api/?depth=3');
        const locations = response.data;
        
        console.log(`Đã tải xong ${locations.length} Tỉnh/Thành phố. Đang lưu vào Database...`);
        await VietnamLocation.insertMany(locations);

        console.log("Đã nạp toàn bộ dữ liệu địa lý Việt Nam vào Database thành công!");
        process.exit(0);
    } catch (error) {
        console.error("Có lỗi xảy ra:", error.message);
        process.exit(1);
    }
};

seedData();