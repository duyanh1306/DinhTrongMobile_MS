const express = require("express");
const router = express.Router();

// Import đúng tên hàm authCustomer từ file auth.js của bạn
const { authCustomer } = require("../middlewares/auth"); 
const { getPhoneReviews, createReview } = require("../controllers/reviewController");

router.get("/phone/:phoneModelId", getPhoneReviews);

// Chỉ những ai đăng nhập với role CUSTOMER mới được gọi API này
router.post("/create", authCustomer, createReview); 

module.exports = router;