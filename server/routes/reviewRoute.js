const express = require("express");
const router = express.Router();

const { authCustomer } = require("../middlewares/auth"); 
const { getPhoneReviews, createReview } = require("../controllers/reviewController");

router.get("/phone/:phoneModelId", getPhoneReviews);
router.post("/create", authCustomer, createReview); 

module.exports = router;